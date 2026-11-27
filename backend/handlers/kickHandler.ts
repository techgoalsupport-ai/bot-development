import { CommandsConfig } from '../types/bot.types.ts';
import {
  DEFAULT_CONFIG,
  DEFAULT_KICK_ANTI_KUDETA_TEMPLATE,
  DEFAULT_KICK_BOT_NOT_ADMIN_TEMPLATE,
  DEFAULT_KICK_SUCCESS_TEMPLATE,
} from '../config/configManager.ts';
import { resolvePlaceholders } from '../services/placeholderHelper.ts';
import { sendConfiguredBotMessage } from '../services/responseConfigHelper.ts';
import {
  extractSenderIdentifiers,
  GroupParticipantLike,
  isGroupParticipantAdmin,
  normalizeJidIdentifier,
} from './hideTagUtils.ts';
import {
  extractKickTargetInfo,
  findGroupParticipant,
  isBotTargetMatch,
  isGroupCreatorParticipant,
  isOwnerTargetMatch,
  isSameGroupParticipant,
  resolveActionJidForParticipant,
  resolveMentionForParticipant,
} from './kickUtils.ts';
import type { DispatcherDeps } from './messageDispatcher.ts';

export interface HandleKickParams {
  sock: any;
  message: any;
  remoteJid: string;
  config: CommandsConfig;
  deps: DispatcherDeps;
}

function enrichCandidatesWithResolver(
  rawJids: string[],
  resolveTargetJid?: (jid: string) => string,
): string[] {
  const result: string[] = [];
  const push = (val?: string | null) => {
    const norm = normalizeJidIdentifier(val);
    if (norm && !result.includes(norm)) {
      result.push(norm);
    }
  };
  for (const jid of rawJids) {
    push(jid);
    if (resolveTargetJid) {
      try {
        push(resolveTargetJid(jid));
      } catch {}
    }
  }
  return result;
}

async function enrichLidToPnCandidates(sock: any, candidates: string[]): Promise<string[]> {
  const result = [...candidates];
  const lidMapping = sock?.signalRepository?.lidMapping;
  if (!lidMapping || typeof lidMapping.getPNForLID !== 'function') {
    return result;
  }
  for (const jid of candidates) {
    if (!jid.endsWith('@lid')) continue;
    try {
      const pn = await lidMapping.getPNForLID(jid);
      const normPn = normalizeJidIdentifier(pn);
      if (normPn && !result.includes(normPn)) {
        result.push(normPn);
      }
    } catch {}
  }
  return result;
}

function didBaileysKickSucceed(removeRes: any): boolean {
  if (!Array.isArray(removeRes) || removeRes.length === 0) {
    return true;
  }
  return removeRes.every((item) => !item?.status || String(item.status) === '200');
}

/**
 * Eksekusi command Kick (Kick, kick, {prefix}Kick, {prefix}kick) di dalam grup WhatsApp:
 * - Hanya berlaku di grup whitelist dan hanya bisa dipicu Admin / Superadmin grup.
 * - Non-admin memicu command: abaikan total tanpa balasan apa pun.
 * - Tanpa reply & tanpa @mention target: abaikan total tanpa balasan apa pun.
 * - Target adalah nomor bot sendiri: abaikan total.
 * - Bot belum menjadi admin grup: kirim pesan `kick_bot_not_admin`.
 * - Target adalah nomor Owner toko (AntiKudeta):
 *   - Admin biasa mencoba mengeluarkan Owner -> kirim pesan `kick_anti_kudeta` + kick admin pelaku.
 *   - Pembuat grup (superadmin) mencoba mengeluarkan Owner -> kirim pesan `kick_anti_kudeta`,
 *     keluarkan nomor Owner dari grup, lalu bot otomatis keluar dari grup tersebut.
 * - Target anggota biasa -> keluarkan anggota & kirim pesan `kick_success`.
 */
export async function handleKickCommand(params: HandleKickParams): Promise<void> {
  const { sock, message, remoteJid, config, deps } = params;

  if (!remoteJid.endsWith('@g.us') || !sock) {
    return;
  }

  let metadata: any = null;
  try {
    metadata = await sock.groupMetadata(remoteJid);
  } catch (err: any) {
    deps.addLog(
      'warning',
      `Gagal membaca metadata grup ${remoteJid} untuk command Kick: ${err?.message || err}`,
    );
    return;
  }

  if (!metadata || !Array.isArray(metadata.participants)) {
    return;
  }

  const participants: GroupParticipantLike[] = metadata.participants;
  const senderCandidates = enrichCandidatesWithResolver(
    extractSenderIdentifiers(message?.key, sock?.user),
    deps.resolveTargetJid,
  );

  // 1. Wajib dipicu oleh Admin / Superadmin grup; jika non-admin, diam total tanpa balasan
  if (!isGroupParticipantAdmin(participants, senderCandidates)) {
    return;
  }

  // 2. Wajib ada target dari reply pesan atau @mention; jika tidak ada, diam total
  const targetInfo = extractKickTargetInfo(message?.message);
  if (!targetInfo) {
    return;
  }

  const targetCandidates = await enrichLidToPnCandidates(
    sock,
    enrichCandidatesWithResolver(targetInfo.candidateJids, deps.resolveTargetJid),
  );

  const targetParticipant = findGroupParticipant(participants, targetCandidates);
  if (!targetParticipant) {
    return;
  }

  // 3. Jika target adalah nomor bot sendiri: abaikan tanpa balasan
  if (isBotTargetMatch(targetParticipant, targetCandidates, sock?.user)) {
    return;
  }

  const senderParticipant = findGroupParticipant(participants, senderCandidates);
  const actorMention = resolveMentionForParticipant(senderParticipant, senderCandidates);
  const targetMention = resolveMentionForParticipant(targetParticipant, targetCandidates);
  const senderActionJid = resolveActionJidForParticipant(senderParticipant, senderCandidates);
  const targetActionJid = resolveActionJidForParticipant(targetParticipant, targetCandidates);

  if (!targetActionJid) {
    return;
  }

  const groupName = metadata.subject || 'Grup WhatsApp';
  const actorName =
    (typeof message?.pushName === 'string' && message.pushName.trim()) ||
    actorMention.mentionDigits ||
    'Admin Grup';
  const targetName = targetMention.mentionDigits || 'Anggota';

  // 4. Verifikasi apakah bot sudah menjadi admin pada grup ini
  const botCandidates = enrichCandidatesWithResolver(
    [sock?.user?.id || '', sock?.user?.lid || ''].filter(Boolean),
    deps.resolveTargetJid,
  );
  const isBotAdmin = isGroupParticipantAdmin(participants, botCandidates);

  if (!isBotAdmin) {
    const botNotAdminTpl =
      config.kickBotNotAdminText || DEFAULT_KICK_BOT_NOT_ADMIN_TEMPLATE;
    const botNotAdminFooterTpl =
      config.kickBotNotAdminFooter ?? DEFAULT_CONFIG.kickBotNotAdminFooter ?? '';
    const ctx = {
      actorNumber: actorMention.mentionDigits,
      actorName,
      senderNumber: actorMention.mentionDigits,
      senderName: actorName,
      targetNumber: targetMention.mentionDigits,
      targetName,
      groupName,
    };

    try {
      await sendConfiguredBotMessage({
        sock,
        config,
        responseKey: 'kick_bot_not_admin',
        targetJid: remoteJid,
        text: resolvePlaceholders(botNotAdminTpl, config, ctx),
        footerText: resolvePlaceholders(botNotAdminFooterTpl, config, ctx),
        ctx,
        quotedMsg: message,
        mentions: actorMention.mentionJid ? [actorMention.mentionJid] : undefined,
        addLog: deps.addLog,
      });
    } catch (err: any) {
      deps.addLog(
        'error',
        `Gagal mengirim pesan bot bukan admin di grup ${remoteJid}: ${err?.message || err}`,
      );
    }
    return;
  }

  // 5. Proteksi AntiKudeta: cek apakah target merupakan nomor Owner toko
  const ownerNumber = config.storeInfo?.ownerNumber || '';
  const targetIsOwner = isOwnerTargetMatch(targetParticipant, targetCandidates, ownerNumber);

  if (targetIsOwner) {
    // Jika owner memicu kick ke pesannya sendiri, abaikan agar tidak self-kick
    if (senderParticipant && isSameGroupParticipant(senderParticipant, targetParticipant)) {
      return;
    }

    const ownerDisplayName = config.storeInfo?.ownerName?.trim() || 'Owner';
    const effectiveConfig: CommandsConfig = {
      ...config,
      storeInfo: {
        ...config.storeInfo,
        ownerName: ownerDisplayName,
      },
    };

    const antiKudetaTpl =
      config.kickAntiKudetaText || DEFAULT_KICK_ANTI_KUDETA_TEMPLATE;
    const antiKudetaFooterTpl =
      config.kickAntiKudetaFooter ?? DEFAULT_CONFIG.kickAntiKudetaFooter ?? '';

    const ctx = {
      actorNumber: actorMention.mentionDigits,
      actorName,
      senderNumber: actorMention.mentionDigits,
      senderName: actorName,
      targetNumber: targetMention.mentionDigits,
      targetName: ownerDisplayName,
      groupName,
    };

    const senderIsCreator = isGroupCreatorParticipant(
      senderParticipant,
      metadata.owner,
      metadata.ownerPn,
    );

    const executeCreatorBreakaway = async () => {
      try {
        await sock.groupParticipantsUpdate(remoteJid, [targetActionJid], 'remove');
        deps.addLog(
          'warning',
          `🛡️ [AntiKudeta] Nomor Owner (${ownerDisplayName}) dikeluarkan lebih dulu dari grup ${groupName} karena kudeta oleh pembuat grup.`,
        );
      } catch (ownerKickErr: any) {
        deps.addLog(
          'warning',
          `[AntiKudeta] Tidak dapat mengeluarkan nomor owner sebelum keluar grup (${ownerKickErr?.message || ownerKickErr}). Melanjutkan keluar grup otomatis.`,
        );
      }

      try {
        await sock.groupLeave(remoteJid);
        deps.addLog(
          'warning',
          `🚪 [AntiKudeta] Bot otomatis keluar dari grup "${groupName}" (${remoteJid}) karena grup dianggap memutus kerja sama dengan owner.`,
        );
      } catch (leaveErr: any) {
        deps.addLog(
          'error',
          `[AntiKudeta] Gagal keluar otomatis dari grup ${remoteJid}: ${leaveErr?.message || leaveErr}`,
        );
      }
    };

    try {
      await sendConfiguredBotMessage({
        sock,
        config: effectiveConfig,
        responseKey: 'kick_anti_kudeta',
        targetJid: remoteJid,
        text: resolvePlaceholders(antiKudetaTpl, effectiveConfig, ctx),
        footerText: resolvePlaceholders(antiKudetaFooterTpl, effectiveConfig, ctx),
        ctx,
        quotedMsg: message,
        mentions: actorMention.mentionJid ? [actorMention.mentionJid] : undefined,
        addLog: deps.addLog,
      });
    } catch (msgErr: any) {
      deps.addLog(
        'error',
        `Gagal mengirim notifikasi AntiKudeta ke grup ${remoteJid}: ${msgErr?.message || msgErr}`,
      );
    }

    if (senderIsCreator) {
      await executeCreatorBreakaway();
      return;
    }

    // Admin biasa mencoba kick Owner -> keluarkan admin pelaku
    try {
      const kickActorRes = await sock.groupParticipantsUpdate(
        remoteJid,
        [senderActionJid],
        'remove',
      );
      if (!didBaileysKickSucceed(kickActorRes)) {
        // Fallback bila WhatsApp menolak karena pelaku ternyata superadmin
        await executeCreatorBreakaway();
        return;
      }
      deps.addLog(
        'warning',
        `🛡️ [AntiKudeta] ${actorName} (${senderActionJid}) dikeluarkan dari grup "${groupName}" karena mencoba meng-kick Owner (${ownerDisplayName}).`,
      );
    } catch (kickErr: any) {
      deps.addLog(
        'warning',
        `[AntiKudeta] Gagal mengeluarkan admin pelaku (${kickErr?.message || kickErr}), beralih ke prosedur keluar owner & bot.`,
      );
      await executeCreatorBreakaway();
    }
    return;
  }

  // 6. Target anggota biasa (bukan owner & bukan pembuat grup) -> keluarkan target
  if (isGroupCreatorParticipant(targetParticipant, metadata.owner, metadata.ownerPn)) {
    return;
  }

  try {
    const removeRes = await sock.groupParticipantsUpdate(
      remoteJid,
      [targetActionJid],
      'remove',
    );
    if (!didBaileysKickSucceed(removeRes)) {
      deps.addLog(
        'warning',
        `Gagal mengeluarkan ${targetActionJid} di grup ${groupName}: status ditolak WhatsApp.`,
      );
      return;
    }

    const successTpl = config.kickSuccessText || DEFAULT_KICK_SUCCESS_TEMPLATE;
    const successFooterTpl =
      config.kickSuccessFooter ?? DEFAULT_CONFIG.kickSuccessFooter ?? '';

    const ctx = {
      actorNumber: actorMention.mentionDigits,
      actorName,
      senderNumber: actorMention.mentionDigits,
      senderName: actorName,
      targetNumber: targetMention.mentionDigits,
      targetName,
      groupName,
    };

    const mentions = Array.from(
      new Set([targetMention.mentionJid, actorMention.mentionJid].filter(Boolean)),
    );

    await sendConfiguredBotMessage({
      sock,
      config,
      responseKey: 'kick_success',
      targetJid: remoteJid,
      text: resolvePlaceholders(successTpl, config, ctx),
      footerText: resolvePlaceholders(successFooterTpl, config, ctx),
      ctx,
      quotedMsg: message,
      mentions,
      addLog: deps.addLog,
    });

    deps.addLog(
      'success',
      `👢 Berhasil mengeluarkan ${targetActionJid} dari grup "${groupName}" oleh ${actorName}.`,
    );
  } catch (err: any) {
    deps.addLog(
      'error',
      `Gagal mengeksekusi command Kick di grup ${remoteJid}: ${err?.message || err}`,
    );
  }
}

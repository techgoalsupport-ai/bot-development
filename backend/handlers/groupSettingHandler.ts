import { CommandsConfig } from '../types/bot.types.ts';
import {
  DEFAULT_CLOSE_ALREADY_TEMPLATE,
  DEFAULT_CLOSE_BOT_NOT_ADMIN_TEMPLATE,
  DEFAULT_CLOSE_SUCCESS_TEMPLATE,
  DEFAULT_CONFIG,
  DEFAULT_OPEN_ALREADY_TEMPLATE,
  DEFAULT_OPEN_BOT_NOT_ADMIN_TEMPLATE,
  DEFAULT_OPEN_SUCCESS_TEMPLATE,
} from '../config/configManager.ts';
import { resolvePlaceholders } from '../services/placeholderHelper.ts';
import { sendConfiguredBotMessage } from '../services/responseConfigHelper.ts';
import {
  extractSenderIdentifiers,
  GroupParticipantLike,
  isGroupParticipantAdmin,
  normalizeJidIdentifier,
} from './hideTagUtils.ts';
import { findGroupParticipant, resolveMentionForParticipant } from './kickUtils.ts';
import type { GroupSettingAction } from './groupSettingUtils.ts';
import type { DispatcherDeps } from './messageDispatcher.ts';

export interface HandleGroupSettingParams {
  sock: any;
  message: any;
  remoteJid: string;
  action: GroupSettingAction;
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

/**
 * Eksekusi command Open & Close di dalam grup WhatsApp:
 * - Hanya berlaku di grup whitelist dan hanya dapat dipicu Admin / Superadmin grup.
 * - Non-admin memicu command: abaikan total tanpa balasan apa pun.
 * - Bot belum menjadi admin grup: kirim pesan `open_bot_not_admin` / `close_bot_not_admin`.
 * - Kondisi grup sudah sesuai target (sudah dibuka / sudah ditutup): kirim pesan `open_already` / `close_already`.
 * - Berhasil mengubah pengaturan grup via `groupSettingUpdate`: kirim pesan `open_success` / `close_success`.
 */
export async function handleGroupSettingCommand(
  params: HandleGroupSettingParams,
): Promise<void> {
  const { sock, message, remoteJid, action, config, deps } = params;

  if (!remoteJid.endsWith('@g.us') || !sock) {
    return;
  }

  let metadata: any = null;
  try {
    metadata = await sock.groupMetadata(remoteJid);
  } catch (err: any) {
    deps.addLog(
      'warning',
      `Gagal membaca metadata grup ${remoteJid} untuk command ${action}: ${err?.message || err}`,
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

  // 1. Wajib dipicu Admin / Superadmin grup; jika anggota biasa, abaikan diam-diam tanpa balasan
  if (!isGroupParticipantAdmin(participants, senderCandidates)) {
    return;
  }

  const senderParticipant = findGroupParticipant(participants, senderCandidates);
  const actorMention = resolveMentionForParticipant(senderParticipant, senderCandidates);
  const groupName = metadata.subject || 'Grup WhatsApp';
  const actorName =
    (typeof message?.pushName === 'string' && message.pushName.trim()) ||
    actorMention.mentionDigits ||
    'Admin Grup';

  const ctx = {
    actorNumber: actorMention.mentionDigits,
    actorName,
    senderNumber: actorMention.mentionDigits,
    senderName: actorName,
    groupName,
  };
  const mentions = actorMention.mentionJid ? [actorMention.mentionJid] : undefined;

  // 2. Verifikasi apakah nomor bot sudah menjadi admin grup
  const botCandidates = enrichCandidatesWithResolver(
    [sock?.user?.id || '', sock?.user?.lid || ''].filter(Boolean),
    deps.resolveTargetJid,
  );
  const isBotAdmin = isGroupParticipantAdmin(participants, botCandidates);

  if (!isBotAdmin) {
    const responseKey = action === 'open' ? 'open_bot_not_admin' : 'close_bot_not_admin';
    const textTpl =
      action === 'open'
        ? config.openBotNotAdminText || DEFAULT_OPEN_BOT_NOT_ADMIN_TEMPLATE
        : config.closeBotNotAdminText || DEFAULT_CLOSE_BOT_NOT_ADMIN_TEMPLATE;
    const footerTpl =
      action === 'open'
        ? (config.openBotNotAdminFooter ?? DEFAULT_CONFIG.openBotNotAdminFooter ?? '')
        : (config.closeBotNotAdminFooter ?? DEFAULT_CONFIG.closeBotNotAdminFooter ?? '');

    try {
      await sendConfiguredBotMessage({
        sock,
        config,
        responseKey,
        targetJid: remoteJid,
        text: resolvePlaceholders(textTpl, config, ctx),
        footerText: resolvePlaceholders(footerTpl, config, ctx),
        ctx,
        quotedMsg: message,
        mentions,
        addLog: deps.addLog,
      });
    } catch (err: any) {
      deps.addLog(
        'error',
        `Gagal mengirim pesan bot bukan admin (${action}) di grup ${remoteJid}: ${err?.message || err}`,
      );
    }
    return;
  }

  // 3. Periksa kondisi grup saat ini (metadata.announce === true berarti grup sedang ditutup / hanya admin)
  const isCurrentlyClosed = Boolean(metadata.announce);
  const isAlreadyMatching =
    (action === 'close' && isCurrentlyClosed) ||
    (action === 'open' && !isCurrentlyClosed);

  if (isAlreadyMatching) {
    const responseKey = action === 'open' ? 'open_already' : 'close_already';
    const textTpl =
      action === 'open'
        ? config.openAlreadyText || DEFAULT_OPEN_ALREADY_TEMPLATE
        : config.closeAlreadyText || DEFAULT_CLOSE_ALREADY_TEMPLATE;
    const footerTpl =
      action === 'open'
        ? (config.openAlreadyFooter ?? DEFAULT_CONFIG.openAlreadyFooter ?? '')
        : (config.closeAlreadyFooter ?? DEFAULT_CONFIG.closeAlreadyFooter ?? '');

    try {
      await sendConfiguredBotMessage({
        sock,
        config,
        responseKey,
        targetJid: remoteJid,
        text: resolvePlaceholders(textTpl, config, ctx),
        footerText: resolvePlaceholders(footerTpl, config, ctx),
        ctx,
        quotedMsg: message,
        mentions,
        addLog: deps.addLog,
      });
    } catch (err: any) {
      deps.addLog(
        'error',
        `Gagal mengirim pesan kondisi grup (${action}) di ${remoteJid}: ${err?.message || err}`,
      );
    }
    return;
  }

  // 4. Ubah pengaturan grup melalui Baileys
  const targetSetting = action === 'close' ? 'announcement' : 'not_announcement';
  try {
    await sock.groupSettingUpdate(remoteJid, targetSetting);

    const responseKey = action === 'open' ? 'open_success' : 'close_success';
    const textTpl =
      action === 'open'
        ? config.openSuccessText || DEFAULT_OPEN_SUCCESS_TEMPLATE
        : config.closeSuccessText || DEFAULT_CLOSE_SUCCESS_TEMPLATE;
    const footerTpl =
      action === 'open'
        ? (config.openSuccessFooter ?? DEFAULT_CONFIG.openSuccessFooter ?? '')
        : (config.closeSuccessFooter ?? DEFAULT_CONFIG.closeSuccessFooter ?? '');

    await sendConfiguredBotMessage({
      sock,
      config,
      responseKey,
      targetJid: remoteJid,
      text: resolvePlaceholders(textTpl, config, ctx),
      footerText: resolvePlaceholders(footerTpl, config, ctx),
      ctx,
      quotedMsg: message,
      mentions,
      addLog: deps.addLog,
    });

    deps.addLog(
      'success',
      action === 'open'
        ? `🔓 Grup "${groupName}" dibuka oleh ${actorName}.`
        : `🔒 Grup "${groupName}" ditutup oleh ${actorName}.`,
    );
  } catch (err: any) {
    deps.addLog(
      'error',
      `Gagal mengubah pengaturan grup (${action}) di ${remoteJid}: ${err?.message || err}`,
    );
  }
}

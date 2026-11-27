import { ALLOWED_PREFIXES } from '../types/bot.types.ts';
import { normalizeIndonesianPhone } from '../services/placeholderHelper.ts';
import {
  BotUserLike,
  GroupParticipantLike,
  normalizeJidIdentifier,
  unwrapWaMessage,
} from './hideTagUtils.ts';

export interface ParsedKickCommand {
  isMatch: boolean;
  usedPrefix: string;
  hasMentionText: boolean;
}

export interface KickTargetInfo {
  primaryTargetJid: string;
  source: 'reply' | 'mention';
  candidateJids: string[];
}

/**
 * Deteksi command Kick di grup:
 * - Tanpa prefix: Kick, kick
 * - Dengan prefix resmi: {prefix}Kick, {prefix}kick
 * - Mendukung reply pesan target maupun mention (@nomor/@nama)
 */
export function parseKickCommand(rawText: string): ParsedKickCommand {
  const trimmed = (rawText || '').trim();
  if (!trimmed) {
    return { isMatch: false, usedPrefix: '', hasMentionText: false };
  }

  const firstChar = trimmed.charAt(0);
  const usedPrefix = ALLOWED_PREFIXES.includes(firstChar) ? firstChar : '';
  const body = usedPrefix ? trimmed.slice(1).trim() : trimmed;

  if (!body) {
    return { isMatch: false, usedPrefix: '', hasMentionText: false };
  }

  if (/^kick$/i.test(body)) {
    return { isMatch: true, usedPrefix, hasMentionText: false };
  }

  if (/^kick\s+@/i.test(body)) {
    return { isMatch: true, usedPrefix, hasMentionText: true };
  }

  return { isMatch: false, usedPrefix: '', hasMentionText: false };
}

/**
 * Ambil contextInfo dari segala jenis pembungkus pesan WhatsApp (teks maupun caption media).
 */
export function extractAnyContextInfo(rawMessage: any): any | null {
  const msg = unwrapWaMessage(rawMessage);
  if (!msg || typeof msg !== 'object') return null;

  const candidates = [
    msg.extendedTextMessage?.contextInfo,
    msg.imageMessage?.contextInfo,
    msg.videoMessage?.contextInfo,
    msg.documentMessage?.contextInfo,
    msg.audioMessage?.contextInfo,
    msg.stickerMessage?.contextInfo,
    msg.buttonsResponseMessage?.contextInfo,
    msg.templateButtonReplyMessage?.contextInfo,
    msg.listResponseMessage?.contextInfo,
  ];

  for (const ctx of candidates) {
    if (ctx && typeof ctx === 'object') {
      return ctx;
    }
  }
  return null;
}

/**
 * Ekstrak JID target untuk command Kick:
 * 1. Prioritas utama: pesan yang di-reply (quotedMessage -> participant).
 * 2. Alternatif: user pertama yang di-@mention pada pesan command.
 */
export function extractKickTargetInfo(rawMessage: any): KickTargetInfo | null {
  const ctx = extractAnyContextInfo(rawMessage);
  if (!ctx) return null;

  if (ctx.quotedMessage && ctx.participant) {
    const primary = normalizeJidIdentifier(ctx.participant);
    if (primary) {
      const candidates = [primary];
      const alt = normalizeJidIdentifier(ctx.participantAlt);
      if (alt && !candidates.includes(alt)) {
        candidates.push(alt);
      }
      return {
        primaryTargetJid: primary,
        source: 'reply',
        candidateJids: candidates,
      };
    }
  }

  const mentionedList = Array.isArray(ctx.mentionedJid) ? ctx.mentionedJid : [];
  const normalizedMentions = mentionedList
    .map((j: unknown) => (typeof j === 'string' ? normalizeJidIdentifier(j) : ''))
    .filter(Boolean);

  if (normalizedMentions.length > 0) {
    return {
      primaryTargetJid: normalizedMentions[0],
      source: 'mention',
      candidateJids: [normalizedMentions[0]],
    };
  }

  return null;
}

export function getParticipantAllIdentifiers(
  participant?: GroupParticipantLike | null,
): string[] {
  if (!participant) return [];
  const ids: string[] = [];
  const push = (val?: string | null) => {
    const norm = normalizeJidIdentifier(val);
    if (norm && !ids.includes(norm)) {
      ids.push(norm);
    }
  };
  push(participant.id);
  push(participant.lid);
  push(participant.phoneNumber);
  return ids;
}

export function findGroupParticipant(
  participants: GroupParticipantLike[] | undefined | null,
  candidateJids: string[],
): GroupParticipantLike | null {
  if (!Array.isArray(participants) || participants.length === 0 || candidateJids.length === 0) {
    return null;
  }

  const candidateSet = new Set(
    candidateJids.map((j) => normalizeJidIdentifier(j)).filter(Boolean),
  );
  if (candidateSet.size === 0) return null;

  for (const participant of participants) {
    const pIds = getParticipantAllIdentifiers(participant);
    if (pIds.some((id) => candidateSet.has(id))) {
      return participant;
    }
  }

  return null;
}

export function isSameGroupParticipant(
  a?: GroupParticipantLike | null,
  b?: GroupParticipantLike | null,
): boolean {
  if (!a || !b) return false;
  const aIds = getParticipantAllIdentifiers(a);
  const bSet = new Set(getParticipantAllIdentifiers(b));
  return aIds.some((id) => bSet.has(id));
}

export function resolveActionJidForParticipant(
  participant: GroupParticipantLike | null | undefined,
  fallbackJids: string[],
): string {
  const pId = normalizeJidIdentifier(participant?.id);
  if (pId) return pId;
  const pPhone = normalizeJidIdentifier(participant?.phoneNumber);
  if (pPhone) return pPhone;
  const pLid = normalizeJidIdentifier(participant?.lid);
  if (pLid) return pLid;
  for (const fb of fallbackJids) {
    const norm = normalizeJidIdentifier(fb);
    if (norm) return norm;
  }
  return '';
}

export function resolveMentionForParticipant(
  participant: GroupParticipantLike | null | undefined,
  fallbackJids: string[],
): { mentionJid: string; mentionDigits: string } {
  const mentionJid = resolveActionJidForParticipant(participant, fallbackJids);
  const mentionDigits = mentionJid ? mentionJid.split('@')[0] : '';
  return { mentionJid, mentionDigits };
}

export function isBotTargetMatch(
  targetParticipant: GroupParticipantLike | null | undefined,
  targetCandidateJids: string[],
  botUser?: BotUserLike | null,
): boolean {
  const botSet = new Set(
    [normalizeJidIdentifier(botUser?.id), normalizeJidIdentifier(botUser?.lid)].filter(Boolean),
  );
  if (botSet.size === 0) return false;

  const targetIds = new Set([
    ...getParticipantAllIdentifiers(targetParticipant),
    ...targetCandidateJids.map((j) => normalizeJidIdentifier(j)).filter(Boolean),
  ]);

  for (const id of targetIds) {
    if (botSet.has(id)) return true;
  }
  return false;
}

export function isOwnerTargetMatch(
  targetParticipant: GroupParticipantLike | null | undefined,
  targetCandidateJids: string[],
  ownerNumber?: string | null,
): boolean {
  const cleanOwner = normalizeIndonesianPhone(ownerNumber);
  if (!cleanOwner) return false;

  const allIds = [
    ...getParticipantAllIdentifiers(targetParticipant),
    ...targetCandidateJids.map((j) => normalizeJidIdentifier(j)).filter(Boolean),
  ];

  for (const jid of allIds) {
    if (!jid) continue;
    // Hanya cocokkan nomor telepon PN (bukan ID acak @lid) kecuali bagian user memang nomor telepon
    if (jid.endsWith('@lid')) continue;
    const digits = normalizeIndonesianPhone(jid.split('@')[0]);
    if (digits && digits === cleanOwner) {
      return true;
    }
  }

  return false;
}

export function isGroupCreatorParticipant(
  participant: GroupParticipantLike | null | undefined,
  groupOwner?: string | null,
  groupOwnerPn?: string | null,
): boolean {
  if (!participant) return false;
  if ((participant.admin || '').toLowerCase() === 'superadmin') {
    return true;
  }
  const ownerCandidates = [
    normalizeJidIdentifier(groupOwner),
    normalizeJidIdentifier(groupOwnerPn),
  ].filter(Boolean);
  if (ownerCandidates.length === 0) return false;

  const pIds = getParticipantAllIdentifiers(participant);
  return pIds.some((id) => ownerCandidates.includes(id));
}

// Pelacak ID dan signature pesan keluar bot agar tidak memicu loop respon diri sendiri

export const botSentMessageIds = new Set<string>();

export function markMessageAsBotSent(id?: string): void {
  if (!id) return;
  botSentMessageIds.add(id);
  if (botSentMessageIds.size > 1000) {
    const oldest = botSentMessageIds.values().next().value;
    if (oldest) botSentMessageIds.delete(oldest);
  }
}

const pendingBotSentSignatures = new Map<string, number>();

function buildBotSentSignatureKey(remoteJid?: string, text?: string): string {
  const jid = (remoteJid || '').trim().toLowerCase();
  const cleanText = (text || '').trim();
  return `${jid}::${cleanText}`;
}

export function markOutgoingTextAsBotSent(remoteJid?: string, text?: string): void {
  if (!remoteJid || !text || !text.trim()) return;
  const now = Date.now();
  const key = buildBotSentSignatureKey(remoteJid, text);
  pendingBotSentSignatures.set(key, now + 15000);
  if (pendingBotSentSignatures.size > 500) {
    for (const [k, exp] of pendingBotSentSignatures.entries()) {
      if (exp <= now) pendingBotSentSignatures.delete(k);
    }
  }
}

export function isPendingBotSentText(remoteJid?: string, text?: string): boolean {
  if (!remoteJid || !text || !text.trim()) return false;
  const key = buildBotSentSignatureKey(remoteJid, text);
  const expiresAt = pendingBotSentSignatures.get(key);
  if (!expiresAt) return false;
  if (Date.now() > expiresAt) {
    pendingBotSentSignatures.delete(key);
    return false;
  }
  return true;
}

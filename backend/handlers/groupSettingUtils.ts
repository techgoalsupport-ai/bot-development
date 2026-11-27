import { ALLOWED_PREFIXES } from '../types/bot.types.ts';

export type GroupSettingAction = 'open' | 'close';

export interface ParsedGroupSettingCommand {
  isMatch: boolean;
  action: GroupSettingAction | null;
  usedPrefix: string;
}

/**
 * Deteksi command pengaturan grup Open & Close:
 * - Open: Open, open, {prefix}Open, {prefix}open
 * - Close: Close, close, {prefix}Close, {prefix}close
 * Hanya cocok untuk kata perintah persis agar obrolan biasa seperti "open order" tidak ikut terpicu.
 */
export function parseGroupSettingCommand(rawText: string): ParsedGroupSettingCommand {
  const trimmed = (rawText || '').trim();
  if (!trimmed) {
    return { isMatch: false, action: null, usedPrefix: '' };
  }

  const firstChar = trimmed.charAt(0);
  const usedPrefix = ALLOWED_PREFIXES.includes(firstChar) ? firstChar : '';
  const body = usedPrefix ? trimmed.slice(1).trim() : trimmed;

  if (!body) {
    return { isMatch: false, action: null, usedPrefix: '' };
  }

  if (/^open$/i.test(body)) {
    return { isMatch: true, action: 'open', usedPrefix };
  }

  if (/^close$/i.test(body)) {
    return { isMatch: true, action: 'close', usedPrefix };
  }

  return { isMatch: false, action: null, usedPrefix: '' };
}

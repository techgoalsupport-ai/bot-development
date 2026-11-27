import fs from 'fs';
import {
  CommandsConfig,
  MandatoryButtonRole,
  ResponseConfigKey,
  ResponseExtraConfig,
  WhatsAppButton,
} from '../types/bot.types.ts';
import {
  normalizeIndonesianPhone,
  resolvePlaceholders,
  VariantPlaceholderContext,
} from './placeholderHelper.ts';
import { getPicturePath } from './mediaManager.ts';
import { getActiveTenantId } from '../database/tenantContext.ts';
import {
  markMessageAsBotSent,
  markOutgoingTextAsBotSent,
} from '../handlers/botSentTracker.ts';

export const ALL_RESPONSE_CONFIG_KEYS: ResponseConfigKey[] = [
  'menu',
  'list',
  'carousel',
  'invoice',
  'confirm_summary',
  'confirm_promo_input',
  'confirm_promo_valid',
  'confirm_promo_invalid',
  'payment_success_dm',
  'payment_success_group',
  'payment_expired',
  'payment_error',
  'order_group_notif',
  'stock_empty',
  'checkout_session_expired',
  'promo_cancelled',
  'contact_owner_empty',
  'contact_admin_empty',
  'expiry_warning_owner',
  'kick_anti_kudeta',
  'kick_bot_not_admin',
  'kick_success',
  'open_bot_not_admin',
  'open_already',
  'open_success',
  'close_bot_not_admin',
  'close_already',
  'close_success',
];

export const MANDATORY_BUTTON_SPECS: Partial<Record<ResponseConfigKey, WhatsAppButton[]>> = {
  carousel: [
    {
      id: 'mandatory_carousel_order',
      type: 'quick_reply',
      name: '🛒 Order',
      output: 'order_var:{produkName}|{varian}',
      mandatory: true,
      mandatoryRole: 'carousel_order',
    },
  ],
  list: [
    {
      id: 'mandatory_list_dropdown',
      type: 'quick_reply',
      name: '📋 Pilih Produk',
      output: 'single_select_dropdown',
      mandatory: true,
      mandatoryRole: 'list_dropdown',
    },
  ],
  invoice: [
    {
      id: 'mandatory_invoice_pay',
      type: 'cta_url',
      name: '💳 Bayar Sekarang',
      output: '{paymentUrl}',
      mandatory: true,
      mandatoryRole: 'invoice_pay_url',
    },
    {
      id: 'mandatory_invoice_admin',
      type: 'cta_url',
      name: '📞 Hubungi Admin',
      output: '{invoiceAdminUrl}',
      mandatory: true,
      mandatoryRole: 'invoice_contact_admin',
    },
  ],
  confirm_summary: [
    {
      id: 'mandatory_confirm_promo',
      type: 'quick_reply',
      name: '🎟️ Pakai Kode Promo',
      output: 'checkout_promo',
      mandatory: true,
      mandatoryRole: 'confirm_promo',
    },
    {
      id: 'mandatory_confirm_direct',
      type: 'quick_reply',
      name: '⚡ Lanjut Bayar (Normal)',
      output: 'checkout_direct',
      mandatory: true,
      mandatoryRole: 'confirm_direct',
    },
  ],
};

export function getDefaultButtonsForResponse(key: ResponseConfigKey | string): WhatsAppButton[] {
  const normalizedKey = (key === 'confirmation' ? 'confirm_summary' : key) as ResponseConfigKey;
  const mandatory = (MANDATORY_BUTTON_SPECS[normalizedKey] || []).map((b) => ({ ...b }));
  if (normalizedKey === 'carousel') {
    return [
      ...mandatory,
      {
        id: 'default_carousel_contact_admin',
        type: 'quick_reply',
        name: '📞 Contact Admin',
        output: 'contact_admin',
        triggerAction: 'admin',
      },
    ];
  }
  return mandatory;
}

function findMatchingMandatoryButton(
  spec: WhatsAppButton,
  rawList: WhatsAppButton[],
): WhatsAppButton | undefined {
  return rawList.find((b) => {
    if (!b || typeof b !== 'object') return false;
    if (b.id === spec.id) return true;
    if (spec.mandatoryRole && b.mandatoryRole === spec.mandatoryRole) return true;
    const out = (b.output || '').trim();
    if (spec.mandatoryRole === 'carousel_order' && out.startsWith('order_var:')) return true;
    if (spec.mandatoryRole === 'list_dropdown' && out === 'single_select_dropdown') return true;
    if (spec.mandatoryRole === 'invoice_pay_url' && out === '{paymentUrl}') return true;
    if (
      spec.mandatoryRole === 'invoice_contact_admin' &&
      (out === '{invoiceAdminUrl}' || out === 'invoice_contact_admin')
    ) {
      return true;
    }
    if (spec.mandatoryRole === 'confirm_promo' && out === 'checkout_promo') return true;
    if (spec.mandatoryRole === 'confirm_direct' && out === 'checkout_direct') return true;
    return false;
  });
}

function isMandatorySpecMatch(btn: WhatsAppButton, specs: WhatsAppButton[]): boolean {
  if (!btn || typeof btn !== 'object') return false;
  if (btn.mandatory && btn.mandatoryRole) {
    return specs.some((s) => s.mandatoryRole === btn.mandatoryRole || s.id === btn.id);
  }
  return specs.some((spec) => {
    if (btn.id === spec.id) return true;
    const out = (btn.output || '').trim();
    if (spec.mandatoryRole === 'carousel_order' && out.startsWith('order_var:')) return true;
    if (spec.mandatoryRole === 'list_dropdown' && out === 'single_select_dropdown') return true;
    if (spec.mandatoryRole === 'invoice_pay_url' && out === '{paymentUrl}') return true;
    if (
      spec.mandatoryRole === 'invoice_contact_admin' &&
      (out === '{invoiceAdminUrl}' || out === 'invoice_contact_admin')
    ) {
      return true;
    }
    if (spec.mandatoryRole === 'confirm_promo' && out === 'checkout_promo') return true;
    if (spec.mandatoryRole === 'confirm_direct' && out === 'checkout_direct') return true;
    return false;
  });
}

/**
 * Menggabungkan daftar tombol dengan tombol wajib untuk kategori respon tertentu.
 * Tombol wajib tidak dapat dihapus dan hanya nama tampilannya (name) yang dapat diubah.
 */
export function mergeMandatoryButtons(
  key: ResponseConfigKey | string,
  rawButtons?: WhatsAppButton[] | null,
): WhatsAppButton[] {
  const normalizedKey = (key === 'confirmation' ? 'confirm_summary' : key) as ResponseConfigKey;
  const specs = MANDATORY_BUTTON_SPECS[normalizedKey] || [];
  const inputList = Array.isArray(rawButtons) ? rawButtons : [];

  const mergedMandatory: WhatsAppButton[] = specs.map((spec) => {
    const matched = findMatchingMandatoryButton(spec, inputList);
    const customName = matched?.name && matched.name.trim() ? matched.name.trim() : spec.name;
    return {
      ...spec,
      name: customName,
      mandatory: true,
    };
  });

  const customButtons: WhatsAppButton[] = [];
  const seenIds = new Set<string>(mergedMandatory.map((b) => b.id));

  for (const item of inputList) {
    if (!item || typeof item !== 'object') continue;
    if (isMandatorySpecMatch(item, specs)) continue;
    const cleanId =
      typeof item.id === 'string' && item.id.trim()
        ? item.id.trim()
        : `btn_${Math.random().toString(36).slice(2, 10)}`;
    if (seenIds.has(cleanId)) continue;
    seenIds.add(cleanId);
    customButtons.push({
      ...item,
      id: cleanId,
      name: (item.name || '').trim() || 'Tombol',
      output: item.output || '',
      mandatory: false,
      mandatoryRole: undefined,
    });
  }

  return [...mergedMandatory, ...customButtons];
}

export function getResponseExtraConfig(
  config: CommandsConfig,
  key: ResponseConfigKey,
): ResponseExtraConfig {
  if (key === 'menu') {
    return {
      includeMedia: Boolean(config.includeMedia),
      selectedPicture: config.selectedPicture || '',
      buttons: Array.isArray(config.menuButtons) ? config.menuButtons : [],
    };
  }

  const rawExtra = config.responseExtras?.[key];
  const hasExplicitButtons = Array.isArray(rawExtra?.buttons);
  const baseButtons = hasExplicitButtons
    ? rawExtra!.buttons!
    : getDefaultButtonsForResponse(key);

  if (key === 'carousel') {
    return {
      includeMedia: true,
      selectedPicture: config.carouselPicture || config.selectedPicture || '',
      buttons: mergeMandatoryButtons('carousel', baseButtons),
    };
  }

  if (key === 'invoice') {
    return {
      includeMedia: false,
      selectedPicture: '',
      buttons: mergeMandatoryButtons('invoice', baseButtons),
    };
  }

  return {
    includeMedia: Boolean(rawExtra?.includeMedia),
    selectedPicture: rawExtra?.selectedPicture || config.selectedPicture || '',
    buttons: mergeMandatoryButtons(key, baseButtons),
  };
}

export function getResponseButtons(
  config: CommandsConfig,
  key: ResponseConfigKey,
): WhatsAppButton[] {
  return getResponseExtraConfig(config, key).buttons || [];
}

/**
 * Mengumpulkan seluruh tombol interaktif dari semua respon bot agar
 * dispatcher mampu mengenali quick_reply, triggerAction, dan vCard dari respon manapun.
 */
export function getAllConfiguredButtons(config: CommandsConfig): WhatsAppButton[] {
  const result: WhatsAppButton[] = [];
  if (Array.isArray(config.menuButtons)) {
    result.push(...config.menuButtons);
  }
  for (const key of ALL_RESPONSE_CONFIG_KEYS) {
    if (key === 'menu') continue;
    const btns = config.responseExtras?.[key]?.buttons;
    if (Array.isArray(btns)) {
      result.push(...btns);
    }
  }
  return result;
}

/**
 * Mengonversi WhatsAppButton ke format nativeFlow @itsliaaa/baileys.
 * Mengembalikan null bila URL invoice admin/payment tidak valid/kosong agar tidak ditolak WA.
 */
export function convertButtonToNativeFlow(
  btn: WhatsAppButton,
  config: CommandsConfig,
  ctx?: VariantPlaceholderContext,
): any | null {
  const displayName = resolvePlaceholders(btn.name, config, ctx).trim();

  // Tangani tombol wajib secara eksplisit terlebih dahulu
  if (btn.mandatoryRole === 'invoice_pay_url') {
    const payUrl = (ctx?.paymentUrl || '').trim();
    if (!payUrl) return null;
    const validUrl = payUrl.startsWith('http') ? payUrl : `https://${payUrl}`;
    return {
      text: displayName || '💳 Bayar Sekarang',
      url: validUrl,
    };
  }

  if (btn.mandatoryRole === 'invoice_contact_admin') {
    const cleanAdmin = normalizeIndonesianPhone(config.storeInfo?.adminNumber);
    const cleanOwner = normalizeIndonesianPhone(config.storeInfo?.ownerNumber);
    const targetPhone = cleanAdmin || cleanOwner;
    if (!targetPhone) {
      return {
        text: displayName || '📞 Hubungi Admin',
        id: 'invoice_contact_admin',
      };
    }
    return {
      text: displayName || '📞 Hubungi Admin',
      url: `https://wa.me/${targetPhone}`,
    };
  }

  if (btn.mandatoryRole === 'confirm_promo') {
    return {
      text: displayName || '🎟️ Pakai Kode Promo',
      id: 'checkout_promo',
    };
  }

  if (btn.mandatoryRole === 'confirm_direct') {
    return {
      text: displayName || '⚡ Lanjut Bayar (Normal)',
      id: 'checkout_direct',
    };
  }

  switch (btn.type) {
    case 'cta_url': {
      const rawUrl = resolvePlaceholders(btn.output || '', config, ctx).trim();
      if (!rawUrl) return null;
      const validUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
      return {
        text: displayName || '🌐 Kunjungi Website',
        url: validUrl,
      };
    }
    case 'cta_call': {
      const rawPhone = resolvePlaceholders(
        btn.callPhoneNumber || btn.output || '',
        config,
        ctx,
      );
      const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
      return {
        text: displayName || '📞 Telepon',
        call: cleanPhone || '',
      };
    }
    case 'cta_copy': {
      const rawCopy = resolvePlaceholders(btn.output || '', config, ctx);
      return {
        text: displayName || '📋 Salin',
        copy: rawCopy || displayName,
      };
    }
    case 'vcard': {
      const rawPhone = resolvePlaceholders(
        btn.callPhoneNumber || btn.output || '',
        config,
        ctx,
      );
      const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
      return {
        text: displayName || '👤 Kontak Admin',
        id: `vcard_${cleanPhone || btn.id}`,
      };
    }
    case 'cta_reminder': {
      const reminderId = resolvePlaceholders(btn.output || btn.name || 'reminder', config, ctx);
      return {
        name: 'cta_reminder',
        buttonParamsJson: JSON.stringify({
          display_text: displayName || '⏰ Pengingat',
          id: reminderId,
        }),
      };
    }
    case 'cta_cancel_reminder': {
      const reminderId = resolvePlaceholders(btn.output || btn.name || 'reminder', config, ctx);
      return {
        name: 'cta_cancel_reminder',
        buttonParamsJson: JSON.stringify({
          display_text: displayName || '🔕 Batalkan Pengingat',
          id: reminderId,
        }),
      };
    }
    case 'quick_reply':
    default: {
      const actionId = resolvePlaceholders(
        btn.output || btn.name || 'menu_item',
        config,
        ctx,
      );
      return {
        text: displayName || '👉 Klik Di Sini',
        id: actionId,
      };
    }
  }
}

/**
 * Mengonversi WhatsAppButton ke format nativeFlowMessage.buttons resmi untuk kartu Carousel.
 */
export function convertButtonToCarouselButton(
  btn: WhatsAppButton,
  config: CommandsConfig,
  ctx?: VariantPlaceholderContext,
): any | null {
  const displayName = resolvePlaceholders(btn.name, config, ctx).trim();

  if (btn.mandatoryRole === 'carousel_order') {
    const pName = ctx?.name || '';
    const vName = ctx?.variant || '';
    return {
      name: 'quick_reply',
      buttonParamsJson: JSON.stringify({
        display_text: displayName || '🛒 Order',
        id: `order_var:${encodeURIComponent(pName)}|${encodeURIComponent(vName)}`,
      }),
    };
  }

  switch (btn.type) {
    case 'cta_url': {
      const rawUrl = resolvePlaceholders(btn.output || '', config, ctx).trim();
      if (!rawUrl) return null;
      const validUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
      return {
        name: 'cta_url',
        buttonParamsJson: JSON.stringify({
          display_text: displayName || '🌐 Kunjungi Website',
          url: validUrl,
          merchant_url: validUrl,
        }),
      };
    }
    case 'cta_copy': {
      const rawCopy = resolvePlaceholders(btn.output || '', config, ctx);
      return {
        name: 'cta_copy',
        buttonParamsJson: JSON.stringify({
          display_text: displayName || '📋 Salin',
          copy_code: rawCopy || displayName,
        }),
      };
    }
    case 'cta_call': {
      const rawPhone = resolvePlaceholders(
        btn.callPhoneNumber || btn.output || '',
        config,
        ctx,
      );
      const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
      return {
        name: 'cta_call',
        buttonParamsJson: JSON.stringify({
          display_text: displayName || '📞 Telepon',
          phone_number: cleanPhone || '',
        }),
      };
    }
    case 'vcard': {
      const rawPhone = resolvePlaceholders(
        btn.callPhoneNumber || btn.output || '',
        config,
        ctx,
      );
      const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
      return {
        name: 'quick_reply',
        buttonParamsJson: JSON.stringify({
          display_text: displayName || '👤 Kontak',
          id: `vcard_${cleanPhone || btn.id}`,
        }),
      };
    }
    case 'cta_reminder': {
      const reminderId = resolvePlaceholders(btn.output || btn.name || 'reminder', config, ctx);
      return {
        name: 'cta_reminder',
        buttonParamsJson: JSON.stringify({
          display_text: displayName || '⏰ Pengingat',
          id: reminderId,
        }),
      };
    }
    case 'cta_cancel_reminder': {
      const reminderId = resolvePlaceholders(btn.output || btn.name || 'reminder', config, ctx);
      return {
        name: 'cta_cancel_reminder',
        buttonParamsJson: JSON.stringify({
          display_text: displayName || '🔕 Batalkan Pengingat',
          id: reminderId,
        }),
      };
    }
    case 'quick_reply':
    default: {
      const actionId = resolvePlaceholders(
        btn.output || btn.name || 'carousel_btn',
        config,
        ctx,
      );
      return {
        name: 'quick_reply',
        buttonParamsJson: JSON.stringify({
          display_text: displayName || '👉 Klik',
          id: actionId,
        }),
      };
    }
  }
}

export function loadImageBufferForResponse(
  sock: any,
  config: CommandsConfig,
  key: ResponseConfigKey,
  addLog?: (type: 'info' | 'success' | 'warning' | 'error' | 'code', msg: string) => void,
): Buffer | undefined {
  const extra = getResponseExtraConfig(config, key);
  if (!extra.includeMedia || !extra.selectedPicture) return undefined;

  try {
    const tenantId = (sock as any)?.tenantId || getActiveTenantId();
    const picPath = getPicturePath(tenantId, extra.selectedPicture);
    if (picPath && fs.existsSync(picPath)) {
      const buf = fs.readFileSync(picPath);
      if (buf.length <= 10 * 1024 * 1024) {
        return buf;
      }
      if (addLog) {
        addLog(
          'warning',
          `Ukuran gambar ${key} (${(buf.length / (1024 * 1024)).toFixed(2)} MB) melebihi batas 10MB.`,
        );
      }
    }
  } catch (err: any) {
    if (addLog) {
      addLog('warning', `Gagal membaca gambar untuk ${key}: ${err?.message || err}`);
    }
  }
  return undefined;
}

export interface SendConfiguredMessageParams {
  sock: any;
  config: CommandsConfig;
  responseKey: ResponseConfigKey;
  targetJid: string;
  text: string;
  footerText?: string;
  ctx?: VariantPlaceholderContext;
  quotedMsg?: any;
  mentions?: string[];
  extraButtons?: WhatsAppButton[];
  overrideButtons?: WhatsAppButton[];
  addLog?: (type: 'info' | 'success' | 'warning' | 'error' | 'code', msg: string) => void;
}

/**
 * Helper terpusat untuk mengirimkan respon bot WhatsApp dengan dukungan:
 * - Pengaturan foto ON/OFF + pemilih gambar per-respon
 * - Tombol wajib terkunci + tombol kustom
 * - Footer konsisten
 * - Fallback otomatis bila nativeFlow gagal
 */
export async function sendConfiguredBotMessage(
  params: SendConfiguredMessageParams,
): Promise<any> {
  const {
    sock,
    config,
    responseKey,
    targetJid,
    text,
    footerText = '',
    ctx,
    quotedMsg,
    mentions,
    extraButtons = [],
    overrideButtons,
    addLog,
  } = params;

  if (!sock) return null;

  const configuredButtons = overrideButtons ?? getResponseButtons(config, responseKey);
  const combinedButtons = [...configuredButtons, ...extraButtons];
  const nativeFlowButtons = combinedButtons
    .map((btn) => convertButtonToNativeFlow(btn, config, ctx))
    .filter(Boolean);

  const imageInput = loadImageBufferForResponse(sock, config, responseKey, addLog);
  const sendOpts: any = {};
  if (quotedMsg) sendOpts.quoted = quotedMsg;

  markOutgoingTextAsBotSent(targetJid, text);

  // Kasus 1: Tidak ada tombol interaktif (0 tombol)
  // Sama seperti command Menu: tanpa tombol interaktif, footer tidak disertakan sama sekali.
  if (nativeFlowButtons.length === 0) {
    try {
      const payload: any = imageInput
        ? { image: imageInput, caption: text }
        : { text };
      if (mentions && mentions.length > 0) payload.mentions = mentions;

      const sent = await sock.sendMessage(
        targetJid,
        payload,
        Object.keys(sendOpts).length > 0 ? sendOpts : undefined,
      );
      markMessageAsBotSent(sent?.key?.id);
      return sent;
    } catch (err: any) {
      if (addLog) {
        addLog('error', `Gagal mengirim pesan ${responseKey}: ${err?.message || err}`);
      }
      throw err;
    }
  }

  // Kasus 2: Memiliki tombol interaktif
  try {
    const payload: any = imageInput
      ? {
          image: imageInput,
          caption: text,
          footer: footerText,
          nativeFlow: nativeFlowButtons,
        }
      : {
          text,
          footer: footerText,
          nativeFlow: nativeFlowButtons,
        };
    if (mentions && mentions.length > 0) payload.mentions = mentions;

    const sent = await sock.sendMessage(
      targetJid,
      payload,
      Object.keys(sendOpts).length > 0 ? sendOpts : undefined,
    );
    markMessageAsBotSent(sent?.key?.id);
    return sent;
  } catch (interactiveErr: any) {
    if (addLog) {
      addLog(
        'warning',
        `Pengiriman interaktif ${responseKey} gagal (${interactiveErr?.message || interactiveErr}), fallback teks/gambar...`,
      );
    }
    const fallbackText = footerText && footerText.trim()
      ? `${text}\n\n_${footerText.trim()}_`
      : text;
    const fallbackPayload: any = imageInput
      ? { image: imageInput, caption: fallbackText }
      : { text: fallbackText };
    if (mentions && mentions.length > 0) fallbackPayload.mentions = mentions;

    const sent = await sock.sendMessage(
      targetJid,
      fallbackPayload,
      Object.keys(sendOpts).length > 0 ? sendOpts : undefined,
    );
    markMessageAsBotSent(sent?.key?.id);
    return sent;
  }
}

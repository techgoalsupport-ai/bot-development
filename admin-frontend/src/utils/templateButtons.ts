import {
  MandatoryButtonRole,
  QuickReplyTriggerAction,
  TemplateCategory,
  WhatsAppButton,
  WhatsAppButtonType,
} from '../types/admin.types.ts';

export type SimplifiedMandatoryRole =
  | 'order'
  | 'dropdown'
  | 'pay'
  | 'admin'
  | 'promo'
  | 'direct';

export const MANDATORY_ROLE_ALIAS_TO_CANONICAL: Record<string, MandatoryButtonRole> = {
  order: 'carousel_order',
  carousel_order: 'carousel_order',
  dropdown: 'list_dropdown',
  list_dropdown: 'list_dropdown',
  pay: 'invoice_pay_url',
  invoice_pay_url: 'invoice_pay_url',
  admin: 'invoice_contact_admin',
  invoice_contact_admin: 'invoice_contact_admin',
  promo: 'confirm_promo',
  confirm_promo: 'confirm_promo',
  direct: 'confirm_direct',
  confirm_direct: 'confirm_direct',
};

export const CANONICAL_ROLE_TO_SIMPLIFIED: Record<MandatoryButtonRole, SimplifiedMandatoryRole> = {
  carousel_order: 'order',
  list_dropdown: 'dropdown',
  invoice_pay_url: 'pay',
  invoice_contact_admin: 'admin',
  confirm_promo: 'promo',
  confirm_direct: 'direct',
};

const QUICK_REPLY_DEFAULT_OUTPUT: Record<Exclude<QuickReplyTriggerAction, 'unknown'>, string> = {
  list: '.list',
  menu: '.menu',
  owner: 'contact_owner',
  admin: 'contact_admin',
};

export const MANDATORY_BUTTON_SPECS: Partial<Record<TemplateCategory, WhatsAppButton[]>> = {
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

function normalizeShortButtonType(rawType: unknown, rawObj: Record<string, any>): WhatsAppButtonType {
  const cleaned = typeof rawType === 'string' ? rawType.trim().toLowerCase() : '';
  switch (cleaned) {
    case 'reply':
    case 'quick_reply':
      return 'quick_reply';
    case 'url':
    case 'link':
    case 'cta_url':
      return 'cta_url';
    case 'copy':
    case 'cta_copy':
      return 'cta_copy';
    case 'call':
    case 'phone':
    case 'cta_call':
      return 'cta_call';
    case 'vcard':
    case 'contact':
      return 'vcard';
    case 'reminder':
    case 'cta_reminder':
      return 'cta_reminder';
    case 'cancel_reminder':
    case 'cta_cancel_reminder':
      return 'cta_cancel_reminder';
    default: {
      if (typeof rawObj.url === 'string' && rawObj.url.trim()) return 'cta_url';
      if (typeof rawObj.phone === 'string' && rawObj.phone.trim()) {
        return typeof rawObj.contactName === 'string' && rawObj.contactName.trim()
          ? 'vcard'
          : 'cta_call';
      }
      return 'quick_reply';
    }
  }
}

function normalizeTriggerAction(rawAction: unknown): QuickReplyTriggerAction | undefined {
  if (typeof rawAction !== 'string') return undefined;
  const cleaned = rawAction.trim().toLowerCase();
  if (
    cleaned === 'list' ||
    cleaned === 'menu' ||
    cleaned === 'owner' ||
    cleaned === 'admin' ||
    cleaned === 'unknown'
  ) {
    return cleaned;
  }
  return undefined;
}

export function normalizeJsonButtonInput(
  raw: unknown,
  category: TemplateCategory,
): { button: WhatsAppButton | null; warnings: string[] } {
  if (!raw || typeof raw !== 'object') {
    return { button: null, warnings: [] };
  }

  const obj = raw as Record<string, any>;
  const warnings: string[] = [];
  const normalizedCat = (category === 'confirmation' ? 'confirm_summary' : category) as TemplateCategory;
  const specs = MANDATORY_BUTTON_SPECS[normalizedCat] || [];

  // 1. Cek shortcut `role` atau `mandatoryRole` untuk tombol wajib
  const rawRoleKey =
    typeof obj.role === 'string'
      ? obj.role.trim().toLowerCase()
      : typeof obj.mandatoryRole === 'string'
        ? obj.mandatoryRole.trim().toLowerCase()
        : '';
  const canonicalRole = rawRoleKey ? MANDATORY_ROLE_ALIAS_TO_CANONICAL[rawRoleKey] : undefined;

  if (canonicalRole) {
    const spec = specs.find((s) => s.mandatoryRole === canonicalRole);
    if (spec) {
      const explicitType =
        typeof obj.type === 'string' && obj.type.trim()
          ? normalizeShortButtonType(obj.type, obj)
          : undefined;
      const explicitValue =
        obj.output ?? obj.value ?? obj.url ?? obj.text ?? undefined;
      const explicitValueStr =
        typeof explicitValue === 'string' ? explicitValue.trim() : '';

      if (
        (explicitType && explicitType !== spec.type) ||
        (explicitValueStr && explicitValueStr !== spec.output)
      ) {
        const displayRole = CANONICAL_ROLE_TO_SIMPLIFIED[canonicalRole] || canonicalRole;
        warnings.push(
          `[${normalizedCat}] Tombol wajib "${displayRole}" dikunci sistem ke tipe "${spec.type}" (${spec.output}); hanya label nama "${String(obj.name || spec.name).trim()}" yang digunakan.`
        );
      }

      const customName =
        typeof obj.name === 'string' && obj.name.trim() ? obj.name.trim() : spec.name;
      return {
        button: {
          ...spec,
          name: customName,
          mandatory: true,
        },
        warnings,
      };
    }
  }

  // 2. Normalisasi tombol kustom (mendukung format sederhana & format lama)
  const resolvedType = normalizeShortButtonType(obj.type, obj);
  const rawName = typeof obj.name === 'string' ? obj.name.trim() : '';
  const rawId = typeof obj.id === 'string' && obj.id.trim() ? obj.id.trim() : '';

  if (resolvedType === 'cta_url') {
    const resolvedUrl = String(obj.url ?? obj.value ?? obj.output ?? '').trim();
    return {
      button: {
        id: rawId,
        type: 'cta_url',
        name: rawName || '🌐 Kunjungi Link',
        output: resolvedUrl,
      },
      warnings,
    };
  }

  if (resolvedType === 'cta_copy') {
    const resolvedCopy = String(obj.value ?? obj.text ?? obj.output ?? '').trim();
    return {
      button: {
        id: rawId,
        type: 'cta_copy',
        name: rawName || '📋 Salin Teks',
        output: resolvedCopy,
      },
      warnings,
    };
  }

  if (resolvedType === 'cta_call') {
    const resolvedPhone = String(
      obj.phone ?? obj.callPhoneNumber ?? obj.value ?? obj.output ?? ''
    ).trim();
    return {
      button: {
        id: rawId,
        type: 'cta_call',
        name: rawName || '📞 Hubungi',
        output: resolvedPhone,
        callPhoneNumber: resolvedPhone,
      },
      warnings,
    };
  }

  if (resolvedType === 'vcard') {
    const resolvedPhone = String(
      obj.phone ?? obj.callPhoneNumber ?? obj.value ?? obj.output ?? ''
    ).trim();
    const resolvedContactName = String(
      obj.contactName ?? obj.callTargetName ?? rawName
    ).trim();
    return {
      button: {
        id: rawId,
        type: 'vcard',
        name: rawName || '👤 Simpan Kontak',
        output: resolvedPhone,
        callPhoneNumber: resolvedPhone,
        callTargetName: resolvedContactName || rawName || 'Kontak',
      },
      warnings,
    };
  }

  if (resolvedType === 'cta_reminder' || resolvedType === 'cta_cancel_reminder') {
    const resolvedVal = String(obj.value ?? obj.output ?? rawName).trim();
    return {
      button: {
        id: rawId,
        type: resolvedType,
        name:
          rawName ||
          (resolvedType === 'cta_reminder' ? '⏰ Ingatkan Saya' : '🔕 Batalkan Pengingat'),
        output: resolvedVal,
      },
      warnings,
    };
  }

  // quick_reply (reply)
  let resolvedAction = normalizeTriggerAction(
    obj.action ?? obj.trigger ?? obj.triggerAction
  );
  let resolvedOutput = String(obj.output ?? obj.value ?? obj.text ?? '').trim();

  if (!resolvedOutput && resolvedAction && resolvedAction !== 'unknown') {
    resolvedOutput = QUICK_REPLY_DEFAULT_OUTPUT[resolvedAction];
  }

  if (!resolvedAction && resolvedOutput) {
    const lowerOut = resolvedOutput.toLowerCase();
    if (lowerOut === '.list' || lowerOut === 'list') resolvedAction = 'list';
    else if (lowerOut === '.menu' || lowerOut === 'menu') resolvedAction = 'menu';
    else if (lowerOut === 'contact_owner') resolvedAction = 'owner';
    else if (lowerOut === 'contact_admin') resolvedAction = 'admin';
  }

  if (!resolvedOutput) {
    const slug = (rawName || 'tombol')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    resolvedOutput = slug || 'menu_item';
  }

  return {
    button: {
      id: rawId,
      type: 'quick_reply',
      name: rawName || '👉 Klik Di Sini',
      output: resolvedOutput,
      ...(resolvedAction && resolvedAction !== 'unknown'
        ? { triggerAction: resolvedAction }
        : resolvedAction === 'unknown'
          ? { triggerAction: 'unknown' }
          : {}),
    },
    warnings,
  };
}

export function normalizeJsonButtonsList(
  rawButtons: unknown,
  category: TemplateCategory,
): { buttons: WhatsAppButton[]; warnings: string[] } {
  if (!Array.isArray(rawButtons)) {
    return { buttons: getDefaultButtonsForCategory(category), warnings: [] };
  }

  const normalizedList: WhatsAppButton[] = [];
  const allWarnings: string[] = [];

  for (const rawBtn of rawButtons) {
    const { button, warnings } = normalizeJsonButtonInput(rawBtn, category);
    if (warnings.length > 0) allWarnings.push(...warnings);
    if (button) normalizedList.push(button);
  }

  return {
    buttons: normalizedList,
    warnings: allWarnings,
  };
}

export function simplifyButtonForExport(btn: WhatsAppButton): Record<string, any> {
  if (btn.mandatory && btn.mandatoryRole) {
    const shortRole = CANONICAL_ROLE_TO_SIMPLIFIED[btn.mandatoryRole] || btn.mandatoryRole;
    return {
      role: shortRole,
      name: btn.name,
    };
  }

  switch (btn.type) {
    case 'cta_url':
      return {
        type: 'url',
        name: btn.name,
        url: btn.output || '',
      };
    case 'cta_copy':
      return {
        type: 'copy',
        name: btn.name,
        value: btn.output || '',
      };
    case 'cta_call':
      return {
        type: 'call',
        name: btn.name,
        phone: btn.callPhoneNumber || btn.output || '',
      };
    case 'vcard':
      return {
        type: 'vcard',
        name: btn.name,
        contactName: btn.callTargetName || btn.name,
        phone: btn.callPhoneNumber || btn.output || '',
      };
    case 'cta_reminder':
    case 'cta_cancel_reminder':
      return {
        type: btn.type,
        name: btn.name,
        ...(btn.output ? { value: btn.output } : {}),
      };
    case 'quick_reply':
    default: {
      const action = btn.triggerAction;
      const out = (btn.output || '').trim();
      const result: Record<string, any> = {
        type: 'reply',
        name: btn.name,
      };
      if (action && action !== 'unknown') {
        result.action = action;
        if (out && out !== QUICK_REPLY_DEFAULT_OUTPUT[action]) {
          result.value = out;
        }
      } else if (out) {
        result.value = out;
      }
      return result;
    }
  }
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

export function getDefaultButtonsForCategory(category: TemplateCategory): WhatsAppButton[] {
  const normalized = category === 'confirmation' ? 'confirm_summary' : category;
  const mandatory = (MANDATORY_BUTTON_SPECS[normalized] || []).map((b) => ({ ...b }));
  if (normalized === 'carousel') {
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

export function mergeMandatoryButtonsForCategory(
  category: TemplateCategory,
  rawButtons?: WhatsAppButton[] | null,
): WhatsAppButton[] {
  const normalized = category === 'confirmation' ? 'confirm_summary' : category;
  const specs = MANDATORY_BUTTON_SPECS[normalized] || [];
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

export function buildTemplateSignature(input: {
  category: TemplateCategory;
  name: string;
  content: string;
  footer_text?: string;
  buttons?: WhatsAppButton[] | null;
}): string {
  const normalizedCategory = (
    input.category === 'confirmation' ? 'confirm_summary' : String(input.category || '').trim()
  ) as TemplateCategory;
  const normalizedName = String(input.name || '').trim();
  const normalizedContent = String(input.content || '').replace(/\r\n/g, '\n').trim();
  const normalizedFooter = String(input.footer_text || '').replace(/\r\n/g, '\n').trim();
  const mergedButtons = mergeMandatoryButtonsForCategory(
    normalizedCategory,
    Array.isArray(input.buttons) ? input.buttons : [],
  );
  const canonicalButtons = mergedButtons.map((b) => ({
    type: b.type,
    name: String(b.name || '').trim(),
    output: String(b.output || '').trim(),
    triggerAction:
      b.triggerAction && b.triggerAction !== 'unknown' ? b.triggerAction : undefined,
    callTargetName: b.callTargetName ? String(b.callTargetName).trim() : undefined,
    callPhoneNumber: b.callPhoneNumber ? String(b.callPhoneNumber).trim() : undefined,
    mandatory: Boolean(b.mandatory),
    mandatoryRole: b.mandatoryRole || undefined,
  }));

  return JSON.stringify({
    category: normalizedCategory,
    name: normalizedName,
    content: normalizedContent,
    footer_text: normalizedFooter,
    buttons: canonicalButtons,
  });
}

export function getSuggestedFooterForCategory(category: TemplateCategory): string {
  switch (category) {
    case 'menu':
      return '{webLink} • Otomatis';
    case 'list':
      return '{webLink} • Katalog Resmi';
    case 'carousel':
      return '{webLink} • Geser Kartu';
    case 'invoice':
      return '{webLink} • Verifikasi Otomatis';
    case 'confirm_summary':
    case 'confirmation':
    case 'confirm_promo_input':
      return '{storeName} • Konfirmasi Pesanan';
    case 'confirm_promo_valid':
      return '{storeName} • Promo Berhasil';
    case 'confirm_promo_invalid':
      return '{storeName} • Cek Kode Promo';
    case 'payment_success_dm':
      return '{storeName} • Pembayaran Terverifikasi';
    case 'payment_success_group':
      return '';
    case 'payment_expired':
      return '{storeName} • Invoice Kedaluwarsa';
    case 'payment_error':
      return '{storeName} • Layanan Pelanggan';
    case 'order_group_notif':
      return '{storeName} • Pesanan WhatsApp';
    case 'stock_empty':
      return '{storeName} • Status Stok';
    case 'checkout_session_expired':
      return '{storeName} • Sesi Berakhir';
    case 'promo_cancelled':
      return '{storeName} • Info Kupon';
    case 'contact_owner_empty':
      return '{storeName} • Informasi Owner';
    case 'contact_admin_empty':
      return '{storeName} • Layanan Pelanggan';
    case 'expiry_warning_owner':
      return '{storeName} Official • Notifikasi Otomatis';
    case 'kick_anti_kudeta':
      return '{storeName} • Proteksi AntiKudeta';
    case 'kick_bot_not_admin':
      return '{storeName} • Moderasi Grup';
    case 'kick_success':
      return '{storeName} • Moderasi Grup';
    case 'open_bot_not_admin':
    case 'open_already':
    case 'open_success':
    case 'close_bot_not_admin':
    case 'close_already':
    case 'close_success':
      return '{storeName} • Moderasi Grup';
    default:
      return '{storeName} • Otomatis';
  }
}

export const ALL_IMPORTABLE_CATEGORIES: TemplateCategory[] = [
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

export function formatGroupedJsonWithBlankLines(grouped: Record<string, any>): string {
  const keys = Object.keys(grouped);
  if (keys.length === 0) return '{\n}';

  const blocks = keys.map((key, idx) => {
    const formattedVal = JSON.stringify(grouped[key], null, 2)
      .split('\n')
      .map((line, lineIdx) => (lineIdx === 0 ? line : `  ${line}`))
      .join('\n');
    const comma = idx < keys.length - 1 ? ',' : '';
    return `  ${JSON.stringify(key)}: ${formattedVal}${comma}`;
  });

  return `{\n${blocks.join('\n\n')}\n}`;
}

export function buildSampleMultiCategoryJson(): string {
  const buildEntry = (
    category: TemplateCategory,
    name: string,
    content: string,
    buttons?: WhatsAppButton[],
  ) => {
    const footer = getSuggestedFooterForCategory(category);
    const entry: Record<string, any> = { name, content };
    if (footer) entry.footer = footer;
    if (buttons && buttons.length > 0) {
      entry.buttons = buttons.map(simplifyButtonForExport);
    }
    return entry;
  };

  const sample: Record<string, any> = {
    menu: buildEntry(
      'menu',
      'Paket Menu Utama',
      'Halo kak! Selamat datang di {storeName} ✨\n\nSilakan pilih layanan yang ingin Anda pesan melalui tombol interaktif di bawah ini:',
      [
        {
          id: 'sample_menu_list',
          type: 'quick_reply',
          name: '📋 Daftar Produk',
          output: '.list',
          triggerAction: 'list',
        },
      ],
    ),
    list: buildEntry(
      'list',
      'Paket List Katalog',
      '📋 *DAFTAR LAYANAN & HARGA {storeName}*\n\n{daftarProduk}\n\nSilakan pilih produk yang tersedia:',
      getDefaultButtonsForCategory('list'),
    ),
    carousel: buildEntry(
      'carousel',
      'Paket Carousel Produk',
      '🛍️ *PRODUK TERSEDIA*\nSilakan geser kartu di bawah untuk memilih varian:',
      getDefaultButtonsForCategory('carousel'),
    ),
    invoice: buildEntry(
      'invoice',
      'Paket Invoice QRIS',
      '🧾 *INVOICE PEMBAYARAN QRIS*\nHalo kak, pesanan varian *{varian}* untuk produk *{produkName}* telah diterbitkan!\n\n• *ID Order:* `{orderId}`\n• *Total Bayar:* *Rp {finalPrice}*',
      getDefaultButtonsForCategory('invoice'),
    ),
    confirm_summary: buildEntry(
      'confirm_summary',
      'Paket Ringkasan Order',
      '🛒 *RINCIAN PESANAN*\n• *Produk:* {produkName}\n• *Varian:* {varian}\n• *Harga Normal:* Rp {price}\n\nPilih tombol di bawah untuk pakai promo atau langsung bayar.',
      getDefaultButtonsForCategory('confirm_summary'),
    ),
    confirm_promo_input: buildEntry(
      'confirm_promo_input',
      'Paket Input Kode Promo',
      '🎟️ *MASUKKAN KODE PROMO*\nKetik kode promo Anda atau ketik *BATAL* untuk harga normal.',
    ),
    confirm_promo_valid: buildEntry(
      'confirm_promo_valid',
      'Paket Promo Valid',
      '🎉 *PROMO DITERIMA!*\nKode: *{promoCode}* (-Rp {discount})\nTotal Bayar: *Rp {finalPrice}*',
    ),
    confirm_promo_invalid: buildEntry(
      'confirm_promo_invalid',
      'Paket Promo Invalid',
      '⚠️ Kode promo *{promoCode}* tidak dapat digunakan ({reason}). Ketik kode lain atau *BATAL*.',
    ),
    payment_success_dm: buildEntry(
      'payment_success_dm',
      'Paket Transaksi Lunas DM',
      '🎉 *PEMBAYARAN LUNAS!*\nTerima kasih kak *{customerName}*, order #{orderId} sebesar *Rp {finalPrice}* telah lunas.',
    ),
    payment_success_group: buildEntry(
      'payment_success_group',
      'Paket Transaksi Lunas Grup',
      '✅ Pembayaran untuk *{produkName} ({varian})* oleh @{customerNumber} telah *LUNAS*!',
    ),
    payment_expired: buildEntry(
      'payment_expired',
      'Paket Invoice Kedaluwarsa',
      '⏰ Waktu pembayaran pesanan *{produkName} ({varian})* (Order #{orderId}) telah berakhir.',
    ),
    payment_error: buildEntry(
      'payment_error',
      'Paket Kendala Gateway',
      '⚠️ Terjadi kendala saat menerbitkan kode QRIS: {errorMessage}. Silakan hubungi admin.',
    ),
    order_group_notif: buildEntry(
      'order_group_notif',
      'Paket Alur Order Grup',
      'Halo @{customerNumber}, rincian pesanan *{produkName} ({varian})* telah kami kirim ke DM Anda.',
    ),
    stock_empty: buildEntry(
      'stock_empty',
      'Paket Stok Kosong',
      'Maaf kak @{customerNumber}, stok produk *{produkName} ({varian})* sedang habis.',
    ),
    checkout_session_expired: buildEntry(
      'checkout_session_expired',
      'Paket Sesi Checkout Habis',
      '⏰ Sesi pesanan Anda telah berakhir. Silakan pilih varian kembali di katalog {storeName}.',
    ),
    promo_cancelled: buildEntry(
      'promo_cancelled',
      'Paket Kupon Dibatalkan',
      'Penggunaan kode promo dibatalkan. Menyiapkan invoice QRIS dengan harga normal (Rp {price})...',
    ),
    contact_owner_empty: buildEntry(
      'contact_owner_empty',
      'Paket Kontak Owner Kosong',
      'Informasi tentang owner belum diatur pada toko ini.',
    ),
    contact_admin_empty: buildEntry(
      'contact_admin_empty',
      'Paket Kontak Admin Kosong',
      'Informasi tentang admin belum diatur pada toko ini.',
    ),
    expiry_warning_owner: buildEntry(
      'expiry_warning_owner',
      'Paket Peringatan Masa Sewa',
      '⚠️ *PERINGATAN MASA SEWA BOT*\nHalo *{ownerName}* (*{storeName}*), sisa masa aktif bot: *{remainingTime}* (berakhir {expiryDate} WIB).',
    ),
    kick_anti_kudeta: buildEntry(
      'kick_anti_kudeta',
      'Paket AntiKudeta Grup',
      '[AntiKudeta] @{pelakuNumber} terdeteksi mencoba mengeluarkan {ownerName} (Owner)',
    ),
    kick_bot_not_admin: buildEntry(
      'kick_bot_not_admin',
      'Paket Bot Bukan Admin',
      '⚠️ *Bot Bukan Admin*\nBot belum menjadi admin di grup *{groupName}*, sehingga tidak dapat mengeluarkan anggota.\n\nSilakan jadikan nomor bot sebagai admin grup terlebih dahulu.',
    ),
    kick_success: buildEntry(
      'kick_success',
      'Paket Berhasil Mengeluarkan Anggota',
      '✅ @{targetNumber} berhasil dikeluarkan dari grup *{groupName}* oleh @{pelakuNumber}.',
    ),
    open_bot_not_admin: buildEntry(
      'open_bot_not_admin',
      'Paket Open: Bot Bukan Admin',
      '⚠️ *Bot Bukan Admin*\nBot belum menjadi admin di grup *{groupName}*, sehingga tidak dapat membuka pengaturan chat grup.\n\nSilakan jadikan nomor bot sebagai admin grup terlebih dahulu.',
    ),
    open_already: buildEntry(
      'open_already',
      'Paket Open: Grup Sudah Terbuka',
      'ℹ️ Kondisi grup *{groupName}* saat ini sudah dalam keadaan terbuka (semua anggota dapat mengirim pesan).',
    ),
    open_success: buildEntry(
      'open_success',
      'Paket Open: Berhasil Buka Grup',
      '🔓 Grup *{groupName}* berhasil dibuka oleh @{pelakuNumber}. Sekarang semua anggota dapat mengirim pesan.',
    ),
    close_bot_not_admin: buildEntry(
      'close_bot_not_admin',
      'Paket Close: Bot Bukan Admin',
      '⚠️ *Bot Bukan Admin*\nBot belum menjadi admin di grup *{groupName}*, sehingga tidak dapat menutup pengaturan chat grup.\n\nSilakan jadikan nomor bot sebagai admin grup terlebih dahulu.',
    ),
    close_already: buildEntry(
      'close_already',
      'Paket Close: Grup Sudah Ditutup',
      'ℹ️ Kondisi grup *{groupName}* saat ini sudah dalam keadaan ditutup (hanya admin yang dapat mengirim pesan).',
    ),
    close_success: buildEntry(
      'close_success',
      'Paket Close: Berhasil Tutup Grup',
      '🔒 Grup *{groupName}* berhasil ditutup oleh @{pelakuNumber}. Sekarang hanya admin yang dapat mengirim pesan.',
    ),
  };

  return formatGroupedJsonWithBlankLines(sample);
}

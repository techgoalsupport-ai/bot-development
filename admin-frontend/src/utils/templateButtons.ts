import { TemplateCategory, WhatsAppButton } from '../types/admin.types.ts';

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
    triggerAction: b.triggerAction || undefined,
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
  const sample: Record<string, any> = {
    menu: {
      name: 'Paket Menu Utama',
      content:
        'Halo kak! Selamat datang di {storeName} ✨\n\nSilakan pilih layanan yang ingin Anda pesan melalui tombol interaktif di bawah ini:',
      footer_text: getSuggestedFooterForCategory('menu'),
      buttons: [
        {
          type: 'quick_reply',
          name: '📋 Daftar Produk',
          output: '.list',
          triggerAction: 'list',
        },
      ],
    },
    list: {
      name: 'Paket List Katalog',
      content: '📋 *DAFTAR LAYANAN & HARGA {storeName}*\n\nSilakan pilih produk yang tersedia:',
      footer_text: getSuggestedFooterForCategory('list'),
      buttons: getDefaultButtonsForCategory('list').map(({ id: _id, ...rest }) => rest),
    },
    carousel: {
      name: 'Paket Carousel Produk',
      content: '🛍️ *PRODUK TERSEDIA*\nSilakan geser kartu di bawah untuk memilih varian:',
      footer_text: getSuggestedFooterForCategory('carousel'),
      buttons: getDefaultButtonsForCategory('carousel').map(({ id: _id, ...rest }) => rest),
    },
    invoice: {
      name: 'Paket Invoice QRIS',
      content:
        '🧾 *INVOICE PEMBAYARAN QRIS*\nHalo kak, pesanan varian *{varian}* untuk produk *{produkName}* telah diterbitkan!\n\n• *ID Order:* `{orderId}`\n• *Total Bayar:* *Rp {finalPrice}*',
      footer_text: getSuggestedFooterForCategory('invoice'),
      buttons: getDefaultButtonsForCategory('invoice').map(({ id: _id, ...rest }) => rest),
    },
    confirm_summary: {
      name: 'Paket Ringkasan Order',
      content:
        '🛒 *RINCIAN PESANAN*\n• *Produk:* {produkName}\n• *Varian:* {varian}\n• *Harga Normal:* Rp {price}\n\nPilih tombol di bawah untuk pakai promo atau langsung bayar.',
      footer_text: getSuggestedFooterForCategory('confirm_summary'),
      buttons: getDefaultButtonsForCategory('confirm_summary').map(({ id: _id, ...rest }) => rest),
    },
    confirm_promo_input: {
      name: 'Paket Input Kode Promo',
      content:
        '🎟️ *MASUKKAN KODE PROMO*\nKetik kode promo Anda atau ketik *BATAL* untuk harga normal.',
      footer_text: getSuggestedFooterForCategory('confirm_promo_input'),
      buttons: [],
    },
    confirm_promo_valid: {
      name: 'Paket Promo Valid',
      content:
        '🎉 *PROMO DITERIMA!*\nKode: *{promoCode}* (-Rp {discount})\nTotal Bayar: *Rp {finalPrice}*',
      footer_text: getSuggestedFooterForCategory('confirm_promo_valid'),
      buttons: [],
    },
    confirm_promo_invalid: {
      name: 'Paket Promo Invalid',
      content:
        '⚠️ Kode promo *{promoCode}* tidak dapat digunakan ({reason}). Ketik kode lain atau *BATAL*.',
      footer_text: getSuggestedFooterForCategory('confirm_promo_invalid'),
      buttons: [],
    },
    payment_success_dm: {
      name: 'Paket Transaksi Lunas DM',
      content:
        '🎉 *PEMBAYARAN LUNAS!*\nTerima kasih kak *{customerName}*, order #{orderId} sebesar *Rp {finalPrice}* telah lunas.',
      footer_text: getSuggestedFooterForCategory('payment_success_dm'),
      buttons: [],
    },
    payment_success_group: {
      name: 'Paket Transaksi Lunas Grup',
      content:
        '✅ Pembayaran untuk *{produkName} ({varian})* oleh @{customerNumber} telah *LUNAS*!',
      footer_text: getSuggestedFooterForCategory('payment_success_group'),
      buttons: [],
    },
    payment_expired: {
      name: 'Paket Invoice Kedaluwarsa',
      content:
        '⏰ Waktu pembayaran pesanan *{produkName} ({varian})* (Order #{orderId}) telah berakhir.',
      footer_text: getSuggestedFooterForCategory('payment_expired'),
      buttons: [],
    },
    payment_error: {
      name: 'Paket Kendala Gateway',
      content:
        '⚠️ Terjadi kendala saat menerbitkan kode QRIS: {errorMessage}. Silakan hubungi admin.',
      footer_text: getSuggestedFooterForCategory('payment_error'),
      buttons: [],
    },
    order_group_notif: {
      name: 'Paket Alur Order Grup',
      content:
        'Halo @{customerNumber}, rincian pesanan *{produkName} ({varian})* telah kami kirim ke DM Anda.',
      footer_text: getSuggestedFooterForCategory('order_group_notif'),
      buttons: [],
    },
    stock_empty: {
      name: 'Paket Stok Kosong',
      content:
        'Maaf kak @{customerNumber}, stok produk *{produkName} ({varian})* sedang habis.',
      footer_text: getSuggestedFooterForCategory('stock_empty'),
      buttons: [],
    },
    checkout_session_expired: {
      name: 'Paket Sesi Checkout Habis',
      content:
        '⏰ Sesi pesanan Anda telah berakhir. Silakan pilih varian kembali di katalog {storeName}.',
      footer_text: getSuggestedFooterForCategory('checkout_session_expired'),
      buttons: [],
    },
    promo_cancelled: {
      name: 'Paket Kupon Dibatalkan',
      content:
        'Penggunaan kode promo dibatalkan. Menyiapkan invoice QRIS dengan harga normal (Rp {price})...',
      footer_text: getSuggestedFooterForCategory('promo_cancelled'),
      buttons: [],
    },
    contact_owner_empty: {
      name: 'Paket Kontak Owner Kosong',
      content: 'Informasi tentang owner belum diatur pada toko ini.',
      footer_text: getSuggestedFooterForCategory('contact_owner_empty'),
      buttons: [],
    },
    contact_admin_empty: {
      name: 'Paket Kontak Admin Kosong',
      content: 'Informasi tentang admin belum diatur pada toko ini.',
      footer_text: getSuggestedFooterForCategory('contact_admin_empty'),
      buttons: [],
    },
    expiry_warning_owner: {
      name: 'Paket Peringatan Masa Sewa',
      content:
        '⚠️ *PERINGATAN MASA SEWA BOT*\nHalo *{ownerName}* (*{storeName}*), sisa masa aktif bot: *{remainingTime}* (berakhir {expiryDate} WIB).',
      footer_text: getSuggestedFooterForCategory('expiry_warning_owner'),
      buttons: [],
    },
  };

  return formatGroupedJsonWithBlankLines(sample);
}


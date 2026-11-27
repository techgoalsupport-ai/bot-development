import {
  ResponseConfigKey,
  ResponseExtrasMap,
  WhatsAppButton,
} from '../types/dashboard.types';

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

export function getDefaultButtonsForResponse(key: ResponseConfigKey): WhatsAppButton[] {
  const mandatory = (MANDATORY_BUTTON_SPECS[key] || []).map((b) => ({ ...b }));
  if (key === 'carousel') {
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
  rawList: WhatsAppButton[]
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

export function mergeMandatoryButtons(
  key: ResponseConfigKey,
  rawButtons?: WhatsAppButton[] | null
): WhatsAppButton[] {
  const specs = MANDATORY_BUTTON_SPECS[key] || [];
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

export function createDefaultResponseExtras(): ResponseExtrasMap {
  const extras: ResponseExtrasMap = {};
  for (const key of ALL_RESPONSE_CONFIG_KEYS) {
    if (key === 'menu') continue;
    extras[key] = {
      includeMedia: key === 'carousel',
      selectedPicture: '',
      buttons: getDefaultButtonsForResponse(key),
    };
  }
  return extras;
}

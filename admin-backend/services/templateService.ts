import { getMasterDb } from '../database/masterSqlite.ts';
import {
  MandatoryButtonRole,
  QuickReplyTriggerAction,
  ResponseConfigKey,
  WhatsAppButton,
  WhatsAppButtonType,
} from '../../backend/types/bot.types.ts';
import {
  MANDATORY_BUTTON_SPECS,
  getDefaultButtonsForResponse,
  mergeMandatoryButtons,
} from '../../backend/services/responseConfigHelper.ts';

export type TemplateCategory =
  | 'menu'
  | 'list'
  | 'carousel'
  | 'invoice'
  | 'confirm_summary'
  | 'confirm_promo_input'
  | 'confirm_promo_valid'
  | 'confirm_promo_invalid'
  | 'payment_success_dm'
  | 'payment_success_group'
  | 'payment_expired'
  | 'payment_error'
  | 'order_group_notif'
  | 'stock_empty'
  | 'checkout_session_expired'
  | 'promo_cancelled'
  | 'contact_owner_empty'
  | 'contact_admin_empty'
  | 'expiry_warning_owner'
  | 'kick_anti_kudeta'
  | 'kick_bot_not_admin'
  | 'kick_success'
  | 'open_bot_not_admin'
  | 'open_already'
  | 'open_success'
  | 'close_bot_not_admin'
  | 'close_already'
  | 'close_success'
  | 'confirmation';

export const ALL_TEMPLATE_CATEGORIES: TemplateCategory[] = [
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
  'confirmation',
];

export interface MessageTemplateRecord {
  id: number;
  name: string;
  category: TemplateCategory;
  content: string;
  footer_text: string;
  buttons: WhatsAppButton[];
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface CreateTemplateInput {
  name: string;
  category: TemplateCategory;
  content: string;
  footer_text?: string;
  buttons?: WhatsAppButton[];
  is_active?: boolean | number;
}

export interface UpdateTemplateInput {
  name?: string;
  category?: TemplateCategory;
  content?: string;
  footer_text?: string;
  buttons?: WhatsAppButton[];
  is_active?: boolean | number;
}

const MANDATORY_ROLE_ALIAS_TO_CANONICAL: Record<string, MandatoryButtonRole> = {
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

const CANONICAL_ROLE_TO_SIMPLIFIED: Record<MandatoryButtonRole, string> = {
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
  const normalizedCat = (category === 'confirmation' ? 'confirm_summary' : category) as ResponseConfigKey;
  const specs = MANDATORY_BUTTON_SPECS[normalizedCat] || [];

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
      const explicitValue = obj.output ?? obj.value ?? obj.url ?? obj.text ?? undefined;
      const explicitValueStr =
        typeof explicitValue === 'string' ? explicitValue.trim() : '';

      if (
        (explicitType && explicitType !== spec.type) ||
        (explicitValueStr && explicitValueStr !== spec.output)
      ) {
        const displayRole = CANONICAL_ROLE_TO_SIMPLIFIED[canonicalRole] || canonicalRole;
        warnings.push(
          `[${normalizedCat}] Tombol wajib "${displayRole}" otomatis dinormalisasi ke tipe "${spec.type}" (${spec.output}); hanya nama "${String(obj.name || spec.name).trim()}" yang digunakan.`
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
      ...(resolvedAction ? { triggerAction: resolvedAction } : {}),
    },
    warnings,
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

function hydrateTemplateRow(row: any): MessageTemplateRecord {
  const category = (row.category || 'menu') as TemplateCategory;
  let parsedButtons: WhatsAppButton[] = [];
  let hasStoredButtons = false;
  if (typeof row.buttons_json === 'string' && row.buttons_json.trim()) {
    try {
      const parsed = JSON.parse(row.buttons_json);
      if (Array.isArray(parsed)) {
        parsedButtons = parsed;
        hasStoredButtons = true;
      }
    } catch {}
  }

  const normalizedButtons = mergeMandatoryButtons(
    category,
    hasStoredButtons && parsedButtons.length > 0
      ? parsedButtons
      : hasStoredButtons
        ? []
        : getDefaultButtonsForResponse(category),
  );

  return {
    id: row.id,
    name: row.name,
    category,
    content: row.content,
    footer_text: typeof row.footer_text === 'string' ? row.footer_text : '',
    buttons: normalizedButtons,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function buildTemplateSignature(input: {
  category: TemplateCategory;
  name: string;
  content: string;
  footer_text?: string;
  buttons?: WhatsAppButton[];
}): string {
  const normalizedCategory =
    input.category === 'confirmation' ? 'confirm_summary' : String(input.category || '').trim();
  const normalizedName = String(input.name || '').trim();
  const normalizedContent = String(input.content || '').replace(/\r\n/g, '\n').trim();
  const normalizedFooter = String(input.footer_text || '').replace(/\r\n/g, '\n').trim();
  const mergedButtons = mergeMandatoryButtons(
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

export class TemplateService {
  /**
   * Mengambil semua template (untuk Master Admin)
   */
  static getAllTemplates(category?: string): MessageTemplateRecord[] {
    const db = getMasterDb();
    const rows =
      category && category !== 'all'
        ? db
            .prepare('SELECT * FROM message_templates WHERE category = ? ORDER BY id DESC')
            .all(category)
        : db.prepare('SELECT * FROM message_templates ORDER BY id DESC').all();
    return rows.map(hydrateTemplateRow);
  }

  /**
   * Mengambil template yang aktif berdasarkan kategori spesifik (untuk Dashboard Bot Tenant)
   */
  static getActiveTemplatesByCategory(category: string): MessageTemplateRecord[] {
    const db = getMasterDb();
    const rows =
      category === 'confirm_summary'
        ? db
            .prepare(
              'SELECT * FROM message_templates WHERE (category = ? OR category = ?) AND is_active = 1 ORDER BY id DESC',
            )
            .all('confirm_summary', 'confirmation')
        : db
            .prepare('SELECT * FROM message_templates WHERE category = ? AND is_active = 1 ORDER BY id DESC')
            .all(category);
    return rows.map(hydrateTemplateRow);
  }

  /**
   * Mengambil detail template berdasarkan ID
   */
  static getTemplateById(id: number): MessageTemplateRecord | null {
    const db = getMasterDb();
    const row = db.prepare('SELECT * FROM message_templates WHERE id = ?').get(id);
    return row ? hydrateTemplateRow(row) : null;
  }

  /**
   * Menambahkan template baru (lengkap dengan footer_text dan interactive buttons)
   */
  static createTemplate(input: CreateTemplateInput): MessageTemplateRecord {
    const db = getMasterDb();
    const now = new Date().toISOString();
    const isActive = input.is_active === false || input.is_active === 0 ? 0 : 1;
    const footerText = typeof input.footer_text === 'string' ? input.footer_text.trim() : '';
    const mergedButtons = mergeMandatoryButtons(
      input.category,
      Array.isArray(input.buttons) ? input.buttons : getDefaultButtonsForResponse(input.category),
    );

    const info = db
      .prepare(`
        INSERT INTO message_templates (name, category, content, footer_text, buttons_json, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        input.name.trim(),
        input.category,
        input.content.trim(),
        footerText,
        JSON.stringify(mergedButtons),
        isActive,
        now,
        now,
      );

    return this.getTemplateById(Number(info.lastInsertRowid))!;
  }

  /**
   * Memperbarui template yang sudah ada
   */
  static updateTemplate(id: number, input: UpdateTemplateInput): MessageTemplateRecord | null {
    const db = getMasterDb();
    const existing = this.getTemplateById(id);
    if (!existing) return null;

    const name = input.name !== undefined ? input.name.trim() : existing.name;
    const category = input.category !== undefined ? input.category : existing.category;
    const content = input.content !== undefined ? input.content.trim() : existing.content;
    const footerText =
      input.footer_text !== undefined ? input.footer_text.trim() : existing.footer_text;
    const mergedButtons = mergeMandatoryButtons(
      category,
      input.buttons !== undefined ? input.buttons : existing.buttons,
    );
    const isActive =
      input.is_active !== undefined
        ? input.is_active === true || input.is_active === 1
          ? 1
          : 0
        : existing.is_active;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE message_templates
      SET name = ?, category = ?, content = ?, footer_text = ?, buttons_json = ?, is_active = ?, updated_at = ?
      WHERE id = ?
    `).run(name, category, content, footerText, JSON.stringify(mergedButtons), isActive, now, id);

    return this.getTemplateById(id);
  }

  /**
   * Mengubah status aktif / nonaktif template
   */
  static toggleTemplateStatus(id: number, explicitStatus?: boolean): MessageTemplateRecord | null {
    const db = getMasterDb();
    const existing = this.getTemplateById(id);
    if (!existing) return null;

    const newStatus =
      explicitStatus !== undefined
        ? explicitStatus
          ? 1
          : 0
        : existing.is_active === 1
          ? 0
          : 1;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE message_templates
      SET is_active = ?, updated_at = ?
      WHERE id = ?
    `).run(newStatus, now, id);

    return this.getTemplateById(id);
  }

  /**
   * Menghapus template
   */
  static deleteTemplate(id: number): boolean {
    const db = getMasterDb();
    const info = db.prepare('DELETE FROM message_templates WHERE id = ?').run(id);
    return info.changes > 0;
  }

  /**
   * Mengimpor paket template dari payload JSON (format object per-kategori atau array).
   * Setiap tombol melewati mergeMandatoryButtons agar tombol wajib tetap terkunci (type & output).
   */
  static importTemplatesFromJson(
    payload: unknown,
    options?: { mode?: 'append' | 'replace_category'; defaultActive?: boolean }
  ): {
    importedCount: number;
    skippedCount: number;
    skippedItems: Array<{ category: TemplateCategory; name: string }>;
    templates: MessageTemplateRecord[];
    warnings: string[];
  } {
    const entries: Array<{
      name: string;
      category: TemplateCategory;
      content: string;
      footer_text: string;
      buttons: WhatsAppButton[];
      is_active: number;
    }> = [];
    const warnings: string[] = [];
    const defaultActive = options?.defaultActive === false ? 0 : 1;

    const normalizeSingleEntry = (rawCat: string, item: any, idxLabel: string) => {
      if (!item || typeof item !== 'object') {
        throw new Error(`Format item pada ${idxLabel} harus berupa objek JSON.`);
      }
      const normalizedCat = (rawCat === 'confirmation' ? 'confirm_summary' : rawCat).trim() as TemplateCategory;
      if (!ALL_TEMPLATE_CATEGORIES.includes(normalizedCat)) {
        throw new Error(`Kategori "${rawCat}" pada ${idxLabel} tidak dikenali.`);
      }

      const content = typeof item.content === 'string' ? item.content.trim() : '';
      if (!content) {
        throw new Error(`Field "content" pada kategori "${normalizedCat}" tidak boleh kosong.`);
      }

      const name =
        typeof item.name === 'string' && item.name.trim()
          ? item.name.trim()
          : `Paket ${normalizedCat}`;
      const footerText =
        typeof item.footer === 'string'
          ? item.footer.trim()
          : typeof item.footer_text === 'string'
            ? item.footer_text.trim()
            : '';

      let preparedButtons: WhatsAppButton[];
      if (Array.isArray(item.buttons)) {
        preparedButtons = [];
        for (const rb of item.buttons) {
          const normalizedRes = normalizeJsonButtonInput(rb, normalizedCat);
          if (normalizedRes.warnings.length > 0) {
            warnings.push(...normalizedRes.warnings);
          }
          if (normalizedRes.button) {
            preparedButtons.push(normalizedRes.button);
          }
        }
      } else {
        preparedButtons = getDefaultButtonsForResponse(normalizedCat);
      }

      const mergedButtons = mergeMandatoryButtons(normalizedCat, preparedButtons);
      const rawActive = item.active !== undefined ? item.active : item.is_active;
      const isActive =
        rawActive !== undefined
          ? rawActive === true || rawActive === 1 || rawActive === 'true'
            ? 1
            : 0
          : defaultActive;

      entries.push({
        name,
        category: normalizedCat,
        content,
        footer_text: footerText,
        buttons: mergedButtons,
        is_active: isActive,
      });
    };

    if (Array.isArray(payload)) {
      payload.forEach((item, index) => {
        const rawCat = String(item?.category || '').trim();
        if (!rawCat) {
          throw new Error(`Item indeks #${index + 1} wajib memiliki field "category".`);
        }
        normalizeSingleEntry(rawCat, item, `item #${index + 1}`);
      });
    } else if (payload && typeof payload === 'object') {
      const obj = payload as Record<string, any>;
      if (typeof obj.category === 'string' && typeof obj.content === 'string') {
        normalizeSingleEntry(obj.category, obj, `kategori "${obj.category}"`);
      } else {
        for (const [key, val] of Object.entries(obj)) {
          if (Array.isArray(val)) {
            val.forEach((subItem, idx) =>
              normalizeSingleEntry(key, subItem, `kategori "${key}" #${idx + 1}`)
            );
          } else {
            normalizeSingleEntry(key, val, `kategori "${key}"`);
          }
        }
      }
    } else {
      throw new Error('Payload JSON harus berupa objek per-kategori atau array template.');
    }

    if (entries.length === 0) {
      throw new Error('Tidak ada data template yang ditemukan di dalam JSON.');
    }

    const db = getMasterDb();
    const mode = options?.mode === 'replace_category' ? 'replace_category' : 'append';
    const createdIds: number[] = [];
    const skippedItems: Array<{ category: TemplateCategory; name: string }> = [];

    const tx = db.transaction(() => {
      if (mode === 'replace_category') {
        const uniqueCategories = Array.from(new Set(entries.map((e) => e.category)));
        const deleteStmt = db.prepare('DELETE FROM message_templates WHERE category = ?');
        for (const cat of uniqueCategories) {
          deleteStmt.run(cat);
          if (cat === 'confirm_summary') {
            deleteStmt.run('confirmation');
          }
        }
      }

      const seenSignatures = new Set<string>();
      const existingRows = db
        .prepare('SELECT category, name, content, footer_text, buttons_json FROM message_templates')
        .all();
      for (const row of existingRows) {
        const hydrated = hydrateTemplateRow(row);
        seenSignatures.add(
          buildTemplateSignature({
            category: hydrated.category,
            name: hydrated.name,
            content: hydrated.content,
            footer_text: hydrated.footer_text,
            buttons: hydrated.buttons,
          }),
        );
      }

      const now = new Date().toISOString();
      const insertStmt = db.prepare(`
        INSERT INTO message_templates (name, category, content, footer_text, buttons_json, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const entry of entries) {
        const signature = buildTemplateSignature({
          category: entry.category,
          name: entry.name,
          content: entry.content,
          footer_text: entry.footer_text,
          buttons: entry.buttons,
        });

        if (seenSignatures.has(signature)) {
          skippedItems.push({ category: entry.category, name: entry.name });
          continue;
        }

        seenSignatures.add(signature);
        const info = insertStmt.run(
          entry.name,
          entry.category,
          entry.content,
          entry.footer_text,
          JSON.stringify(entry.buttons),
          entry.is_active,
          now,
          now
        );
        createdIds.push(Number(info.lastInsertRowid));
      }
    });

    tx();

    const importedTemplates = createdIds
      .map((id) => this.getTemplateById(id))
      .filter((t): t is MessageTemplateRecord => Boolean(t));

    return {
      importedCount: importedTemplates.length,
      skippedCount: skippedItems.length,
      skippedItems,
      templates: importedTemplates,
      warnings,
    };
  }

  /**
   * Mengekspor seluruh template menjadi string JSON sederhana dengan pemisah 1 baris kosong antar kategori.
   */
  static formatTemplatesAsGroupedJson(categoryFilter?: string): {
    jsonText: string;
    count: number;
  } {
    const list = this.getAllTemplates(categoryFilter);
    const grouped: Record<string, any> = {};

    for (const tpl of list) {
      const simplifiedButtons = Array.isArray(tpl.buttons)
        ? tpl.buttons.map(simplifyButtonForExport)
        : [];
      const itemObj: Record<string, any> = {
        name: tpl.name,
        content: tpl.content,
      };
      if (tpl.footer_text) {
        itemObj.footer = tpl.footer_text;
      }
      if (simplifiedButtons.length > 0) {
        itemObj.buttons = simplifiedButtons;
      }
      if (tpl.is_active === 0) {
        itemObj.active = false;
      }

      if (!grouped[tpl.category]) {
        grouped[tpl.category] = itemObj;
      } else if (Array.isArray(grouped[tpl.category])) {
        grouped[tpl.category].push(itemObj);
      } else {
        grouped[tpl.category] = [grouped[tpl.category], itemObj];
      }
    }

    const keys = Object.keys(grouped);
    if (keys.length === 0) {
      return { jsonText: '{\n}', count: 0 };
    }

    const blocks = keys.map((key, idx) => {
      const formattedVal = JSON.stringify(grouped[key], null, 2)
        .split('\n')
        .map((line, lineIdx) => (lineIdx === 0 ? line : `  ${line}`))
        .join('\n');
      const comma = idx < keys.length - 1 ? ',' : '';
      return `  ${JSON.stringify(key)}: ${formattedVal}${comma}`;
    });

    return {
      jsonText: `{\n${blocks.join('\n\n')}\n}`,
      count: list.length,
    };
  }
}

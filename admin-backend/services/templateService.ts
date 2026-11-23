import { getMasterDb } from '../database/masterSqlite.ts';
import { WhatsAppButton } from '../../backend/types/bot.types.ts';
import {
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
        typeof item.footer_text === 'string' ? item.footer_text.trim() : '';
      const rawButtons: WhatsAppButton[] = Array.isArray(item.buttons)
        ? item.buttons
        : getDefaultButtonsForResponse(normalizedCat);

      // Deteksi perubahan jika payload JSON mencoba mengubah tipe/output tombol wajib
      for (const rb of rawButtons) {
        if (rb && typeof rb === 'object' && rb.mandatoryRole) {
          const mergedTest = mergeMandatoryButtons(normalizedCat, [rb]);
          const matchedMerged = mergedTest.find((m) => m.mandatoryRole === rb.mandatoryRole);
          if (
            matchedMerged &&
            ((rb.type && rb.type !== matchedMerged.type) ||
              (rb.output && rb.output.trim() !== matchedMerged.output))
          ) {
            warnings.push(
              `[${normalizedCat}] Tombol wajib "${rb.mandatoryRole}" otomatis dinormalisasi dari "${rb.type}" ke "${matchedMerged.type}" (${matchedMerged.output}).`
            );
          }
        }
      }

      const mergedButtons = mergeMandatoryButtons(normalizedCat, rawButtons);
      const isActive =
        item.is_active !== undefined
          ? item.is_active === true || item.is_active === 1
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

      const now = new Date().toISOString();
      const insertStmt = db.prepare(`
        INSERT INTO message_templates (name, category, content, footer_text, buttons_json, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const entry of entries) {
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
      templates: importedTemplates,
      warnings,
    };
  }

  /**
   * Mengekspor seluruh template menjadi string JSON dengan pemisah 1 baris kosong (Enter) antar kategori.
   */
  static formatTemplatesAsGroupedJson(categoryFilter?: string): {
    jsonText: string;
    count: number;
  } {
    const list = this.getAllTemplates(categoryFilter);
    const grouped: Record<string, any> = {};

    for (const tpl of list) {
      const itemObj = {
        name: tpl.name,
        content: tpl.content,
        footer_text: tpl.footer_text,
        buttons: tpl.buttons,
        is_active: tpl.is_active,
      };
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

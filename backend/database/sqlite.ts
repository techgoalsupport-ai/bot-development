import Database from 'better-sqlite3';
import { DEFAULT_TENANT_ID, getActiveTenantId } from './tenantContext.ts';
import { getTenantDb, initTenantDb } from './tenantDbManager.ts';

// Dynamic Proxy yang selalu mengarahkan query ke database SQLite milik tenant aktif
export const db: Database.Database = new Proxy({} as Database.Database, {
  get(_target, prop) {
    const activeDb = getTenantDb(getActiveTenantId());
    const value = (activeDb as any)[prop];
    if (typeof value === 'function') {
      return value.bind(activeDb);
    }
    return value;
  },
});

export function initDatabase(): void {
  initTenantDb(DEFAULT_TENANT_ID);
}

// ==========================================
// Pricing Helpers
// ==========================================

export interface PricingConfigRecord {
  mode: 'rp' | 'percent';
  value: number;
  updatedAt: string;
}

export interface VariantPricingRecord {
  variantId: string;
  productName: string;
  variantName: string;
  pricingType: 'general' | 'custom';
  mode: 'rp' | 'percent';
  value: number;
  updatedAt: string;
}

export function getPricingConfig(): PricingConfigRecord {
  try {
    const row = db
      .prepare('SELECT pricing_mode, pricing_value, updated_at FROM pricing_config WHERE id = 1')
      .get() as { pricing_mode: string; pricing_value: number; updated_at: string } | undefined;

    if (row) {
      return {
        mode: row.pricing_mode === 'percent' ? 'percent' : 'rp',
        value: Math.max(0, Number(row.pricing_value) || 0),
        updatedAt: row.updated_at || '',
      };
    }
  } catch (err) {
    console.error('Gagal membaca pricing_config dari SQLite:', err);
  }
  return { mode: 'rp', value: 100, updatedAt: '' };
}

export function savePricingConfig(mode: 'rp' | 'percent', value: number): PricingConfigRecord {
  const cleanMode: 'rp' | 'percent' = mode === 'percent' ? 'percent' : 'rp';
  const cleanValue = Math.max(0, Number(value) || 0);
  const now = new Date().toISOString();

  db.prepare(`
    INSERT OR REPLACE INTO pricing_config (id, pricing_mode, pricing_value, updated_at)
    VALUES (1, ?, ?, ?)
  `).run(cleanMode, cleanValue, now);

  return {
    mode: cleanMode,
    value: cleanValue,
    updatedAt: now,
  };
}

export function calculateSellingPrice(
  originalPrice: number,
  mode?: 'rp' | 'percent',
  value?: number
): { sellingPrice: number; margin: number; mode: 'rp' | 'percent'; value: number } {
  const base = Math.max(0, Math.round(Number(originalPrice) || 0));
  const cfg =
    mode !== undefined && value !== undefined
      ? { mode: mode === 'percent' ? ('percent' as const) : ('rp' as const), value: Math.max(0, Number(value) || 0) }
      : getPricingConfig();

  const margin =
    cfg.mode === 'percent'
      ? Math.round(base * (cfg.value / 100))
      : Math.round(cfg.value);

  return {
    sellingPrice: base + Math.max(0, margin),
    margin: Math.max(0, margin),
    mode: cfg.mode,
    value: cfg.value,
  };
}

export function getAllVariantPricings(): Record<string, VariantPricingRecord> {
  const map: Record<string, VariantPricingRecord> = {};
  try {
    const rows = db
      .prepare('SELECT * FROM variant_pricing')
      .all() as Array<{
        variant_id: string;
        product_name: string;
        variant_name: string;
        pricing_type: string;
        pricing_mode: string;
        pricing_value: number;
        updated_at: string;
      }>;

    for (const r of rows) {
      map[String(r.variant_id)] = {
        variantId: String(r.variant_id),
        productName: r.product_name || '',
        variantName: r.variant_name || '',
        pricingType: r.pricing_type === 'custom' ? 'custom' : 'general',
        mode: r.pricing_mode === 'percent' ? 'percent' : 'rp',
        value: Math.max(0, Number(r.pricing_value) || 0),
        updatedAt: r.updated_at || '',
      };
    }
  } catch (err) {
    console.error('Gagal membaca variant_pricing dari SQLite:', err);
  }
  return map;
}

export function saveVariantPricing(
  variantId: string,
  options: {
    productName?: string;
    variantName?: string;
    pricingType: 'general' | 'custom';
    mode?: 'rp' | 'percent';
    value?: number;
  }
): VariantPricingRecord {
  const cleanId = String(variantId).trim();
  const pricingType: 'general' | 'custom' = options.pricingType === 'custom' ? 'custom' : 'general';
  const mode: 'rp' | 'percent' = options.mode === 'percent' ? 'percent' : 'rp';
  const value = Math.max(0, Number(options.value) || 0);
  const now = new Date().toISOString();

  db.prepare(`
    INSERT OR REPLACE INTO variant_pricing (
      variant_id, product_name, variant_name, pricing_type, pricing_mode, pricing_value, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    cleanId,
    options.productName ? String(options.productName) : '',
    options.variantName ? String(options.variantName) : '',
    pricingType,
    mode,
    value,
    now
  );

  return {
    variantId: cleanId,
    productName: options.productName ? String(options.productName) : '',
    variantName: options.variantName ? String(options.variantName) : '',
    pricingType,
    mode,
    value,
    updatedAt: now,
  };
}

export function calculateSellingPriceForVariant(
  originalPrice: number,
  variantId?: string | number,
  productName?: string,
  variantName?: string
): {
  sellingPrice: number;
  margin: number;
  isCustom: boolean;
  mode: 'rp' | 'percent';
  value: number;
} {
  const base = Math.max(0, Math.round(Number(originalPrice) || 0));
  try {
    let row: any = null;
    if (variantId !== undefined && variantId !== null && String(variantId).trim()) {
      row = db
        .prepare('SELECT * FROM variant_pricing WHERE variant_id = ?')
        .get(String(variantId).trim());
    }
    if (!row && productName && variantName) {
      row = db
        .prepare(
          'SELECT * FROM variant_pricing WHERE LOWER(product_name) = LOWER(?) AND LOWER(variant_name) = LOWER(?)'
        )
        .get(productName.trim(), variantName.trim());
    }

    if (row && row.pricing_type === 'custom') {
      const calc = calculateSellingPrice(
        base,
        row.pricing_mode === 'percent' ? 'percent' : 'rp',
        Number(row.pricing_value) || 0
      );
      return {
        ...calc,
        isCustom: true,
      };
    }
  } catch (err) {
    console.error('Gagal menghitung harga custom varian:', err);
  }

  const general = calculateSellingPrice(base);
  return {
    ...general,
    isCustom: false,
  };
}

export function getCategoryPricing(category: 'smm' | 'topup'): PricingConfigRecord {
  try {
    const row = db
      .prepare('SELECT pricing_mode, pricing_value, updated_at FROM category_pricing WHERE category = ?')
      .get(category) as { pricing_mode: string; pricing_value: number; updated_at: string } | undefined;
    if (row) {
      return {
        mode: row.pricing_mode === 'percent' ? 'percent' : 'rp',
        value: Math.max(0, Number(row.pricing_value) || 0),
        updatedAt: row.updated_at || '',
      };
    }
  } catch (err) {
    console.error(`Gagal membaca category_pricing (${category}):`, err);
  }
  return { mode: 'rp', value: 100, updatedAt: '' };
}

export function saveCategoryPricing(
  category: 'smm' | 'topup',
  mode: 'rp' | 'percent',
  value: number
): PricingConfigRecord {
  const cleanMode: 'rp' | 'percent' = mode === 'percent' ? 'percent' : 'rp';
  const cleanValue = Math.max(0, Number(value) || 0);
  const now = new Date().toISOString();

  db.prepare(`
    INSERT OR REPLACE INTO category_pricing (category, pricing_mode, pricing_value, updated_at)
    VALUES (?, ?, ?, ?)
  `).run(category, cleanMode, cleanValue, now);

  return {
    mode: cleanMode,
    value: cleanValue,
    updatedAt: now,
  };
}

// ==========================================
// Promo Code Helpers (with Margin Protection)
// ==========================================

export interface PromoCodeRecord {
  id: number;
  code: string;
  discountMode: 'rp' | 'percent';
  discountValue: number;
  minSpend: number;
  quota: number | null;
  usedCount: number;
  validUntil: string | null;
  isForever: boolean;
  scopeType: 'all' | 'restricted';
  variantIds: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function mapPromoRow(row: any): PromoCodeRecord {
  let variantIds: string[] = [];
  try {
    const relRows = db
      .prepare('SELECT variant_id FROM promo_code_variants WHERE promo_id = ?')
      .all(Number(row.id)) as Array<{ variant_id: string }>;
    variantIds = relRows.map((r) => String(r.variant_id));
  } catch {}

  return {
    id: Number(row.id),
    code: String(row.code || '').toUpperCase(),
    discountMode: row.discount_mode === 'percent' ? 'percent' : 'rp',
    discountValue: Number(row.discount_value || 0),
    minSpend: Number(row.min_spend || 0),
    quota: row.quota !== null && row.quota !== undefined ? Number(row.quota) : null,
    usedCount: Number(row.used_count || 0),
    validUntil: row.valid_until || null,
    isForever: Boolean(row.is_forever),
    scopeType: row.scope_type === 'restricted' ? 'restricted' : 'all',
    variantIds,
    isActive: Boolean(row.is_active),
    createdAt: String(row.created_at || ''),
    updatedAt: String(row.updated_at || ''),
  };
}

export function getAllPromoCodes(): PromoCodeRecord[] {
  const rows = db.prepare('SELECT * FROM promo_codes ORDER BY id DESC').all();
  return rows.map(mapPromoRow);
}

export function getPromoCodeById(id: number): PromoCodeRecord | null {
  const row = db.prepare('SELECT * FROM promo_codes WHERE id = ?').get(id);
  return row ? mapPromoRow(row) : null;
}

export function createPromoCode(input: {
  code: string;
  discountMode: 'rp' | 'percent';
  discountValue: number;
  minSpend?: number;
  quota?: number | null;
  validUntil?: string | null;
  isForever?: boolean;
  scopeType?: 'all' | 'restricted';
  variantIds?: string[];
  isActive?: boolean;
}): PromoCodeRecord {
  const cleanCode = String(input.code || '').trim().toUpperCase().replace(/\s+/g, '');
  const now = new Date().toISOString();
  const variantIds = Array.isArray(input.variantIds) ? input.variantIds.map(String) : [];

  const createdId = db.transaction(() => {
    const res = db
      .prepare(`
        INSERT INTO promo_codes (
          code, discount_mode, discount_value, min_spend, quota, used_count,
          valid_until, is_forever, scope_type, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        cleanCode,
        input.discountMode === 'percent' ? 'percent' : 'rp',
        Math.max(1, Math.round(Number(input.discountValue) || 0)),
        Math.max(0, Math.round(Number(input.minSpend) || 0)),
        input.quota !== null && input.quota !== undefined ? Math.max(1, Math.round(Number(input.quota))) : null,
        input.isForever ? null : input.validUntil || null,
        input.isForever !== false ? 1 : 0,
        input.scopeType === 'restricted' ? 'restricted' : 'all',
        input.isActive !== false ? 1 : 0,
        now,
        now
      );

    const promoId = Number(res.lastInsertRowid);
    if (variantIds.length > 0) {
      const insertVar = db.prepare(
        'INSERT INTO promo_code_variants (promo_id, variant_id) VALUES (?, ?)'
      );
      for (const vid of variantIds) {
        insertVar.run(promoId, vid);
      }
    }
    return promoId;
  })();

  return getPromoCodeById(createdId)!;
}

export function updatePromoCode(
  id: number,
  input: Partial<{
    code: string;
    discountMode: 'rp' | 'percent';
    discountValue: number;
    minSpend: number;
    quota: number | null;
    validUntil: string | null;
    isForever: boolean;
    scopeType: 'all' | 'restricted';
    variantIds: string[];
    isActive: boolean;
  }>
): PromoCodeRecord | null {
  const existing = getPromoCodeById(id);
  if (!existing) return null;

  const cleanCode =
    input.code !== undefined
      ? String(input.code).trim().toUpperCase().replace(/\s+/g, '')
      : existing.code;
  const discountMode = input.discountMode !== undefined ? input.discountMode : existing.discountMode;
  const discountValue =
    input.discountValue !== undefined ? Math.max(1, Math.round(input.discountValue)) : existing.discountValue;
  const minSpend = input.minSpend !== undefined ? Math.max(0, Math.round(input.minSpend)) : existing.minSpend;
  const quota =
    input.quota !== undefined
      ? input.quota !== null
        ? Math.max(1, Math.round(input.quota))
        : null
      : existing.quota;
  const isForever = input.isForever !== undefined ? Boolean(input.isForever) : existing.isForever;
  const validUntil = isForever
    ? null
    : input.validUntil !== undefined
      ? input.validUntil
      : existing.validUntil;
  const scopeType = input.scopeType !== undefined ? input.scopeType : existing.scopeType;
  const isActive = input.isActive !== undefined ? Boolean(input.isActive) : existing.isActive;
  const now = new Date().toISOString();

  db.transaction(() => {
    db.prepare(`
      UPDATE promo_codes
      SET code = ?, discount_mode = ?, discount_value = ?, min_spend = ?, quota = ?,
          valid_until = ?, is_forever = ?, scope_type = ?, is_active = ?, updated_at = ?
      WHERE id = ?
    `).run(
      cleanCode,
      discountMode,
      discountValue,
      minSpend,
      quota,
      validUntil,
      isForever ? 1 : 0,
      scopeType,
      isActive ? 1 : 0,
      now,
      id
    );

    if (input.variantIds !== undefined) {
      db.prepare('DELETE FROM promo_code_variants WHERE promo_id = ?').run(id);
      const insertVar = db.prepare(
        'INSERT INTO promo_code_variants (promo_id, variant_id) VALUES (?, ?)'
      );
      for (const vid of input.variantIds.map(String)) {
        insertVar.run(id, vid);
      }
    }
  })();

  return getPromoCodeById(id);
}

export function togglePromoStatus(id: number, explicitActive?: boolean): boolean {
  const existing = getPromoCodeById(id);
  if (!existing) return false;
  const nextActive = explicitActive !== undefined ? Boolean(explicitActive) : !existing.isActive;
  const now = new Date().toISOString();
  const res = db
    .prepare('UPDATE promo_codes SET is_active = ?, updated_at = ? WHERE id = ?')
    .run(nextActive ? 1 : 0, now, id);
  return res.changes > 0;
}

export function deletePromoCode(id: number): boolean {
  const res = db.prepare('DELETE FROM promo_codes WHERE id = ?').run(id);
  return res.changes > 0;
}

function isPromoDateExpired(validUntil: string | null, isForever: boolean): boolean {
  if (isForever || !validUntil) return false;
  const raw = validUntil.trim();
  if (!raw) return false;
  // Jika format tanggal saja (YYYY-MM-DD), berlaku hingga akhir hari WIB (23:59:59+07:00)
  const targetMs = /^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? new Date(`${raw}T23:59:59+07:00`).getTime()
    : new Date(raw).getTime();
  if (isNaN(targetMs)) return false;
  return Date.now() > targetMs;
}

export function validateAndApplyPromo(params: {
  code: string;
  variantId?: string;
  basePrice: number;
  initialMargin: number;
  totalOrderAmount: number;
  isApkPremium?: boolean;
}): {
  isValid: boolean;
  errorMessage?: string;
  promo?: PromoCodeRecord;
  discountAmount: number;
  actualDiscountApplied: number;
  finalPrice: number;
} {
  const basePrice = Math.max(0, Math.round(Number(params.basePrice) || 0));
  const initialMargin = Math.max(0, Math.round(Number(params.initialMargin) || 0));
  const totalOrderAmount = Math.max(0, Math.round(Number(params.totalOrderAmount) || basePrice + initialMargin));

  if (params.isApkPremium === false) {
    return {
      isValid: false,
      errorMessage: 'Kupon promo hanya berlaku untuk kategori produk APK Premium.',
      discountAmount: 0,
      actualDiscountApplied: 0,
      finalPrice: totalOrderAmount,
    };
  }

  const cleanCode = String(params.code || '').trim().toUpperCase().replace(/\s+/g, '');
  if (!cleanCode) {
    return {
      isValid: false,
      errorMessage: 'Kode promo tidak boleh kosong.',
      discountAmount: 0,
      actualDiscountApplied: 0,
      finalPrice: totalOrderAmount,
    };
  }

  const row = db
    .prepare('SELECT * FROM promo_codes WHERE UPPER(code) = UPPER(?)')
    .get(cleanCode);
  if (!row) {
    return {
      isValid: false,
      errorMessage: `Kode promo "${cleanCode}" tidak ditemukan.`,
      discountAmount: 0,
      actualDiscountApplied: 0,
      finalPrice: totalOrderAmount,
    };
  }

  const promo = mapPromoRow(row);
  if (!promo.isActive) {
    return {
      isValid: false,
      errorMessage: `Kode promo "${promo.code}" sedang dinonaktifkan.`,
      promo,
      discountAmount: 0,
      actualDiscountApplied: 0,
      finalPrice: totalOrderAmount,
    };
  }

  if (isPromoDateExpired(promo.validUntil, promo.isForever)) {
    return {
      isValid: false,
      errorMessage: `Masa berlaku kode promo "${promo.code}" telah kedaluwarsa.`,
      promo,
      discountAmount: 0,
      actualDiscountApplied: 0,
      finalPrice: totalOrderAmount,
    };
  }

  if (promo.quota !== null && promo.usedCount >= promo.quota) {
    return {
      isValid: false,
      errorMessage: `Kuota penggunaan kode promo "${promo.code}" sudah habis.`,
      promo,
      discountAmount: 0,
      actualDiscountApplied: 0,
      finalPrice: totalOrderAmount,
    };
  }

  if (promo.minSpend > 0 && totalOrderAmount < promo.minSpend) {
    return {
      isValid: false,
      errorMessage: `Minimal transaksi untuk promo "${promo.code}" adalah Rp ${promo.minSpend.toLocaleString('id-ID')}.`,
      promo,
      discountAmount: 0,
      actualDiscountApplied: 0,
      finalPrice: totalOrderAmount,
    };
  }

  if (promo.scopeType === 'restricted') {
    const vId = String(params.variantId || '').trim();
    if (!vId || !promo.variantIds.includes(vId)) {
      return {
        isValid: false,
        errorMessage: `Kode promo "${promo.code}" tidak berlaku untuk varian produk ini.`,
        promo,
        discountAmount: 0,
        actualDiscountApplied: 0,
        finalPrice: totalOrderAmount,
      };
    }
  }

  // Margin Protection: Diskon hanya memotong margin toko, tidak pernah menyentuh harga modal dasar.
  const rawDiscount =
    promo.discountMode === 'percent'
      ? Math.round(initialMargin * (promo.discountValue / 100))
      : Math.round(promo.discountValue);

  const actualDiscountApplied = Math.max(0, Math.min(initialMargin, rawDiscount));
  const finalPrice = Math.max(basePrice, totalOrderAmount - actualDiscountApplied);

  return {
    isValid: true,
    promo,
    discountAmount: rawDiscount,
    actualDiscountApplied,
    finalPrice,
  };
}

export function reservePromoQuota(promoId: number): { reserved: boolean; reason?: string } {
  try {
    const now = new Date().toISOString();
    const res = db
      .prepare(`
        UPDATE promo_codes
        SET used_count = used_count + 1, updated_at = ?
        WHERE id = ?
          AND is_active = 1
          AND (quota IS NULL OR used_count < quota)
      `)
      .run(now, promoId);

    if (res.changes === 1) {
      return { reserved: true };
    }
    return { reserved: false, reason: 'Kuota penggunaan kode promo sudah habis atau kupon tidak aktif.' };
  } catch (err: any) {
    return { reserved: false, reason: err?.message || 'Gagal mereservasi kuota promo.' };
  }
}

export function releasePromoQuota(promoId: number): void {
  try {
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE promo_codes
      SET used_count = MAX(0, used_count - 1), updated_at = ?
      WHERE id = ? AND used_count > 0
    `).run(now, promoId);
  } catch (err) {
    console.error(`Gagal mengembalikan kuota promo ${promoId}:`, err);
  }
}

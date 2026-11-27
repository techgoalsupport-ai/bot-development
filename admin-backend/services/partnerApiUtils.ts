import crypto from 'crypto';
import { DurationUnit } from '../types/admin.types.ts';

/**
 * Generate raw API key berprefiks `wzp_` dan 32 karakter hex acak.
 */
export function generatePartnerApiKey(): {
  rawKey: string;
  keyHash: string;
  prefixKey: string;
} {
  const randomPart = crypto.randomBytes(20).toString('hex');
  const rawKey = `wzp_${randomPart}`;
  const keyHash = hashPartnerApiKey(rawKey);
  const prefixKey = `${rawKey.slice(0, 12)}...${rawKey.slice(-4)}`;
  return { rawKey, keyHash, prefixKey };
}

/**
 * Hash API key menggunakan SHA-256 agar token mentah tidak pernah disimpan di database.
 */
export function hashPartnerApiKey(rawKey: string): string {
  return crypto.createHash('sha256').update(rawKey.trim()).digest('hex');
}

/**
 * Ekstrak API key dari header `x-api-key` atau `Authorization: Bearer <key>`.
 */
export function extractApiKeyFromHeaders(
  xApiKeyHeader?: string | string[],
  authorizationHeader?: string
): string | null {
  if (typeof xApiKeyHeader === 'string' && xApiKeyHeader.trim().length > 0) {
    return xApiKeyHeader.trim();
  }
  if (Array.isArray(xApiKeyHeader) && xApiKeyHeader.length > 0 && xApiKeyHeader[0].trim()) {
    return xApiKeyHeader[0].trim();
  }
  if (authorizationHeader && /^Bearer\s+/i.test(authorizationHeader)) {
    const token = authorizationHeader.replace(/^Bearer\s+/i, '').trim();
    return token.length > 0 ? token : null;
  }
  return null;
}

/**
 * Validasi dan normalisasi durasi dari payload API Partner.
 * Mendukung field fleksibel:
 * - Tenant: duration_value + duration_unit, atau duration_days, atau amount + unit
 * - Token: amount + unit (atau duration_value + duration_unit)
 */
export function parsePartnerDuration(
  body: Record<string, any>,
  options: { allowWeeks: boolean; defaultValue?: number; defaultUnit?: DurationUnit } = {
    allowWeeks: true,
    defaultValue: 30,
    defaultUnit: 'days',
  }
): { valid: true; amount: number; unit: DurationUnit; label: string } | { valid: false; message: string } {
  const allowedUnits: DurationUnit[] = options.allowWeeks
    ? ['minutes', 'hours', 'days', 'weeks', 'months']
    : ['minutes', 'hours', 'days', 'months'];

  const rawAmount =
    body.duration_value !== undefined
      ? body.duration_value
      : body.amount !== undefined
      ? body.amount
      : body.duration_days !== undefined
      ? body.duration_days
      : undefined;

  const rawUnit =
    body.duration_unit !== undefined
      ? body.duration_unit
      : body.unit !== undefined
      ? body.unit
      : body.duration_days !== undefined
      ? 'days'
      : undefined;

  let finalAmount: number;
  if (rawAmount === undefined || rawAmount === null || rawAmount === '') {
    if (options.defaultValue !== undefined) {
      finalAmount = options.defaultValue;
    } else {
      return { valid: false, message: 'Parameter durasi wajib diisi dengan angka bulat positif (> 0).' };
    }
  } else {
    const parsed = Number(rawAmount);
    if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
      return { valid: false, message: 'Durasi harus berupa angka bulat positif lebih dari 0.' };
    }
    if (parsed > 3650) {
      return { valid: false, message: 'Durasi maksimal yang diperbolehkan adalah 3650.' };
    }
    finalAmount = parsed;
  }

  let finalUnit: DurationUnit;
  if (rawUnit === undefined || rawUnit === null || rawUnit === '') {
    finalUnit = options.defaultUnit || 'days';
  } else {
    const normalizedUnit = String(rawUnit).trim().toLowerCase() as DurationUnit;
    if (!allowedUnits.includes(normalizedUnit)) {
      return {
        valid: false,
        message: `Satuan waktu (unit) tidak valid. Pilihan yang didukung: ${allowedUnits.join(', ')}.`,
      };
    }
    finalUnit = normalizedUnit;
  }

  return {
    valid: true,
    amount: finalAmount,
    unit: finalUnit,
    label: formatDurationLabelId(finalAmount, finalUnit),
  };
}

export function formatDurationLabelId(amount: number, unit: DurationUnit): string {
  switch (unit) {
    case 'minutes':
      return `${amount} Menit`;
    case 'hours':
      return `${amount} Jam`;
    case 'weeks':
      return `${amount} Minggu`;
    case 'months':
      return `${amount} Bulan`;
    case 'days':
    default:
      return `${amount} Hari`;
  }
}

/**
 * Rate limiter berbasis sliding window di memori untuk mencegah brute-force/spam endpoint Partner API.
 */
export class SlidingWindowRateLimiter {
  private hits = new Map<string, number[]>();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 60, windowMs: number = 60_000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  check(identifier: string, now: number = Date.now()): {
    allowed: boolean;
    remaining: number;
    retryAfterSeconds: number;
  } {
    const windowStart = now - this.windowMs;
    const timestamps = (this.hits.get(identifier) || []).filter((t) => t > windowStart);

    if (timestamps.length >= this.maxRequests) {
      const oldestInWindow = timestamps[0];
      const retryAfterMs = Math.max(1000, oldestInWindow + this.windowMs - now);
      this.hits.set(identifier, timestamps);
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
      };
    }

    timestamps.push(now);
    this.hits.set(identifier, timestamps);

    if (this.hits.size > 1000) {
      for (const [key, list] of this.hits.entries()) {
        const fresh = list.filter((t) => t > windowStart);
        if (fresh.length === 0) {
          this.hits.delete(key);
        } else if (fresh.length !== list.length) {
          this.hits.set(key, fresh);
        }
      }
    }

    return {
      allowed: true,
      remaining: Math.max(0, this.maxRequests - timestamps.length),
      retryAfterSeconds: 0,
    };
  }

  reset(): void {
    this.hits.clear();
  }
}

/**
 * Normalisasi header Host / hostname (hapus port dan lowercase).
 */
export function normalizeHostHeader(rawHost?: string | string[] | null): string {
  const first = Array.isArray(rawHost) ? rawHost[0] : rawHost;
  if (!first || typeof first !== 'string') return '';
  const trimmed = first.split(',')[0].trim().toLowerCase();
  if (!trimmed) return '';
  if (trimmed.startsWith('[')) {
    const closingIdx = trimmed.indexOf(']');
    return closingIdx > 0 ? trimmed.slice(1, closingIdx) : trimmed;
  }
  return trimmed.replace(/:\d+$/, '');
}

/**
 * Ambil daftar hostname bersih dari variabel env berupa URL atau host dipisah koma.
 */
export function parseHostListEnv(value?: string | null): string[] {
  if (!value || typeof value !== 'string') return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      try {
        if (/^https?:\/\//i.test(item)) {
          return new URL(item).hostname.toLowerCase();
        }
      } catch {}
      return normalizeHostHeader(item.replace(/\/.*$/, ''));
    })
    .filter(Boolean);
}

/**
 * Periksa apakah host berasal dari lingkungan development/preview lokal (localhost atau *.run.app)
 * agar akses /admin dan /api/admin/* tetap lancar saat pengembangan.
 */
export function isDevelopmentPreviewHost(rawHost?: string | string[] | null): boolean {
  const reqHost = normalizeHostHeader(rawHost);
  if (!reqHost) return false;
  return (
    reqHost === 'localhost' ||
    reqHost === '127.0.0.1' ||
    reqHost === '::1' ||
    reqHost.endsWith('.run.app')
  );
}

/**
 * Periksa apakah request ke endpoint Admin (/api/admin/*) atau Partner API (/api/v1/partner/*)
 * diizinkan berdasarkan domain pemisah (ADMIN_HOST / ADMIN_PUBLIC_URL vs TENANT_PUBLIC_URL).
 * Jika tidak ada env pemisahan domain yang diset atau request datang dari host dev/preview lokal, kembalikan true.
 */
export function isAdminRequestHostAllowed(options: {
  requestHost?: string | string[] | null;
  adminHostEnv?: string;
  adminPublicUrlEnv?: string;
  tenantPublicUrlEnv?: string;
}): boolean {
  const configuredAdminHosts = Array.from(
    new Set([
      ...parseHostListEnv(options.adminHostEnv),
      ...parseHostListEnv(options.adminPublicUrlEnv),
    ]),
  );
  const configuredTenantHosts = parseHostListEnv(options.tenantPublicUrlEnv);

  if (configuredAdminHosts.length === 0 && configuredTenantHosts.length === 0) {
    return true;
  }

  const reqHost = normalizeHostHeader(options.requestHost);
  if (!reqHost) return false;

  if (!configuredTenantHosts.includes(reqHost) && isDevelopmentPreviewHost(reqHost)) {
    return true;
  }

  if (configuredAdminHosts.length > 0) {
    return configuredAdminHosts.includes(reqHost);
  }

  if (configuredTenantHosts.includes(reqHost) && !reqHost.startsWith('admin.')) {
    return false;
  }

  return true;
}

/**
 * Tentukan login_url dashboard tenant untuk respons Partner API (`tenants/create`).
 * Mengutamakan env TENANT_PUBLIC_URL; jika kosong dan request masuk via subdomain admin.*,
 * otomatis menghapus prefiks `admin.` agar pembeli diarahkan ke domain dashboard tenant.
 */
export function resolveTenantPublicLoginUrl(options: {
  tenantPublicUrlEnv?: string;
  requestHost?: string | string[] | null;
  protocol?: string;
}): string {
  const rawEnv = (options.tenantPublicUrlEnv || '').trim();
  if (rawEnv) {
    const cleanBase = rawEnv.replace(/\/+$/, '');
    if (/^https?:\/\//i.test(cleanBase)) {
      return `${cleanBase}/`;
    }
    return `https://${cleanBase}/`;
  }

  const rawHost = Array.isArray(options.requestHost)
    ? options.requestHost[0]
    : options.requestHost;
  const cleanHost = (rawHost || '').split(',')[0].trim();
  if (!cleanHost) return '/';

  const proto = ((options.protocol || 'https').split(',')[0].trim() || 'https').replace(/:$/, '');
  const hostForTenant = cleanHost.replace(/^admin\./i, '');
  return `${proto}://${hostForTenant}/`;
}


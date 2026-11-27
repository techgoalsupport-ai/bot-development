export interface TenantTabDefinition {
  id: string;
  slug: string;
  aliases: string[];
}

export const DEFAULT_TENANT_TAB = 'Pengaturan Toko';

export const TENANT_TAB_DEFINITIONS: TenantTabDefinition[] = [
  {
    id: 'Pengaturan Toko',
    slug: 'pengaturan-toko',
    aliases: [
      'Info Profil',
      'Store Info',
      'Management Bot',
      'Bot Management',
      'ManagementBot',
      'Masa Sewa',
      'Voucher Token',
    ],
  },
  {
    id: 'Saldo & Transaksi',
    slug: 'saldo-transaksi',
    aliases: ['Saldo', 'tabSaldo', 'Transaksi', 'tab05', 'Keuangan'],
  },
  {
    id: 'Koneksi & Layanan',
    slug: 'koneksi-layanan',
    aliases: ['Connection', 'tab06', 'Koneksi Layanan', 'Layanan', 'API'],
  },
  { id: 'Management group', slug: 'management-group', aliases: ['Grup', 'tab04'] },
  { id: 'Respon Bot', slug: 'respon-bot', aliases: ['Command'] },
  { id: 'Aplikasi Premium', slug: 'aplikasi-premium', aliases: ['Produk'] },
  { id: 'Kupon Promo', slug: 'kupon-promo', aliases: ['Promo', 'tabPromo'] },
  { id: 'SMM', slug: 'smm', aliases: ['SSM', 'tab02'] },
  { id: 'TopUp', slug: 'topup', aliases: ['Top Up', 'tab03'] },
  {
    id: 'Keamanan Akun',
    slug: 'keamanan-akun',
    aliases: ['Akun', 'Keamanan', 'Kredensial', 'Ubah Password'],
  },
  { id: 'Laporan', slug: 'laporan', aliases: ['Laporan Masalah', 'Lapor', 'tabLaporan'] },
];

function getStorageKey(tenantKey: string): string {
  return `wanzt_tenant_active_tab:${tenantKey || 'default_tenant'}`;
}

export function resolveCanonicalTenantTab(raw?: string | null): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const lowered = trimmed.toLowerCase();

  for (const def of TENANT_TAB_DEFINITIONS) {
    if (def.slug === lowered || def.id.toLowerCase() === lowered) {
      return def.id;
    }
    if (def.aliases.some((alias) => alias.toLowerCase() === lowered)) {
      return def.id;
    }
  }
  return null;
}

export function getTenantTabSlug(tab: string): string {
  const canonical = resolveCanonicalTenantTab(tab) || DEFAULT_TENANT_TAB;
  const def = TENANT_TAB_DEFINITIONS.find((item) => item.id === canonical);
  return def ? def.slug : 'info-profil';
}

export function getInitialTenantTab(tenantKey: string): string {
  if (typeof window === 'undefined') return DEFAULT_TENANT_TAB;

  try {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = resolveCanonicalTenantTab(params.get('tab'));
    if (fromQuery) {
      return fromQuery;
    }
  } catch {}

  try {
    const fromSession = resolveCanonicalTenantTab(window.sessionStorage.getItem(getStorageKey(tenantKey)));
    if (fromSession) {
      return fromSession;
    }
  } catch {}

  return DEFAULT_TENANT_TAB;
}

export function persistTenantTab(
  tenantKey: string,
  tab: string,
  historyMode: 'push' | 'replace' = 'push'
): string {
  const canonical = resolveCanonicalTenantTab(tab) || DEFAULT_TENANT_TAB;
  const slug = getTenantTabSlug(canonical);

  if (typeof window === 'undefined') return canonical;

  try {
    window.sessionStorage.setItem(getStorageKey(tenantKey), canonical);
  } catch {}

  try {
    const url = new URL(window.location.href);
    const currentSlug = url.searchParams.get('tab');
    if (currentSlug !== slug) {
      url.searchParams.set('tab', slug);
      const nextUrl = `${url.pathname}${url.search}${url.hash}`;
      if (historyMode === 'push') {
        window.history.pushState({ tenantTab: canonical }, '', nextUrl);
      } else {
        window.history.replaceState({ tenantTab: canonical }, '', nextUrl);
      }
    }
  } catch {}

  return canonical;
}

export function clearPersistedTenantTab(tenantKey?: string): void {
  if (typeof window === 'undefined') return;

  try {
    if (tenantKey) {
      window.sessionStorage.removeItem(getStorageKey(tenantKey));
    } else {
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const k = window.sessionStorage.key(i);
        if (k && k.startsWith('wanzt_tenant_active_tab:')) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => window.sessionStorage.removeItem(k));
    }
    window.sessionStorage.removeItem('wanzt_tenant_cmd_subtab');
    window.sessionStorage.removeItem('wanzt_tenant_cmd_subpill_confirm');
    window.sessionStorage.removeItem('wanzt_tenant_cmd_subpill_transaksi');
    window.sessionStorage.removeItem('wanzt_tenant_cmd_subpill_notif');
    window.sessionStorage.removeItem('wanzt_tenant_cmd_subpill_kontak');
    window.sessionStorage.removeItem('wanzt_tenant_produk_subtab');
  } catch {}

  try {
    const url = new URL(window.location.href);
    if (url.searchParams.has('tab')) {
      url.searchParams.delete('tab');
      const nextUrl = `${url.pathname}${url.search}${url.hash}`;
      window.history.replaceState({}, '', nextUrl);
    }
  } catch {}
}

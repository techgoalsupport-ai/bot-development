import type { AdminNavTab } from '../components/layout/AdminSidebar.tsx';

export const DEFAULT_ADMIN_TAB: AdminNavTab = 'units';

export const VALID_ADMIN_TABS: readonly AdminNavTab[] = [
  'units',
  'reports',
  'templates',
  'telegram',
  'tokens',
  'partners',
  'stats',
  'broadcast',
  'settings',
] as const;

const ADMIN_TAB_STORAGE_KEY = 'wanzt_admin_active_tab';
const ADMIN_PARTNER_SUBTAB_KEY = 'wanzt_admin_partner_subview';
const ADMIN_DOCS_SUBTAB_KEY = 'wanzt_admin_docs_subtab';

export function resolveValidAdminTab(raw?: string | null): AdminNavTab | null {
  if (!raw || typeof raw !== 'string') return null;
  const normalized = raw.trim().toLowerCase() as AdminNavTab;
  return (VALID_ADMIN_TABS as readonly string[]).includes(normalized) ? normalized : null;
}

export function getInitialAdminTab(): AdminNavTab {
  if (typeof window === 'undefined') return DEFAULT_ADMIN_TAB;

  try {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = resolveValidAdminTab(params.get('tab'));
    if (fromQuery) {
      return fromQuery;
    }
  } catch {}

  try {
    const fromSession = resolveValidAdminTab(window.sessionStorage.getItem(ADMIN_TAB_STORAGE_KEY));
    if (fromSession) {
      return fromSession;
    }
  } catch {}

  return DEFAULT_ADMIN_TAB;
}

export function persistAdminTab(tab: AdminNavTab, historyMode: 'push' | 'replace' = 'push'): AdminNavTab {
  const validTab = resolveValidAdminTab(tab) || DEFAULT_ADMIN_TAB;

  if (typeof window === 'undefined') return validTab;

  try {
    window.sessionStorage.setItem(ADMIN_TAB_STORAGE_KEY, validTab);
  } catch {}

  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get('tab') !== validTab) {
      url.searchParams.set('tab', validTab);
      const nextUrl = `${url.pathname}${url.search}${url.hash}`;
      if (historyMode === 'push') {
        window.history.pushState({ adminTab: validTab }, '', nextUrl);
      } else {
        window.history.replaceState({ adminTab: validTab }, '', nextUrl);
      }
    }
  } catch {}

  return validTab;
}

export function clearPersistedAdminTab(): void {
  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage.removeItem(ADMIN_TAB_STORAGE_KEY);
    window.sessionStorage.removeItem(ADMIN_PARTNER_SUBTAB_KEY);
    window.sessionStorage.removeItem(ADMIN_DOCS_SUBTAB_KEY);
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

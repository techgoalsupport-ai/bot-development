import { AsyncLocalStorage } from 'node:async_hooks';

export interface TenantContextStore {
  tenantId: string;
  username?: string;
}

export const DEFAULT_TENANT_ID = 't_wanzt';

export const tenantContextStorage = new AsyncLocalStorage<TenantContextStore>();

export function getActiveTenantId(): string {
  const store = tenantContextStorage.getStore();
  const raw = store?.tenantId?.trim();
  return raw || DEFAULT_TENANT_ID;
}

export function runWithTenant<T>(tenantId: string, fn: () => T, username?: string): T {
  const cleanId = (tenantId || '').trim() || DEFAULT_TENANT_ID;
  return tenantContextStorage.run({ tenantId: cleanId, username }, fn);
}

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isAdminRequestHostAllowed,
  isDevelopmentPreviewHost,
  normalizeHostHeader,
  parseHostListEnv,
  resolveTenantPublicLoginUrl,
} from './services/partnerApiUtils.ts';

test('normalizeHostHeader and parseHostListEnv handle ports, URLs, and comma lists cleanly', () => {
  assert.equal(normalizeHostHeader('Admin.TestBot.web.id:443'), 'admin.testbot.web.id');
  assert.equal(normalizeHostHeader('[::1]:3000'), '::1');
  assert.deepEqual(
    parseHostListEnv('https://admin.testbot.web.id/, testbot.web.id:3000'),
    ['admin.testbot.web.id', 'testbot.web.id'],
  );
});

test('isAdminRequestHostAllowed permits single-host when no domain env is set, and isolates admin host in dual-domain mode', () => {
  // Single-host / AI Studio preview fallback (no env configured)
  assert.equal(
    isAdminRequestHostAllowed({ requestHost: 'testbot.web.id' }),
    true,
  );

  // Dual-domain VPS mode: ADMIN_PUBLIC_URL + TENANT_PUBLIC_URL set
  assert.equal(
    isAdminRequestHostAllowed({
      requestHost: 'admin.testbot.web.id',
      adminPublicUrlEnv: 'https://admin.testbot.web.id',
      tenantPublicUrlEnv: 'https://testbot.web.id',
    }),
    true,
  );
  assert.equal(
    isAdminRequestHostAllowed({
      requestHost: 'testbot.web.id',
      adminPublicUrlEnv: 'https://admin.testbot.web.id',
      tenantPublicUrlEnv: 'https://testbot.web.id',
    }),
    false,
  );
  assert.equal(
    isAdminRequestHostAllowed({
      requestHost: 'testbot.web.id:3000',
      adminHostEnv: 'admin.testbot.web.id',
    }),
    false,
  );
});

test('resolveTenantPublicLoginUrl points buyers to tenant dashboard instead of admin subdomain', () => {
  assert.equal(
    resolveTenantPublicLoginUrl({
      tenantPublicUrlEnv: 'https://testbot.web.id',
      requestHost: 'admin.testbot.web.id',
      protocol: 'https',
    }),
    'https://testbot.web.id/',
  );

  // Even without TENANT_PUBLIC_URL, strip admin. prefix automatically
  assert.equal(
    resolveTenantPublicLoginUrl({
      requestHost: 'admin.testbot.web.id',
      protocol: 'https',
    }),
    'https://testbot.web.id/',
  );

  assert.equal(
    resolveTenantPublicLoginUrl({
      requestHost: 'localhost:3000',
      protocol: 'http',
    }),
    'http://localhost:3000/',
  );
});

test('isDevelopmentPreviewHost permits localhost and *.run.app for /admin while still blocking production tenant domains', () => {
  assert.equal(isDevelopmentPreviewHost('localhost:3000'), true);
  assert.equal(isDevelopmentPreviewHost('127.0.0.1:3000'), true);
  assert.equal(isDevelopmentPreviewHost('ais-dev-example.asia-northeast1.run.app'), true);
  assert.equal(isDevelopmentPreviewHost('testbot.web.id'), false);

  assert.equal(
    isAdminRequestHostAllowed({
      requestHost: 'ais-dev-example.asia-northeast1.run.app',
      adminPublicUrlEnv: 'https://admin.testbot.web.id',
      tenantPublicUrlEnv: 'https://testbot.web.id',
    }),
    true,
  );

  assert.equal(
    isAdminRequestHostAllowed({
      requestHost: 'testbot.web.id',
      adminPublicUrlEnv: 'https://admin.testbot.web.id',
      tenantPublicUrlEnv: 'https://testbot.web.id',
    }),
    false,
  );
});



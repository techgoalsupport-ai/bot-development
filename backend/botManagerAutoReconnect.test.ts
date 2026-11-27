import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { initMasterDatabase, getMasterDb } from '../admin-backend/database/masterSqlite.ts';
import { TenantManager } from '../admin-backend/services/tenantManager.ts';
import { TenantStatusService } from '../admin-backend/services/tenantStatusService.ts';
import { getBotSetting, setBotSetting } from './database/tenantDbManager.ts';
import { autoReconnectSavedBots, BotManager, getBotManager } from './botManager.ts';

function writeRegisteredCreds(sessionDir: string, jidPhone: string, registered = true) {
  fs.mkdirSync(sessionDir, { recursive: true });
  fs.writeFileSync(
    path.join(sessionDir, 'creds.json'),
    JSON.stringify({
      registered,
      me: registered ? { id: `${jidPhone}:12@s.whatsapp.net`, name: 'Bot Test' } : undefined,
    }),
    'utf-8'
  );
}

test('autoReconnectSavedBots reconnects eligible active tenants and skips manually stopped / expired / suspended / unpaired tenants', async () => {
  const prevCwd = process.cwd();
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wanzt-autoreconnect-test-'));
  process.chdir(tmpDir);

  try {
    initMasterDatabase();

    // 1. Tenant aktif dengan sesi terdaftar & tidak pernah dimatikan (bot_auto_reconnect = '1')
    const activeAuto = TenantManager.createTenant({
      tenant_id: 't_auto_on',
      store_name: 'Toko Auto On',
      owner_name: 'Owner 1',
      owner_phone: '628111111111',
      username: 'auto_on_user',
      password: 'PasswordAuto1!',
      duration_days: 30,
    });
    const botAutoOn = new BotManager(activeAuto.tenant_id);
    writeRegisteredCreds(botAutoOn.sessionDir, '628123450001', true);
    setBotSetting(activeAuto.tenant_id, 'bot_auto_reconnect', '1');
    setBotSetting(activeAuto.tenant_id, 'bot_custom_code', 'WANZT123');

    // 2. Tenant aktif dengan sesi tersimpan lama (belum ada key bot_auto_reconnect di DB)
    const activeLegacy = TenantManager.createTenant({
      tenant_id: 't_auto_legacy',
      store_name: 'Toko Legacy Session',
      owner_name: 'Owner Legacy',
      owner_phone: '628111111112',
      username: 'auto_legacy_user',
      password: 'PasswordAuto2!',
      duration_days: 30,
    });
    const botLegacy = new BotManager(activeLegacy.tenant_id);
    writeRegisteredCreds(botLegacy.sessionDir, '628123450002', true);

    // 3. Tenant aktif yang SENGAJA dimatikan via stop()
    const activeStopped = TenantManager.createTenant({
      tenant_id: 't_manual_stop',
      store_name: 'Toko Manual Stop',
      owner_name: 'Owner Stop',
      owner_phone: '628111111113',
      username: 'manual_stop_user',
      password: 'PasswordAuto3!',
      duration_days: 30,
    });
    const botStopped = getBotManager(activeStopped.tenant_id);
    writeRegisteredCreds(botStopped.sessionDir, '628123450003', true);
    setBotSetting(activeStopped.tenant_id, 'bot_auto_reconnect', '1');
    await botStopped.stop();
    assert.equal(getBotSetting(activeStopped.tenant_id, 'bot_auto_reconnect'), '0');

    // 4. Tenant aktif belum selesai pairing (registered: false)
    const activeUnpaired = TenantManager.createTenant({
      tenant_id: 't_unpaired',
      store_name: 'Toko Belum Pair',
      owner_name: 'Owner Unpaired',
      owner_phone: '628111111114',
      username: 'unpaired_user',
      password: 'PasswordAuto4!',
      duration_days: 30,
    });
    const botUnpaired = new BotManager(activeUnpaired.tenant_id);
    writeRegisteredCreds(botUnpaired.sessionDir, '628123450004', false);
    setBotSetting(activeUnpaired.tenant_id, 'bot_auto_reconnect', '1');

    // 5. Tenant expired (sesi masih disimpan agar bisa lanjut setelah perpanjangan, namun tidak boleh auto-connect)
    const expiredTenant = TenantManager.createTenant({
      tenant_id: 't_expired_bot',
      store_name: 'Toko Expired',
      owner_name: 'Owner Exp',
      owner_phone: '628111111115',
      username: 'expired_bot_user',
      password: 'PasswordAuto5!',
      duration_days: 30,
    });
    const botExpired = new BotManager(expiredTenant.tenant_id);
    writeRegisteredCreds(botExpired.sessionDir, '628123450005', true);
    setBotSetting(expiredTenant.tenant_id, 'bot_auto_reconnect', '1');
    getMasterDb()
      .prepare('UPDATE tenants SET expires_at = ? WHERE tenant_id = ?')
      .run(new Date(Date.now() - 60_000).toISOString(), expiredTenant.tenant_id);

    // 6. Tenant suspended
    const suspendedTenant = TenantManager.createTenant({
      tenant_id: 't_suspended_bot',
      store_name: 'Toko Suspended',
      owner_name: 'Owner Susp',
      owner_phone: '628111111116',
      username: 'suspended_bot_user',
      password: 'PasswordAuto6!',
      duration_days: 30,
    });
    const botSuspended = new BotManager(suspendedTenant.tenant_id);
    writeRegisteredCreds(botSuspended.sessionDir, '628123450006', true);
    setBotSetting(suspendedTenant.tenant_id, 'bot_auto_reconnect', '1');
    await TenantStatusService.setStatus(suspendedTenant.tenant_id, 'suspended');

    const startedCalls: Array<{ tenantId: string; phone: string; customCode: string }> = [];
    const summary = await autoReconnectSavedBots({
      delayBetweenTenantsMs: 0,
      forceRun: true,
      startBot: async (bot, phone, customCode) => {
        startedCalls.push({ tenantId: bot.tenantId, phone, customCode });
      },
    });

    assert.deepEqual(
      summary.reconnected.sort(),
      ['t_auto_legacy', 't_auto_on'],
      'Only active tenants with registered sessions that were not manually stopped should reconnect'
    );
    assert.deepEqual(
      startedCalls.find((c) => c.tenantId === 't_auto_on'),
      { tenantId: 't_auto_on', phone: '628123450001', customCode: 'WANZT123' }
    );
    assert.deepEqual(
      startedCalls.find((c) => c.tenantId === 't_auto_legacy'),
      { tenantId: 't_auto_legacy', phone: '628123450002', customCode: '' }
    );

    const skippedMap = new Map(summary.skipped.map((s) => [s.tenantId, s.reason]));
    assert.equal(skippedMap.get('t_manual_stop'), 'manually_stopped');
    assert.equal(skippedMap.get('t_unpaired'), 'no_registered_session');
    assert.equal(skippedMap.get('t_expired_bot'), 'tenant_expired');
    assert.equal(skippedMap.get('t_suspended_bot'), 'no_registered_session');
  } finally {
    process.chdir(prevCwd);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { DEFAULT_CONFIG } from '../config/configManager.ts';
import type { CommandsConfig } from '../types/bot.types.ts';
import { runWithTenant } from '../database/tenantContext.ts';
import { deleteTenantDb, initTenantDb } from '../database/tenantDbManager.ts';
import {
  recordTransaction,
  claimTransactionFulfillment,
  completeTransactionFulfillment,
  getTransactionByOrderId,
} from './transactionManager.ts';
import { formatXavieraCredentials } from './xavieraService.ts';
import {
  fulfillXavieraOrderForTransaction,
  buildPaymentSuccessDmMessage,
} from './orderFulfillmentService.ts';
import { resolvePlaceholders } from './placeholderHelper.ts';

function buildConfig(overrides: Partial<CommandsConfig> = {}): CommandsConfig {
  return {
    ...DEFAULT_CONFIG,
    xavieraApiKey: 'xvs_test_key',
    xavieraBaseUrl: 'https://xavierastore.com/api/v1',
    storeInfo: {
      storeName: 'Wanzt Digital',
      ownerName: 'Owner Test',
      ownerNumber: '628111111111',
      adminName: 'Admin CS',
      adminNumber: '628199999999',
    },
    ...overrides,
  };
}

test('formatXavieraCredentials formats single, multi-account, and extra fields cleanly', () => {
  const single = formatXavieraCredentials([
    { email: 'buyer@example.com', password: 'rahasia123', pin: '4545' },
  ]);
  assert.equal(single.accountEmail, 'buyer@example.com');
  assert.equal(single.accountPassword, 'rahasia123');
  assert.match(single.credentialsText, /• \*Email:\* buyer@example\.com/);
  assert.match(single.credentialsText, /• \*Password:\* rahasia123/);
  assert.match(single.credentialsText, /• \*PIN:\* 4545/);

  const multi = formatXavieraCredentials([
    { email: 'a@test.com', password: 'p1' },
    { email: 'b@test.com', password: 'p2' },
  ]);
  assert.equal(multi.accountEmail, 'a@test.com, b@test.com');
  assert.equal(multi.accountPassword, 'p1, p2');
  assert.match(multi.credentialsText, /\*Akun #1:\*/);
  assert.match(multi.credentialsText, /\*Akun #2:\*/);
});

test('fulfillXavieraOrderForTransaction sends POST order and persists credentials', async () => {
  const calls: Array<{ productId: string; variantId?: string; qty?: number }> = [];
  const completed: any[] = [];

  const outcome = await fulfillXavieraOrderForTransaction(
    {
      orderId: 'ORD-TEST-001',
      config: buildConfig(),
      productName: 'Viu',
      variantName: '1 Bulan',
      xavieraProductId: 'p_viu',
      xavieraVariantId: 'vr_viu1b',
    },
    {
      claim: () => ({ claimed: true }),
      complete: (orderId, result) => completed.push({ orderId, result }),
      createOrder: async (_cfg, params) => {
        calls.push(params);
        return {
          success: true,
          order: {
            id: 'o_9f8e7d6c',
            productName: 'Viu 1 Bulan',
            credentials: [{ email: 'viu@example.com', password: 'pass123' }],
            total: 1000,
          },
          saldo: 99000,
        };
      },
    }
  );

  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], { productId: 'p_viu', variantId: 'vr_viu1b', qty: 1 });
  assert.equal(outcome.status, 'fulfilled');
  assert.equal(outcome.supplierOrderId, 'o_9f8e7d6c');
  assert.equal(outcome.accountEmail, 'viu@example.com');
  assert.equal(outcome.accountPassword, 'pass123');
  assert.match(outcome.credentialsText, /viu@example\.com/);
  assert.equal(completed.length, 1);
  assert.equal(completed[0].result.supplierStatus, 'fulfilled');
  assert.equal(completed[0].result.supplierOrderId, 'o_9f8e7d6c');
});

test('fulfillXavieraOrderForTransaction is idempotent when already fulfilled', async () => {
  let orderCalled = false;
  const outcome = await fulfillXavieraOrderForTransaction(
    {
      orderId: 'ORD-TEST-002',
      config: buildConfig(),
      productName: 'Netflix',
      variantName: '1 Bulan',
    },
    {
      claim: () => ({
        claimed: false,
        reason: 'already_fulfilled',
        existing: {
          id: 'TRX-ORD-TEST-002',
          orderId: 'ORD-TEST-002',
          customerNumber: '628511111111',
          customerName: 'Buyer',
          productName: 'Netflix',
          variantName: '1 Bulan',
          category: 'Streaming',
          nominal: 25000,
          uniqueCode: 10,
          total: 25010,
          sellingPrice: 25000,
          costPrice: 20000,
          discountAmount: 0,
          profit: 5000,
          status: 'paid',
          supplierOrderId: 'o_cached_1',
          supplierStatus: 'fulfilled',
          credentialsJson: JSON.stringify([{ email: 'cached@test.com', password: 'secret' }]),
          createdAt: '',
          updatedAt: '',
        },
      }),
      createOrder: async () => {
        orderCalled = true;
        return { success: false, error: 'Should not be called' };
      },
    }
  );

  assert.equal(orderCalled, false);
  assert.equal(outcome.status, 'fulfilled');
  assert.equal(outcome.fromCache, true);
  assert.equal(outcome.supplierOrderId, 'o_cached_1');
  assert.equal(outcome.accountEmail, 'cached@test.com');
  assert.equal(outcome.accountPassword, 'secret');
});

test('fulfillXavieraOrderForTransaction records failure cleanly and builds fallback message', async () => {
  const completed: any[] = [];
  const outcome = await fulfillXavieraOrderForTransaction(
    {
      orderId: 'ORD-TEST-003',
      config: buildConfig(),
      productName: 'Netflix',
      variantName: '1 Bulan',
      xavieraProductId: 'p_netflix1',
    },
    {
      claim: () => ({ claimed: true }),
      complete: (orderId, result) => completed.push({ orderId, result }),
      createOrder: async () => ({
        success: false,
        status: 400,
        error: 'Saldo tidak cukup. Butuh Rp 25.000.',
      }),
    }
  );

  assert.equal(outcome.status, 'failed');
  assert.equal(outcome.error, 'Saldo tidak cukup. Butuh Rp 25.000.');
  assert.match(outcome.credentialsText, /ORD-TEST-003/);
  assert.equal(completed[0].result.supplierStatus, 'failed');
  assert.equal(completed[0].result.deliveryError, 'Saldo tidak cukup. Butuh Rp 25.000.');
});

test('resolvePlaceholders and buildPaymentSuccessDmMessage handle credential tokens and legacy fallback', () => {
  const cfg = buildConfig();
  const ctx = {
    name: 'Netflix',
    variant: '1 Bulan',
    orderId: 'ORD-100',
    total: 25100,
    customerName: 'Budi',
    credentials: '• *Email:* budi@netflix.test\n• *Password:* pass123',
    accountEmail: 'budi@netflix.test',
    accountPassword: 'pass123',
    supplierOrderId: 'o_abc123',
    supplierStatus: 'fulfilled',
  };

  const withTokens = resolvePlaceholders(
    'Halo {customerName}, bayar Rp {totalPrice}. Email: {accountEmail} | Pass: {accountPassword} | ID: {supplierOrderId}\n{credentials}',
    cfg,
    ctx
  );
  assert.equal(
    withTokens,
    'Halo Budi, bayar Rp 25.100. Email: budi@netflix.test | Pass: pass123 | ID: o_abc123\n• *Email:* budi@netflix.test\n• *Password:* pass123'
  );

  const fulfillment = {
    status: 'fulfilled' as const,
    supplierOrderId: 'o_abc123',
    credentialsText: ctx.credentials,
    accountEmail: ctx.accountEmail,
    accountPassword: ctx.accountPassword,
    credentials: [{ email: ctx.accountEmail, password: ctx.accountPassword }],
  };

  // Template with {credentials} should NOT duplicate block
  const explicitMsg = buildPaymentSuccessDmMessage('Akun:\n{credentials}', cfg, ctx, fulfillment);
  assert.equal(explicitMsg, 'Akun:\n• *Email:* budi@netflix.test\n• *Password:* pass123');

  // Legacy template without credential placeholder MUST auto-append block
  const legacyMsg = buildPaymentSuccessDmMessage(
    'Pembayaran order #{orderId} lunas!',
    cfg,
    ctx,
    fulfillment
  );
  assert.match(legacyMsg, /^Pembayaran order #ORD-100 lunas!/);
  assert.match(legacyMsg, /Detail Akun \/ Kredensial Anda/);
  assert.match(legacyMsg, /budi@netflix\.test/);
});

test('SQLite atomic claimTransactionFulfillment prevents concurrent double-claim', async (t) => {
  const tempTenant = `t_test_fulfill_${Date.now()}`;
  t.after(() => {
    try {
      deleteTenantDb(tempTenant);
    } catch {}
    const dbDir = path.resolve(process.cwd(), 'database', 'tenants');
    for (const ext of ['', '-wal', '-shm']) {
      const f = path.join(dbDir, `${tempTenant}.db${ext}`);
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
  });

  await runWithTenant(tempTenant, () => {
    initTenantDb(tempTenant);
    recordTransaction({
      orderId: 'ORD-SQL-1',
      customerNumber: '628522222222',
      customerName: 'Siti',
      productName: 'Viu',
      variantName: '1 Bulan',
      nominal: 5000,
      uniqueCode: 11,
      total: 5011,
      xavieraProductId: 'p_viu',
      xavieraVariantId: 'vr_viu1b',
      status: 'paid',
    });

    const first = claimTransactionFulfillment('ORD-SQL-1');
    assert.equal(first.claimed, true);
    assert.equal(first.existing?.xavieraProductId, 'p_viu');
    assert.equal(first.existing?.xavieraVariantId, 'vr_viu1b');

    const second = claimTransactionFulfillment('ORD-SQL-1');
    assert.equal(second.claimed, false);
    assert.equal(second.reason, 'in_progress');

    completeTransactionFulfillment('ORD-SQL-1', {
      supplierOrderId: 'o_xav_77',
      supplierStatus: 'fulfilled',
      credentials: [{ email: 'siti@viu.test', password: 'abc' }],
    });

    const third = claimTransactionFulfillment('ORD-SQL-1');
    assert.equal(third.claimed, false);
    assert.equal(third.reason, 'already_fulfilled');
    const saved = getTransactionByOrderId('ORD-SQL-1');
    assert.equal(saved?.supplierOrderId, 'o_xav_77');
    assert.equal(saved?.supplierStatus, 'fulfilled');
  });
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { runWithTenant } from '../database/tenantContext.ts';
import { deleteTenantDb, getTenantDb } from '../database/tenantDbManager.ts';
import {
  getAllTransactions,
  getTransactionSummary,
  recordTransaction,
} from './transactionManager.ts';

import { buildTransactionsCsvContent } from '../../frontend/src/utils/exportTransactionsCsv.ts';

test('profit calculation (harga jual - harga modal - promo), category persistence, and 7-day vs previous 7-day summary', async (t) => {
  const tempTenantId = `t_test_profit_${Date.now()}`;
  t.after(() => {
    deleteTenantDb(tempTenantId);
  });

  await runWithTenant(tempTenantId, async () => {
    // 1. Transaksi dengan promo & kategori Xaviera: Harga jual 12.000, Modal 10.000, Promo 500 => Untung 1.500
    const trxPromo = recordTransaction({
      orderId: 'ORD-TEST-1',
      customerNumber: '6281234567890',
      productName: 'Netflix',
      variantName: '1 Bulan',
      category: 'Streaming',
      nominal: 11500,
      uniqueCode: 123,
      total: 11623,
      sellingPrice: 12000,
      costPrice: 10000,
      discountAmount: 500,
      status: 'paid',
    });
    assert.equal(trxPromo.profit, 1500);
    assert.equal(trxPromo.category, 'Streaming');

    // 2. Transaksi tanpa data modal (legacy) => Untung 0
    const trxLegacy = recordTransaction({
      orderId: 'ORD-TEST-2',
      customerNumber: '6281234567891',
      productName: 'Spotify',
      variantName: '1 Bulan',
      nominal: 5000,
      uniqueCode: 50,
      total: 5050,
      status: 'paid',
    });
    assert.equal(trxLegacy.profit, 0);

    // 3. Transaksi pending tidak dihitung ke omzet/untung
    recordTransaction({
      orderId: 'ORD-TEST-3',
      customerNumber: '6281234567892',
      productName: 'Canva',
      variantName: 'Pro',
      nominal: 10000,
      uniqueCode: 11,
      total: 10011,
      sellingPrice: 10000,
      costPrice: 6000,
      discountAmount: 0,
      status: 'pending',
    });

    // 4. Transaksi 10 hari lalu (masuk window 7 hari sebelumnya) untuk verifikasi % perbandingan
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    const db = getTenantDb(tempTenantId);
    db.prepare(`
      INSERT INTO transactions (
        id, order_id, trx_id, customer_number, customer_name,
        product_name, variant_name, nominal, unique_code, total,
        selling_price, cost_price, discount_amount, profit,
        status, payment_url, promo_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'TRX-ORD-OLD-10D',
      'ORD-OLD-10D',
      '',
      '6281234567899',
      'Pelanggan Lama',
      'YouTube',
      '1 Bulan',
      11000,
      0,
      11000,
      11000,
      9000,
      0,
      2000,
      'paid',
      '',
      null,
      tenDaysAgo,
      tenDaysAgo
    );

    const all = getAllTransactions();
    assert.equal(all.length, 4);

    const summary = getTransactionSummary();
    assert.equal(summary.totalCount, 4);
    assert.equal(summary.paidCount, 3);
    assert.equal(summary.pendingCount, 1);
    assert.equal(summary.cancelCount, 0);

    // All-time: 11500 + 5000 + 11000 = 27500; profit: 1500 + 0 + 2000 = 3500
    assert.equal(summary.totalRevenue, 27500);
    assert.equal(summary.totalProfit, 3500);

    // 7 hari terakhir: 11500 + 5000 = 16500; profit: 1500; paidCount7d: 2
    assert.equal(summary.revenue7d, 16500);
    assert.equal(summary.profit7d, 1500);
    assert.equal(summary.paidCount7d, 2);
    assert.equal(summary.prevRevenue7d, 11000);
    // (16500 - 11000) / 11000 * 100 = 50%
    assert.equal(summary.revenueChangePercent, 50);
    // 1500 / 16500 * 100 = 9.0909... => 9.1%
    assert.equal(summary.margin7dPercent, 9.1);
  });
});

test('buildTransactionsCsvContent emits UTF-8 BOM, complete columns, Indonesian status, and escapes CSV formulas', () => {
  const csv = buildTransactionsCsvContent([
    {
      id: 'TRX-1',
      orderId: 'ORD-CSV-1',
      customerNumber: '628123456',
      customerName: 'Budi',
      productName: '=CMD("calc")',
      variantName: '1 Bulan, VIP',
      category: 'Streaming',
      costPrice: 10000,
      discountAmount: 500,
      nominal: 11500,
      uniqueCode: 12,
      total: 11512,
      profit: 1500,
      status: 'paid',
      createdAt: '2026-11-26T01:00:00.000Z',
      updatedAt: '2026-11-26T01:05:00.000Z',
    },
  ]);

  assert.ok(csv.startsWith('\uFEFFTanggal,Order ID,Pembeli,Produk,Varian,Kategori,Harga Modal,Diskon Promo,Nominal,Kode Unik,Total,Keuntungan,Status'));
  assert.ok(csv.includes("'=CMD(\"\"calc\"\")"));
  assert.ok(csv.includes('"1 Bulan, VIP"'));
  assert.ok(csv.includes(',Streaming,10000,500,11500,12,11512,1500,Lunas'));
});


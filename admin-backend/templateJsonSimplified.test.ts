import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  TemplateService,
  normalizeJsonButtonInput,
  simplifyButtonForExport,
} from './services/templateService.ts';
import {
  buildSampleMultiCategoryJson,
  buildTemplateSignature as buildFrontendSignature,
  normalizeJsonButtonsList as normalizeFrontendButtonsList,
  simplifyButtonForExport as simplifyFrontendButtonForExport,
} from '../admin-frontend/src/utils/templateButtons.ts';

test('Simplified JSON normalizes buttons, footer, active flag, and mandatory roles identically on backend & frontend', () => {
  const simplifiedButtons = [
    { type: 'reply', name: '📋 Katalog', action: 'list' },
    { type: 'url', name: '🌐 Web', url: '{webLink}' },
    { type: 'copy', name: '🎟️ Promo', value: 'HEMAT10' },
    { type: 'call', name: '📞 CS', phone: '{adminNumber}' },
    { type: 'vcard', name: '👤 Kontak', contactName: '{adminName}', phone: '{adminNumber}' },
  ];

  const frontendNormalized = normalizeFrontendButtonsList(simplifiedButtons, 'menu');
  assert.equal(frontendNormalized.warnings.length, 0);
  assert.equal(frontendNormalized.buttons.length, 5);

  simplifiedButtons.forEach((rawBtn, idx) => {
    const backendRes = normalizeJsonButtonInput(rawBtn, 'menu');
    assert.ok(backendRes.button);
    assert.equal(backendRes.button.type, frontendNormalized.buttons[idx].type);
    assert.equal(backendRes.button.name, frontendNormalized.buttons[idx].name);
    assert.equal(backendRes.button.output, frontendNormalized.buttons[idx].output);
    assert.equal(backendRes.button.triggerAction, frontendNormalized.buttons[idx].triggerAction);
    assert.equal(backendRes.button.callPhoneNumber, frontendNormalized.buttons[idx].callPhoneNumber);
    assert.equal(backendRes.button.callTargetName, frontendNormalized.buttons[idx].callTargetName);

    const exportedBackend = simplifyButtonForExport(backendRes.button);
    const exportedFrontend = simplifyFrontendButtonForExport(frontendNormalized.buttons[idx]);
    assert.deepEqual(exportedBackend, exportedFrontend);
  });

  // Verify role override warning on locked mandatory button
  const warnRes = normalizeJsonButtonInput(
    { role: 'pay', name: 'Bayar QRIS Custom', type: 'reply', value: 'hacked' },
    'invoice',
  );
  assert.equal(warnRes.warnings.length, 1);
  assert.equal(warnRes.button?.type, 'cta_url');
  assert.equal(warnRes.button?.output, '{paymentUrl}');
  assert.equal(warnRes.button?.name, 'Bayar QRIS Custom');
  assert.equal(warnRes.button?.mandatory, true);
  assert.equal(warnRes.button?.mandatoryRole, 'invoice_pay_url');
});

test('Sample multi-category JSON parses cleanly via frontend normalizer', () => {
  const sampleRaw = buildSampleMultiCategoryJson();
  const parsed = JSON.parse(sampleRaw) as Record<string, any>;
  assert.equal(Object.keys(parsed).length, 28);
  for (const [cat, entry] of Object.entries(parsed)) {
    const res = normalizeFrontendButtonsList(entry.buttons, cat as any);
    assert.equal(res.warnings.length, 0, `Unexpected warning on sample category ${cat}`);
    const sig = buildFrontendSignature({
      category: cat as any,
      name: entry.name,
      content: entry.content,
      footer_text: entry.footer || '',
      buttons: res.buttons,
    });
    assert.ok(sig.length > 0);
  }
});

test('TemplateService imports simplified JSON, skips duplicates across legacy/simplified formats, and exports simplified JSON', () => {
  const origCwd = process.cwd();
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wanzt-tpl-json-'));
  fs.mkdirSync(path.join(tmpDir, 'database'), { recursive: true });

  try {
    process.chdir(tmpDir);

    // 1. Import simplified JSON
    const importRes = TemplateService.importTemplatesFromJson({
      menu: {
        name: 'Menu Sederhana',
        content: 'Halo {storeName}!',
        footer: '{webLink}',
        buttons: [
          { type: 'reply', name: 'Daftar Produk', action: 'list' },
          { type: 'url', name: 'Website', url: '{webLink}' },
        ],
      },
      invoice: {
        name: 'Invoice Custom Role',
        content: 'Bayar Rp {total} order {orderId}',
        footer: '{storeName} • QRIS',
        active: false,
        buttons: [
          { role: 'pay', name: '💳 Bayar Cepat' },
          { role: 'admin', name: '💬 CS Toko' },
        ],
      },
    });

    assert.equal(importRes.importedCount, 2);
    assert.equal(importRes.skippedCount, 0);

    const savedMenu = importRes.templates.find((t) => t.category === 'menu');
    assert.ok(savedMenu);
    assert.equal(savedMenu.footer_text, '{webLink}');
    assert.equal(savedMenu.is_active, 1);
    assert.equal(savedMenu.buttons[0].type, 'quick_reply');
    assert.equal(savedMenu.buttons[0].output, '.list');
    assert.equal(savedMenu.buttons[0].triggerAction, 'list');
    assert.equal(savedMenu.buttons[1].type, 'cta_url');
    assert.equal(savedMenu.buttons[1].output, '{webLink}');

    const savedInvoice = importRes.templates.find((t) => t.category === 'invoice');
    assert.ok(savedInvoice);
    assert.equal(savedInvoice.is_active, 0);
    assert.equal(savedInvoice.buttons[0].mandatoryRole, 'invoice_pay_url');
    assert.equal(savedInvoice.buttons[0].name, '💳 Bayar Cepat');
    assert.equal(savedInvoice.buttons[1].mandatoryRole, 'invoice_contact_admin');
    assert.equal(savedInvoice.buttons[1].name, '💬 CS Toko');

    // 2. Re-import exact same templates using legacy verbose format -> must be detected as duplicates!
    const legacyDuplicateRes = TemplateService.importTemplatesFromJson({
      menu: {
        name: 'Menu Sederhana',
        content: 'Halo {storeName}!',
        footer_text: '{webLink}',
        is_active: 1,
        buttons: [
          {
            id: 'legacy_1',
            type: 'quick_reply',
            name: 'Daftar Produk',
            output: '.list',
            triggerAction: 'list',
          },
          {
            id: 'legacy_2',
            type: 'cta_url',
            name: 'Website',
            output: '{webLink}',
          },
        ],
      },
      invoice: {
        name: 'Invoice Custom Role',
        content: 'Bayar Rp {total} order {orderId}',
        footer_text: '{storeName} • QRIS',
        is_active: 0,
        buttons: [
          {
            id: 'mandatory_invoice_pay',
            type: 'cta_url',
            name: '💳 Bayar Cepat',
            output: '{paymentUrl}',
            mandatory: true,
            mandatoryRole: 'invoice_pay_url',
          },
          {
            id: 'mandatory_invoice_admin',
            type: 'cta_url',
            name: '💬 CS Toko',
            output: '{invoiceAdminUrl}',
            mandatory: true,
            mandatoryRole: 'invoice_contact_admin',
          },
        ],
      },
    });

    assert.equal(legacyDuplicateRes.importedCount, 0);
    assert.equal(legacyDuplicateRes.skippedCount, 2);

    // 3. Export JSON and check simplified structure + re-import duplicate check
    const exported = TemplateService.formatTemplatesAsGroupedJson();
    // 8 seeded defaults + 2 newly imported templates = 10
    assert.equal(exported.count, 10);
    const exportedParsed = JSON.parse(exported.jsonText);

    const exportedMenu = Array.isArray(exportedParsed.menu)
      ? exportedParsed.menu[0]
      : exportedParsed.menu;
    assert.equal(exportedMenu.name, 'Menu Sederhana');
    assert.equal(exportedMenu.footer, '{webLink}');
    assert.equal(exportedMenu.footer_text, undefined);
    assert.equal(exportedMenu.active, undefined);
    assert.equal(exportedMenu.buttons[0].id, undefined);
    assert.equal(exportedMenu.buttons[0].type, 'reply');
    assert.equal(exportedMenu.buttons[0].action, 'list');

    const exportedInvoice = Array.isArray(exportedParsed.invoice)
      ? exportedParsed.invoice[0]
      : exportedParsed.invoice;
    assert.equal(exportedInvoice.name, 'Invoice Custom Role');
    assert.equal(exportedInvoice.active, false);
    assert.deepEqual(exportedInvoice.buttons, [
      { role: 'pay', name: '💳 Bayar Cepat' },
      { role: 'admin', name: '💬 CS Toko' },
    ]);

    const reimportExported = TemplateService.importTemplatesFromJson(exportedParsed);
    assert.equal(reimportExported.importedCount, 0);
    assert.equal(reimportExported.skippedCount, 10);
  } finally {
    process.chdir(origCwd);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

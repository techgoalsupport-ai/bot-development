import test from 'node:test';
import assert from 'node:assert/strict';
import { parseGroupSettingCommand } from './groupSettingUtils.ts';
import { handleGroupSettingCommand } from './groupSettingHandler.ts';
import { DEFAULT_CONFIG } from '../config/configManager.ts';
import type { CommandsConfig } from '../types/bot.types.ts';
import type { DispatcherDeps } from './messageDispatcher.ts';

function buildDeps(): { deps: DispatcherDeps; logs: Array<{ type: string; msg: string }> } {
  const logs: Array<{ type: string; msg: string }> = [];
  const deps: DispatcherDeps = {
    addLog: (type, msg) => logs.push({ type, msg }),
    resolveTargetJid: (jid: string) => jid,
  };
  return { deps, logs };
}

function buildConfig(overrides: Partial<CommandsConfig> = {}): CommandsConfig {
  return {
    ...DEFAULT_CONFIG,
    storeInfo: {
      storeName: 'Wanzt Test Store',
      ownerName: 'Budi Owner',
      ownerNumber: '628111111111',
      adminName: 'CS Admin',
      adminNumber: '628199999999',
    },
    ...overrides,
  };
}

test('parseGroupSettingCommand matches Open/open/Close/close with or without allowed prefixes', () => {
  for (const text of ['open', 'Open', '.open', '.Open', '/open', '!Open', '#open']) {
    const parsed = parseGroupSettingCommand(text);
    assert.equal(parsed.isMatch, true, `Should match open: ${text}`);
    assert.equal(parsed.action, 'open');
  }

  for (const text of ['close', 'Close', '.close', '.Close', '/close', '!Close', '#close']) {
    const parsed = parseGroupSettingCommand(text);
    assert.equal(parsed.isMatch, true, `Should match close: ${text}`);
    assert.equal(parsed.action, 'close');
  }

  for (const text of ['', 'open order', 'close ya', 'reopen', 'opening', '@628111 open']) {
    const parsed = parseGroupSettingCommand(text);
    assert.equal(parsed.isMatch, false, `Should NOT match: ${text}`);
  }
});

test('handleGroupSettingCommand ignores non-admin triggers silently', async () => {
  const sentMessages: any[] = [];
  const settingUpdates: any[] = [];
  const { deps } = buildDeps();

  const sock = {
    user: { id: '628000000000:1@s.whatsapp.net' },
    groupMetadata: async () => ({
      id: '1203630001@g.us',
      subject: 'Grup Buyer',
      announce: false,
      participants: [
        { id: '628000000000@s.whatsapp.net', admin: 'admin' },
        { id: '628333333333@s.whatsapp.net', admin: null },
      ],
    }),
    groupSettingUpdate: async (jid: string, setting: string) => {
      settingUpdates.push({ jid, setting });
    },
    sendMessage: async (_jid: string, payload: any) => {
      sentMessages.push(payload);
      return { key: { id: 'msg1' } };
    },
  };

  await handleGroupSettingCommand({
    sock,
    remoteJid: '1203630001@g.us',
    action: 'close',
    config: buildConfig(),
    deps,
    message: {
      key: {
        remoteJid: '1203630001@g.us',
        participant: '628333333333@s.whatsapp.net',
      },
      message: { conversation: 'close' },
    },
  });

  assert.equal(settingUpdates.length, 0);
  assert.equal(sentMessages.length, 0);
});

test('handleGroupSettingCommand sends bot-not-admin message for Open & Close when bot is not admin', async () => {
  const sentMessages: any[] = [];
  const settingUpdates: any[] = [];
  const { deps } = buildDeps();

  const sock = {
    user: { id: '628000000000:1@s.whatsapp.net' },
    groupMetadata: async () => ({
      id: '1203630002@g.us',
      subject: 'Grup Reseller',
      announce: false,
      participants: [
        { id: '628000000000@s.whatsapp.net', admin: null },
        { id: '628222222222@s.whatsapp.net', admin: 'admin' },
      ],
    }),
    groupSettingUpdate: async (jid: string, setting: string) => {
      settingUpdates.push({ jid, setting });
    },
    sendMessage: async (_jid: string, payload: any) => {
      sentMessages.push(payload);
      return { key: { id: 'msg2' } };
    },
  };

  const baseMessage = {
    key: {
      remoteJid: '1203630002@g.us',
      participant: '628222222222@s.whatsapp.net',
    },
    message: { conversation: '.close' },
  };

  await handleGroupSettingCommand({
    sock,
    remoteJid: '1203630002@g.us',
    action: 'close',
    config: buildConfig({ closeBotNotAdminText: 'Bot belum admin close di {groupName}' }),
    deps,
    message: baseMessage,
  });

  await handleGroupSettingCommand({
    sock,
    remoteJid: '1203630002@g.us',
    action: 'open',
    config: buildConfig({ openBotNotAdminText: 'Bot belum admin open di {groupName}' }),
    deps,
    message: baseMessage,
  });

  assert.equal(settingUpdates.length, 0);
  assert.equal(sentMessages.length, 2);
  assert.match(sentMessages[0].text, /Bot belum admin close di Grup Reseller/);
  assert.match(sentMessages[1].text, /Bot belum admin open di Grup Reseller/);
});

test('handleGroupSettingCommand replies with already-set message when group is already closed or open', async () => {
  const sentMessages: any[] = [];
  const settingUpdates: any[] = [];
  const { deps } = buildDeps();

  let currentAnnounce = true;

  const sock = {
    user: { id: '628000000000:1@s.whatsapp.net' },
    groupMetadata: async () => ({
      id: '1203630003@g.us',
      subject: 'Grup VIP',
      announce: currentAnnounce,
      participants: [
        { id: '628000000000@s.whatsapp.net', admin: 'admin' },
        { id: '628222222222@s.whatsapp.net', admin: 'admin' },
      ],
    }),
    groupSettingUpdate: async (jid: string, setting: string) => {
      settingUpdates.push({ jid, setting });
    },
    sendMessage: async (_jid: string, payload: any) => {
      sentMessages.push(payload);
      return { key: { id: 'msg3' } };
    },
  };

  const baseMessage = {
    key: {
      remoteJid: '1203630003@g.us',
      participant: '628222222222@s.whatsapp.net',
    },
    message: { conversation: 'close' },
  };

  await handleGroupSettingCommand({
    sock,
    remoteJid: '1203630003@g.us',
    action: 'close',
    config: buildConfig({ closeAlreadyText: 'Kondisi grup {groupName} sudah di tutup' }),
    deps,
    message: baseMessage,
  });

  currentAnnounce = false;
  await handleGroupSettingCommand({
    sock,
    remoteJid: '1203630003@g.us',
    action: 'open',
    config: buildConfig({ openAlreadyText: 'Kondisi grup {groupName} sudah di buka' }),
    deps,
    message: baseMessage,
  });

  assert.equal(settingUpdates.length, 0);
  assert.equal(sentMessages.length, 2);
  assert.match(sentMessages[0].text, /Kondisi grup Grup VIP sudah di tutup/);
  assert.match(sentMessages[1].text, /Kondisi grup Grup VIP sudah di buka/);
});

test('handleGroupSettingCommand updates group setting and sends confirmation for Close and Open', async () => {
  const sentMessages: any[] = [];
  const settingUpdates: any[] = [];
  const { deps } = buildDeps();

  let currentAnnounce = false;

  const sock = {
    user: { id: '628000000000:1@s.whatsapp.net' },
    groupMetadata: async () => ({
      id: '1203630004@g.us',
      subject: 'Grup Order',
      announce: currentAnnounce,
      participants: [
        { id: '628000000000@s.whatsapp.net', admin: 'admin' },
        { id: '628222222222@s.whatsapp.net', admin: 'superadmin' },
      ],
    }),
    groupSettingUpdate: async (jid: string, setting: string) => {
      settingUpdates.push({ jid, setting });
      currentAnnounce = setting === 'announcement';
    },
    sendMessage: async (_jid: string, payload: any) => {
      sentMessages.push(payload);
      return { key: { id: 'msg4' } };
    },
  };

  const baseMessage = {
    key: {
      remoteJid: '1203630004@g.us',
      participant: '628222222222@s.whatsapp.net',
    },
    message: { conversation: '.close' },
  };

  await handleGroupSettingCommand({
    sock,
    remoteJid: '1203630004@g.us',
    action: 'close',
    config: buildConfig({ closeSuccessText: 'Grup {groupName} ditutup oleh @{pelakuNumber}' }),
    deps,
    message: baseMessage,
  });

  await handleGroupSettingCommand({
    sock,
    remoteJid: '1203630004@g.us',
    action: 'open',
    config: buildConfig({ openSuccessText: 'Grup {groupName} dibuka oleh @{pelakuNumber}' }),
    deps,
    message: baseMessage,
  });

  assert.deepEqual(settingUpdates, [
    { jid: '1203630004@g.us', setting: 'announcement' },
    { jid: '1203630004@g.us', setting: 'not_announcement' },
  ]);
  assert.equal(sentMessages.length, 2);
  assert.match(sentMessages[0].text, /Grup Order ditutup oleh @628222222222/);
  assert.match(sentMessages[1].text, /Grup Order dibuka oleh @628222222222/);
  assert.equal(sentMessages[0].footer, undefined);
  assert.equal(sentMessages[0].text.includes('Moderasi Grup'), false);
  assert.equal(sentMessages[1].footer, undefined);
  assert.equal(sentMessages[1].text.includes('Moderasi Grup'), false);
});

test('handleGroupSettingCommand omits footer when 0 buttons exist and includes footer automatically when interactive buttons exist', async () => {
  const sentMessages: any[] = [];
  const { deps } = buildDeps();

  let currentAnnounce = false;
  const sock = {
    user: { id: '628000000000:1@s.whatsapp.net' },
    groupMetadata: async () => ({
      id: '1203630005@g.us',
      subject: 'Grup Resmi',
      announce: currentAnnounce,
      participants: [
        { id: '628000000000@s.whatsapp.net', admin: 'admin' },
        { id: '628222222222@s.whatsapp.net', admin: 'admin' },
      ],
    }),
    groupSettingUpdate: async (_jid: string, setting: string) => {
      currentAnnounce = setting === 'announcement';
    },
    sendMessage: async (_jid: string, payload: any) => {
      sentMessages.push(payload);
      return { key: { id: 'msg5' } };
    },
  };

  const baseMessage = {
    key: {
      remoteJid: '1203630005@g.us',
      participant: '628222222222@s.whatsapp.net',
    },
    message: { conversation: '.close' },
  };

  await handleGroupSettingCommand({
    sock,
    remoteJid: '1203630005@g.us',
    action: 'close',
    config: buildConfig({
      closeSuccessText: 'Grup ditutup',
      closeSuccessFooter: '{storeName} • Footer Moderasi',
      responseExtras: {
        close_success: { includeMedia: false, selectedPicture: '', buttons: [] },
      },
    }),
    deps,
    message: baseMessage,
  });

  await handleGroupSettingCommand({
    sock,
    remoteJid: '1203630005@g.us',
    action: 'open',
    config: buildConfig({
      openSuccessText: 'Grup dibuka',
      openSuccessFooter: '{storeName} • Footer Moderasi',
      responseExtras: {
        open_success: {
          includeMedia: false,
          selectedPicture: '',
          buttons: [
            { id: 'btn_menu', name: 'Menu Toko', type: 'quick_reply', output: '.menu' },
          ],
        },
      },
    }),
    deps,
    message: baseMessage,
  });

  assert.equal(sentMessages.length, 2);
  // Tanpa tombol: footer tidak boleh disertakan
  assert.equal(sentMessages[0].text, 'Grup ditutup');
  assert.equal(sentMessages[0].footer, undefined);
  assert.equal(sentMessages[0].nativeFlow, undefined);
  // Dengan tombol interaktif: footer otomatis disertakan bersama nativeFlow
  assert.equal(sentMessages[1].text, 'Grup dibuka');
  assert.equal(sentMessages[1].footer, 'Wanzt Test Store • Footer Moderasi');
  assert.equal(Array.isArray(sentMessages[1].nativeFlow), true);
  assert.equal(sentMessages[1].nativeFlow.length, 1);
});


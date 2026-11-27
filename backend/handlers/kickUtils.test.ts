import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_CONFIG } from '../config/configManager.ts';
import { CommandsConfig } from '../types/bot.types.ts';
import { handleKickCommand } from './kickHandler.ts';
import {
  extractKickTargetInfo,
  findGroupParticipant,
  isBotTargetMatch,
  isGroupCreatorParticipant,
  isOwnerTargetMatch,
  parseKickCommand,
} from './kickUtils.ts';

function buildConfig(overrides: Partial<CommandsConfig> = {}): CommandsConfig {
  return {
    ...DEFAULT_CONFIG,
    ...overrides,
    storeInfo: {
      ...DEFAULT_CONFIG.storeInfo,
      storeName: 'Wanzt Test Store',
      ownerName: 'Budi Owner',
      ownerNumber: '081234567890',
      ...(overrides.storeInfo || {}),
    },
  };
}

function createMockDeps() {
  const logs: Array<{ type: string; msg: string }> = [];
  return {
    logs,
    deps: {
      addLog: (type: any, msg: string) => logs.push({ type, msg }),
      resolveTargetJid: (jid: string) => jid,
      saveManualTransaction: () => {},
      markManualTransactionPaid: () => {},
      markManualTransactionExpired: () => {},
    },
  };
}

test('parseKickCommand matches Kick/kick with and without prefixes or @mentions', () => {
  for (const text of ['Kick', 'kick', 'KICK', '/kick', '/Kick', '.kick', '.Kick', '!kick', '#Kick']) {
    const parsed = parseKickCommand(text);
    assert.equal(parsed.isMatch, true, `Expected "${text}" to match`);
    assert.equal(parsed.hasMentionText, false);
  }

  for (const text of ['Kick @628111', 'kick @user', '.kick @628111', '/Kick @user']) {
    const parsed = parseKickCommand(text);
    assert.equal(parsed.isMatch, true, `Expected "${text}" to match`);
    assert.equal(parsed.hasMentionText, true);
  }

  for (const text of ['', 'hello', 'kick member', 'kicking', '/kick all', '@628111 kick']) {
    const parsed = parseKickCommand(text);
    assert.equal(parsed.isMatch, false, `Expected "${text}" NOT to match`);
  }
});

test('extractKickTargetInfo extracts from reply or @mention, otherwise null', () => {
  const fromReply = extractKickTargetInfo({
    extendedTextMessage: {
      text: 'kick',
      contextInfo: {
        quotedMessage: { conversation: 'halo' },
        participant: '628999888777:4@s.whatsapp.net',
      },
    },
  });
  assert.equal(fromReply?.source, 'reply');
  assert.equal(fromReply?.primaryTargetJid, '628999888777@s.whatsapp.net');

  const fromMention = extractKickTargetInfo({
    extendedTextMessage: {
      text: '.kick @628555444333',
      contextInfo: {
        mentionedJid: ['628555444333:0@s.whatsapp.net'],
      },
    },
  });
  assert.equal(fromMention?.source, 'mention');
  assert.equal(fromMention?.primaryTargetJid, '628555444333@s.whatsapp.net');

  const noTarget = extractKickTargetInfo({
    extendedTextMessage: { text: 'kick' },
  });
  assert.equal(noTarget, null);
});

test('isOwnerTargetMatch & isBotTargetMatch match PN and LID accurately', () => {
  const participants = [
    { id: '9988776655@lid', phoneNumber: '6281234567890@s.whatsapp.net', admin: null },
    { id: '628000000001@s.whatsapp.net', lid: '11223344@lid', admin: 'admin' },
  ];

  const ownerParticipant = findGroupParticipant(participants, ['9988776655@lid']);
  assert.ok(ownerParticipant);
  assert.equal(isOwnerTargetMatch(ownerParticipant, ['9988776655@lid'], '081234567890'), true);
  assert.equal(isOwnerTargetMatch(ownerParticipant, ['9988776655@lid'], '628999999999'), false);

  const botParticipant = findGroupParticipant(participants, ['11223344@lid']);
  assert.ok(botParticipant);
  assert.equal(
    isBotTargetMatch(botParticipant, ['11223344@lid'], {
      id: '628000000001:2@s.whatsapp.net',
      lid: '11223344:0@lid',
    }),
    true,
  );
  assert.equal(isGroupCreatorParticipant({ id: '628111@s.whatsapp.net', admin: 'superadmin' }), true);
  assert.equal(isGroupCreatorParticipant({ id: '628111@s.whatsapp.net', admin: 'admin' }), false);
});

test('handleKickCommand ignores non-admin triggers silently', async () => {
  const sentMessages: any[] = [];
  const participantUpdates: any[] = [];
  const sock = {
    user: { id: '628000000001:0@s.whatsapp.net' },
    groupMetadata: async () => ({
      subject: 'Grup Test',
      participants: [
        { id: '628000000001@s.whatsapp.net', admin: 'admin' },
        { id: '628777777777@s.whatsapp.net', admin: null },
        { id: '628888888888@s.whatsapp.net', admin: null },
      ],
    }),
    sendMessage: async (jid: string, content: any) => sentMessages.push({ jid, content }),
    groupParticipantsUpdate: async (...args: any[]) => participantUpdates.push(args),
    groupLeave: async () => {},
  };

  const { deps } = createMockDeps();
  await handleKickCommand({
    sock,
    remoteJid: '120363000000000@g.us',
    config: buildConfig(),
    deps,
    message: {
      key: {
        remoteJid: '120363000000000@g.us',
        participant: '628777777777@s.whatsapp.net',
      },
      message: {
        extendedTextMessage: {
          text: 'kick',
          contextInfo: {
            quotedMessage: { conversation: 'hi' },
            participant: '628888888888@s.whatsapp.net',
          },
        },
      },
    },
  });

  assert.equal(sentMessages.length, 0);
  assert.equal(participantUpdates.length, 0);
});

test('handleKickCommand ignores when triggered without reply and without @mention', async () => {
  const sentMessages: any[] = [];
  const participantUpdates: any[] = [];
  const sock = {
    user: { id: '628000000001@s.whatsapp.net' },
    groupMetadata: async () => ({
      subject: 'Grup Test',
      participants: [
        { id: '628000000001@s.whatsapp.net', admin: 'admin' },
        { id: '628111111111@s.whatsapp.net', admin: 'admin' },
      ],
    }),
    sendMessage: async (jid: string, content: any) => sentMessages.push({ jid, content }),
    groupParticipantsUpdate: async (...args: any[]) => participantUpdates.push(args),
    groupLeave: async () => {},
  };

  const { deps } = createMockDeps();
  await handleKickCommand({
    sock,
    remoteJid: '120363000000000@g.us',
    config: buildConfig(),
    deps,
    message: {
      key: {
        remoteJid: '120363000000000@g.us',
        participant: '628111111111@s.whatsapp.net',
      },
      message: { conversation: 'kick' },
    },
  });

  assert.equal(sentMessages.length, 0);
  assert.equal(participantUpdates.length, 0);
});

test('handleKickCommand replies with bot-not-admin notice when bot is not group admin', async () => {
  const sentMessages: any[] = [];
  const participantUpdates: any[] = [];
  const sock = {
    user: { id: '628000000001@s.whatsapp.net' },
    groupMetadata: async () => ({
      subject: 'Grup Belanja',
      participants: [
        { id: '628000000001@s.whatsapp.net', admin: null },
        { id: '628111111111@s.whatsapp.net', admin: 'admin' },
        { id: '628888888888@s.whatsapp.net', admin: null },
      ],
    }),
    sendMessage: async (jid: string, content: any) => {
      sentMessages.push({ jid, content });
      return { key: { id: 'sent-1' } };
    },
    groupParticipantsUpdate: async (...args: any[]) => participantUpdates.push(args),
    groupLeave: async () => {},
  };

  const { deps } = createMockDeps();
  await handleKickCommand({
    sock,
    remoteJid: '120363000000000@g.us',
    config: buildConfig({ kickBotNotAdminText: 'Bot belum admin di {groupName}' }),
    deps,
    message: {
      key: {
        remoteJid: '120363000000000@g.us',
        participant: '628111111111@s.whatsapp.net',
      },
      message: {
        extendedTextMessage: {
          text: '.kick',
          contextInfo: {
            quotedMessage: { conversation: 'spam' },
            participant: '628888888888@s.whatsapp.net',
          },
        },
      },
    },
  });

  assert.equal(participantUpdates.length, 0);
  assert.equal(sentMessages.length, 1);
  assert.match(sentMessages[0].content.text, /Bot belum admin di Grup Belanja/);
});

test('handleKickCommand kicks normal member via @mention and sends success reply', async () => {
  const sentMessages: any[] = [];
  const participantUpdates: any[] = [];
  const sock = {
    user: { id: '628000000001@s.whatsapp.net' },
    groupMetadata: async () => ({
      subject: 'Grup Belanja',
      participants: [
        { id: '628000000001@s.whatsapp.net', admin: 'admin' },
        { id: '628111111111@s.whatsapp.net', admin: 'admin' },
        { id: '628888888888@s.whatsapp.net', admin: null },
      ],
    }),
    sendMessage: async (jid: string, content: any) => {
      sentMessages.push({ jid, content });
      return { key: { id: 'sent-2' } };
    },
    groupParticipantsUpdate: async (jid: string, targets: string[], action: string) => {
      participantUpdates.push({ jid, targets, action });
      return [{ status: '200', jid: targets[0] }];
    },
    groupLeave: async () => {},
  };

  const { deps } = createMockDeps();
  await handleKickCommand({
    sock,
    remoteJid: '120363000000000@g.us',
    config: buildConfig(),
    deps,
    message: {
      key: {
        remoteJid: '120363000000000@g.us',
        participant: '628111111111@s.whatsapp.net',
      },
      message: {
        extendedTextMessage: {
          text: 'Kick @628888888888',
          contextInfo: {
            mentionedJid: ['628888888888@s.whatsapp.net'],
          },
        },
      },
    },
  });

  assert.equal(participantUpdates.length, 1);
  assert.deepEqual(participantUpdates[0], {
    jid: '120363000000000@g.us',
    targets: ['628888888888@s.whatsapp.net'],
    action: 'remove',
  });
  assert.equal(sentMessages.length, 1);
  assert.match(sentMessages[0].content.text, /@628888888888/);
});

test('AntiKudeta: regular admin trying to kick Owner (via LID) gets kicked and mentioned', async () => {
  const sentMessages: any[] = [];
  const participantUpdates: any[] = [];
  const leftGroups: string[] = [];

  const sock = {
    user: { id: '628000000001@s.whatsapp.net' },
    signalRepository: {
      lidMapping: {
        getPNForLID: async (lid: string) =>
          lid === '555666777@lid' ? '6281234567890:1@s.whatsapp.net' : null,
      },
    },
    groupMetadata: async () => ({
      subject: 'Grup VIP',
      owner: '628999000111@s.whatsapp.net',
      participants: [
        { id: '628000000001@s.whatsapp.net', admin: 'admin' },
        { id: '628222333444@s.whatsapp.net', admin: 'admin' },
        { id: '555666777@lid', admin: null },
      ],
    }),
    sendMessage: async (jid: string, content: any) => {
      sentMessages.push({ jid, content });
      return { key: { id: 'sent-3' } };
    },
    groupParticipantsUpdate: async (jid: string, targets: string[], action: string) => {
      participantUpdates.push({ jid, targets, action });
      return [{ status: '200', jid: targets[0] }];
    },
    groupLeave: async (jid: string) => leftGroups.push(jid),
  };

  const { deps } = createMockDeps();
  await handleKickCommand({
    sock,
    remoteJid: '120363000000000@g.us',
    config: buildConfig(),
    deps,
    message: {
      key: {
        remoteJid: '120363000000000@g.us',
        participant: '628222333444@s.whatsapp.net',
      },
      message: {
        extendedTextMessage: {
          text: '/kick',
          contextInfo: {
            quotedMessage: { conversation: 'owner message' },
            participant: '555666777@lid',
          },
        },
      },
    },
  });

  assert.equal(leftGroups.length, 0);
  assert.equal(participantUpdates.length, 1);
  assert.deepEqual(participantUpdates[0].targets, ['628222333444@s.whatsapp.net']);
  assert.equal(sentMessages.length, 1);
  assert.equal(
    sentMessages[0].content.text.includes(
      '[AntiKudeta] @628222333444 terdeteksi mencoba mengeluarkan Budi Owner (Owner)',
    ),
    true,
  );
  assert.deepEqual(sentMessages[0].content.mentions, ['628222333444@s.whatsapp.net']);
});

test('AntiKudeta: group creator (superadmin) trying to kick Owner triggers owner kick and bot groupLeave', async () => {
  const sentMessages: any[] = [];
  const participantUpdates: any[] = [];
  const leftGroups: string[] = [];

  const sock = {
    user: { id: '628000000001@s.whatsapp.net' },
    groupMetadata: async () => ({
      subject: 'Grup Partner',
      owner: '628999000111@s.whatsapp.net',
      participants: [
        { id: '628000000001@s.whatsapp.net', admin: 'admin' },
        { id: '628999000111@s.whatsapp.net', admin: 'superadmin' },
        { id: '6281234567890@s.whatsapp.net', admin: 'admin' },
      ],
    }),
    sendMessage: async (jid: string, content: any) => {
      sentMessages.push({ jid, content });
      return { key: { id: 'sent-4' } };
    },
    groupParticipantsUpdate: async (jid: string, targets: string[], action: string) => {
      participantUpdates.push({ jid, targets, action });
      return [{ status: '200', jid: targets[0] }];
    },
    groupLeave: async (jid: string) => leftGroups.push(jid),
  };

  const { deps } = createMockDeps();
  await handleKickCommand({
    sock,
    remoteJid: '120363000000000@g.us',
    config: buildConfig(),
    deps,
    message: {
      key: {
        remoteJid: '120363000000000@g.us',
        participant: '628999000111@s.whatsapp.net',
      },
      message: {
        extendedTextMessage: {
          text: '!Kick',
          contextInfo: {
            quotedMessage: { conversation: 'owner message' },
            participant: '6281234567890@s.whatsapp.net',
          },
        },
      },
    },
  });

  assert.equal(sentMessages.length, 1);
  assert.equal(
    sentMessages[0].content.text.includes(
      '[AntiKudeta] @628999000111 terdeteksi mencoba mengeluarkan Budi Owner (Owner)',
    ),
    true,
  );
  assert.deepEqual(sentMessages[0].content.mentions, ['628999000111@s.whatsapp.net']);
  assert.equal(sentMessages[0].content.footer, undefined);
  assert.equal(sentMessages[0].content.text.includes('Proteksi AntiKudeta'), false);
  assert.equal(participantUpdates.length, 1);
  assert.deepEqual(participantUpdates[0].targets, ['6281234567890@s.whatsapp.net']);
  assert.deepEqual(leftGroups, ['120363000000000@g.us']);
});

test('handleKickCommand omits footer when 0 buttons exist and includes footer automatically when interactive buttons exist', async () => {
  const sentMessages: any[] = [];
  const sock = {
    user: { id: '628000000001@s.whatsapp.net' },
    groupMetadata: async () => ({
      subject: 'Grup Belanja',
      participants: [
        { id: '628000000001@s.whatsapp.net', admin: 'admin' },
        { id: '628111111111@s.whatsapp.net', admin: 'admin' },
        { id: '628888888888@s.whatsapp.net', admin: null },
      ],
    }),
    sendMessage: async (jid: string, content: any) => {
      sentMessages.push({ jid, content });
      return { key: { id: `sent-${sentMessages.length}` } };
    },
    groupParticipantsUpdate: async (_jid: string, targets: string[]) => [
      { status: '200', jid: targets[0] },
    ],
    groupLeave: async () => {},
  };

  const { deps } = createMockDeps();
  const triggerMessage = {
    key: {
      remoteJid: '120363000000000@g.us',
      participant: '628111111111@s.whatsapp.net',
    },
    message: {
      extendedTextMessage: {
        text: 'Kick @628888888888',
        contextInfo: {
          mentionedJid: ['628888888888@s.whatsapp.net'],
        },
      },
    },
  };

  await handleKickCommand({
    sock,
    remoteJid: '120363000000000@g.us',
    config: buildConfig({
      kickSuccessText: 'Anggota dikeluarkan',
      kickSuccessFooter: '{storeName} • Moderasi Grup',
      responseExtras: {
        kick_success: { includeMedia: false, selectedPicture: '', buttons: [] },
      },
    }),
    deps,
    message: triggerMessage,
  });

  await handleKickCommand({
    sock,
    remoteJid: '120363000000000@g.us',
    config: buildConfig({
      kickSuccessText: 'Anggota dikeluarkan',
      kickSuccessFooter: '{storeName} • Moderasi Grup',
      responseExtras: {
        kick_success: {
          includeMedia: false,
          selectedPicture: '',
          buttons: [
            { id: 'btn_rules', name: 'Lihat Aturan', type: 'quick_reply', output: '.rules' },
          ],
        },
      },
    }),
    deps,
    message: triggerMessage,
  });

  assert.equal(sentMessages.length, 2);
  assert.equal(sentMessages[0].content.text, 'Anggota dikeluarkan');
  assert.equal(sentMessages[0].content.footer, undefined);
  assert.equal(sentMessages[0].content.nativeFlow, undefined);

  assert.equal(sentMessages[1].content.text, 'Anggota dikeluarkan');
  assert.equal(sentMessages[1].content.footer, 'Wanzt Test Store • Moderasi Grup');
  assert.equal(Array.isArray(sentMessages[1].content.nativeFlow), true);
  assert.equal(sentMessages[1].content.nativeFlow.length, 1);
});


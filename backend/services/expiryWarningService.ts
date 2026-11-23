import { getMasterDb } from '../../admin-backend/database/masterSqlite.ts';
import { getBotManager } from '../botManager.ts';
import { resolvePlaceholders } from '../services/placeholderHelper.ts';
import {
  DEFAULT_EXPIRY_WARNING_OWNER_TEMPLATE,
  DEFAULT_CONFIG,
  loadCommandsConfig,
} from '../config/configManager.ts';
import { evaluateExpiryWarningStage } from './expiryWarningUtils.ts';
import { MasterAdminContactService } from '../../admin-backend/services/masterAdminContactService.ts';
import { TenantStatusService } from '../../admin-backend/services/tenantStatusService.ts';
import { runWithTenant } from '../database/tenantContext.ts';
import {
  getResponseButtons,
  sendConfiguredBotMessage,
} from './responseConfigHelper.ts';
import { CommandsConfig, WhatsAppButton } from '../types/bot.types.ts';

export interface ExpiryCheckResult {
  checkedCount: number;
  sentWarnings: {
    tenantId: string;
    storeName: string;
    ownerPhone: string;
    stage: 'h_3d' | 'h_1d' | 'h_5h' | 'h_1h';
    stageLabel: string;
    sentViaTenant: string;
    success: boolean;
    error?: string;
  }[];
  expiredCount: number;
  timestamp: string;
}

let schedulerInterval: NodeJS.Timeout | null = null;
let realtimeExpiryInterval: NodeJS.Timeout | null = null;
let isChecking = false;

/**
 * Format tanggal dalam format Indonesia WIB (contoh: Senin, 10 November 2026 23:59)
 */
function formatIndonesianDateTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'Asia/Jakarta',
    }).format(d);
  } catch {
    return dateStr;
  }
}

/**
 * Menormalkan nomor telepon ke format JID WhatsApp (@s.whatsapp.net)
 */
function formatWhatsAppJid(phone: string): string {
  let clean = phone.replace(/\D/g, '');
  if (clean.startsWith('0')) {
    clean = '62' + clean.slice(1);
  } else if (clean.startsWith('8')) {
    clean = '62' + clean;
  }
  return clean.includes('@s.whatsapp.net') ? clean : `${clean}@s.whatsapp.net`;
}

/**
 * Mengirim pesan peringatan interaktif Baileys dengan tombol CTA URL / custom ke nomor owner
 */
async function sendExpiryWarningMessage(
  sock: any,
  toJid: string,
  tenant: {
    tenant_id: string;
    store_name: string;
    owner_name: string;
    owner_phone?: string;
  },
  stageLabel: string,
  formattedExpiry: string
): Promise<boolean> {
  const pickedAdmin = MasterAdminContactService.pickRandomMasterAdmin();
  const directWaUrl = `https://wa.me/${pickedAdmin.cleanPhone}?text=${encodeURIComponent(
    `Halo Master Admin (${pickedAdmin.name}), saya owner dari *${tenant.store_name}* (${tenant.tenant_id}) ingin melakukan perpanjangan masa sewa bot WhatsApp toko kami.`
  )}`;

  let tenantConfig: CommandsConfig | null = null;
  try {
    tenantConfig = runWithTenant(tenant.tenant_id, () => loadCommandsConfig());
  } catch {}

  const effectiveConfig: CommandsConfig = {
    ...(tenantConfig || DEFAULT_CONFIG),
    storeInfo: {
      ...(tenantConfig?.storeInfo || DEFAULT_CONFIG.storeInfo),
      storeName: tenantConfig?.storeInfo?.storeName || tenant.store_name,
      ownerName: tenantConfig?.storeInfo?.ownerName || tenant.owner_name,
      ownerNumber: tenantConfig?.storeInfo?.ownerNumber || tenant.owner_phone || '',
    },
  };

  let rawTemplate = effectiveConfig.expiryWarningOwnerText?.trim() || '';
  if (!rawTemplate || rawTemplate === DEFAULT_EXPIRY_WARNING_OWNER_TEMPLATE) {
    try {
      const masterDb = getMasterDb();
      const tplRow = masterDb
        .prepare("SELECT content FROM message_templates WHERE category = 'expiry_warning_owner' AND is_active = 1 LIMIT 1")
        .get() as any;
      if (tplRow && tplRow.content && !effectiveConfig.expiryWarningOwnerText?.trim()) {
        rawTemplate = tplRow.content;
      }
    } catch {}
  }
  if (!rawTemplate) {
    rawTemplate = DEFAULT_EXPIRY_WARNING_OWNER_TEMPLATE;
  }

  const ctx = {
    tenantId: tenant.tenant_id,
    remainingTime: stageLabel,
    expiryDate: formattedExpiry,
    extendUrl: directWaUrl,
  };

  const messageText = resolvePlaceholders(rawTemplate, effectiveConfig, ctx);
  const rawFooter =
    effectiveConfig.expiryWarningOwnerFooter ??
    DEFAULT_CONFIG.expiryWarningOwnerFooter ??
    '{storeName} Official • Notifikasi Otomatis';
  const footerText = resolvePlaceholders(rawFooter, effectiveConfig, ctx);

  const configuredButtons = getResponseButtons(effectiveConfig, 'expiry_warning_owner');
  const effectiveButtons: WhatsAppButton[] =
    configuredButtons.length > 0
      ? configuredButtons
      : [
          {
            id: 'default_expiry_extend',
            type: 'cta_url',
            name: '💳 Perpanjang Masa Sewa',
            output: directWaUrl,
          },
        ];

  try {
    await runWithTenant(tenant.tenant_id, () =>
      sendConfiguredBotMessage({
        sock,
        config: effectiveConfig,
        responseKey: 'expiry_warning_owner',
        targetJid: toJid,
        text: messageText,
        footerText,
        ctx,
        overrideButtons: effectiveButtons,
      })
    );
    return true;
  } catch (err: any) {
    console.warn(`[Expiry Warning] Gagal kirim pesan terkonfigurasi ke ${toJid}, mencoba fallback teks:`, err?.message || err);
    try {
      const fallbackText = [
        messageText,
        ``,
        `👉 *Klik Link untuk Perpanjang Sewa:*`,
        directWaUrl,
        ``,
        footerText ? `_${footerText}_` : ``,
      ]
        .filter(Boolean)
        .join('\n');

      await sock.sendMessage(toJid, { text: fallbackText });
      return true;
    } catch (fallbackErr: any) {
      console.error(`[Expiry Warning] Gagal total mengirim pesan ke ${toJid}:`, fallbackErr?.message || fallbackErr);
      throw fallbackErr;
    }
  }
}

/**
 * Menemukan socket bot yang aktif untuk mengirim pesan notifikasi
 */
function findAvailableBotSocket(preferredTenantId: string): { sock: any; senderTenantId: string } | null {
  // 1. Coba bot milik tenant sendiri
  try {
    const preferredBot = getBotManager(preferredTenantId);
    if (preferredBot && preferredBot.status === 'connected' && preferredBot.sock) {
      return { sock: preferredBot.sock, senderTenantId: preferredTenantId };
    }
  } catch {}

  // 2. Coba bot default 't_wanzt' jika berbeda
  if (preferredTenantId !== 't_wanzt') {
    try {
      const defaultBot = getBotManager('t_wanzt');
      if (defaultBot && defaultBot.status === 'connected' && defaultBot.sock) {
        return { sock: defaultBot.sock, senderTenantId: 't_wanzt' };
      }
    } catch {}
  }

  return null;
}

/**
 * Memeriksa seluruh tenant dan mengirimkan peringatan kedaluwarsa jika memenuhi interval
 */
export async function checkAllTenantsExpiry(manualTrigger: boolean = false): Promise<ExpiryCheckResult> {
  if (isChecking) {
    return {
      checkedCount: 0,
      sentWarnings: [],
      expiredCount: 0,
      timestamp: new Date().toISOString(),
    };
  }

  isChecking = true;
  const result: ExpiryCheckResult = {
    checkedCount: 0,
    sentWarnings: [],
    expiredCount: 0,
    timestamp: new Date().toISOString(),
  };

  try {
    const db = getMasterDb();
    // Ambil tenant yang tidak dalam status suspended
    const tenants = db
      .prepare("SELECT * FROM tenants WHERE status != 'suspended'")
      .all() as any[];

    result.checkedCount = tenants.length;
    const nowMs = Date.now();

    for (const tenant of tenants) {
      if (!tenant.expires_at) continue;

      const expMs = new Date(tenant.expires_at).getTime();
      const diffMs = expMs - nowMs;

      // 1. Jika sudah lewat waktu kedaluwarsa (diffMs <= 0)
      if (diffMs <= 0) {
        if (tenant.status !== 'expired') {
          db.prepare("UPDATE tenants SET status = 'expired' WHERE tenant_id = ?").run(tenant.tenant_id);
          result.expiredCount++;
          console.log(`[Expiry Warning] Tenant ${tenant.tenant_id} (${tenant.store_name}) masa sewa telah habis. Status diubah ke expired.`);
        }
        await TenantStatusService.disconnectBotForStatus(tenant.tenant_id, 'expired');
        continue;
      }

      // Pastikan ada nomor WhatsApp owner
      if (!tenant.owner_phone || !tenant.owner_phone.trim()) {
        continue;
      }

      const formattedExpiry = formatIndonesianDateTime(tenant.expires_at);
      const toJid = formatWhatsAppJid(tenant.owner_phone);

      // Tentukan apakah masuk ke salah satu dari 4 jendela peringatan secara presisi
      const stageMatch = evaluateExpiryWarningStage(diffMs, {
        warned_3d: Number(tenant.warned_3d || 0),
        warned_1d: Number(tenant.warned_1d || 0),
        warned_5h: Number(tenant.warned_5h || 0),
        warned_1h: Number(tenant.warned_1h || 0),
      });

      if (!stageMatch) {
        continue;
      }

      const { stage, stageLabel } = stageMatch;

      // Cari bot socket yang online untuk mengirim pesan
      const botSocketInfo = findAvailableBotSocket(tenant.tenant_id);

      if (!botSocketInfo) {
        console.warn(`[Expiry Warning] Gagal kirim peringatan ${stage} ke ${tenant.tenant_id}: Tidak ada bot yang online.`);
        result.sentWarnings.push({
          tenantId: tenant.tenant_id,
          storeName: tenant.store_name,
          ownerPhone: tenant.owner_phone,
          stage,
          stageLabel,
          sentViaTenant: 'none',
          success: false,
          error: 'Bot WhatsApp offline',
        });
        continue;
      }

      try {
        await sendExpiryWarningMessage(
          botSocketInfo.sock,
          toJid,
          tenant,
          stageLabel,
          formattedExpiry
        );

        // Update flag notifikasi pada database master agar tidak terkirim ganda
        if (stage === 'h_1h') {
          db.prepare('UPDATE tenants SET warned_1h = 1, warned_5h = 1, warned_1d = 1, warned_3d = 1 WHERE tenant_id = ?').run(tenant.tenant_id);
        } else if (stage === 'h_5h') {
          db.prepare('UPDATE tenants SET warned_5h = 1, warned_1d = 1, warned_3d = 1 WHERE tenant_id = ?').run(tenant.tenant_id);
        } else if (stage === 'h_1d') {
          db.prepare('UPDATE tenants SET warned_1d = 1, warned_3d = 1 WHERE tenant_id = ?').run(tenant.tenant_id);
        } else if (stage === 'h_3d') {
          db.prepare('UPDATE tenants SET warned_3d = 1 WHERE tenant_id = ?').run(tenant.tenant_id);
        }

        console.log(`[Expiry Warning] Berhasil mengirim peringatan ${stageLabel} ke owner ${tenant.store_name} (${tenant.owner_phone}) via bot ${botSocketInfo.senderTenantId}`);

        result.sentWarnings.push({
          tenantId: tenant.tenant_id,
          storeName: tenant.store_name,
          ownerPhone: tenant.owner_phone,
          stage,
          stageLabel,
          sentViaTenant: botSocketInfo.senderTenantId,
          success: true,
        });
      } catch (sendErr: any) {
        console.error(`[Expiry Warning] Error saat mengirim notifikasi ke ${tenant.tenant_id}:`, sendErr?.message || sendErr);
        result.sentWarnings.push({
          tenantId: tenant.tenant_id,
          storeName: tenant.store_name,
          ownerPhone: tenant.owner_phone,
          stage,
          stageLabel,
          sentViaTenant: botSocketInfo.senderTenantId,
          success: false,
          error: sendErr?.message || 'Gagal mengirim pesan WhatsApp',
        });
      }
    }
  } catch (error: any) {
    console.error('[Expiry Warning] Terjadi kesalahan dalam pengecekan sewa tenant:', error);
  } finally {
    isChecking = false;
  }

  return result;
}

/**
 * Menjalankan background scheduler peringatan (5 menit) dan pemutusan real-time tenant expired (10 detik)
 */
export function startExpiryWarningScheduler(): void {
  if (!realtimeExpiryInterval) {
    // Cek real-time kedaluwarsa setiap 10 detik (query lokal sangat ringan) agar bot langsung diputus walau dashboard tidak dibuka
    realtimeExpiryInterval = setInterval(() => {
      TenantStatusService.enforceAllExpiredTenants().catch((err) => {
        console.error('[Realtime Expiry] Pengecekan berkala gagal:', err);
      });
    }, 10 * 1000);
  }

  if (schedulerInterval) {
    return;
  }

  console.log('[Expiry Warning] Background cron scheduler aktif (warning: 5 menit, pemutusan expired real-time: 10 detik).');

  // Jalankan pengecekan pertama 20 detik setelah server hidup
  setTimeout(() => {
    checkAllTenantsExpiry().catch((err) => {
      console.error('[Expiry Warning] Pengecekan awal gagal:', err);
    });
  }, 20000);

  // Interval berkala setiap 5 menit (300.000 ms)
  schedulerInterval = setInterval(() => {
    checkAllTenantsExpiry().catch((err) => {
      console.error('[Expiry Warning] Pengecekan berkala gagal:', err);
    });
  }, 5 * 60 * 1000);
}

/**
 * Menghentikan scheduler jika diperlukan
 */
export function stopExpiryWarningScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('[Expiry Warning] Background cron scheduler dihentikan.');
  }
  if (realtimeExpiryInterval) {
    clearInterval(realtimeExpiryInterval);
    realtimeExpiryInterval = null;
  }
}

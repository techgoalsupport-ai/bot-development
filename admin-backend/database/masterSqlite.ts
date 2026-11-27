import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import {
  generateBootstrapSecretPassword,
  hashScryptPassword,
} from '../utils/passwordCrypto.ts';

const masterDbPool = new Map<string, Database.Database>();

export function hashPassword(password: string): string {
  return hashScryptPassword(password);
}

export function getMasterDbPath(): string {
  return path.resolve(process.cwd(), 'database', 'master.db');
}

function applyMasterSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS super_admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL DEFAULT 'Master Admin',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_sessions (
      token TEXT PRIMARY KEY,
      admin_id INTEGER NOT NULL,
      username TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_login_attempts (
      ip TEXT PRIMARY KEY,
      failed_count INTEGER NOT NULL DEFAULT 0,
      locked_until TEXT,
      last_attempt_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_username_login_attempts (
      username TEXT PRIMARY KEY,
      failed_count INTEGER NOT NULL DEFAULT 0,
      locked_until TEXT,
      last_attempt_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tenants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT UNIQUE NOT NULL,
      store_name TEXT NOT NULL DEFAULT '',
      owner_name TEXT NOT NULL DEFAULT '',
      owner_phone TEXT NOT NULL DEFAULT '',
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      package_name TEXT NOT NULL DEFAULT 'Akses Penuh',
      status TEXT NOT NULL DEFAULT 'active',
      max_groups INTEGER NOT NULL DEFAULT 50,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      notes TEXT,
      warned_3d INTEGER NOT NULL DEFAULT 0,
      warned_1d INTEGER NOT NULL DEFAULT 0,
      warned_5h INTEGER NOT NULL DEFAULT 0,
      warned_1h INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS subscription_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL,
      amount INTEGER NOT NULL DEFAULT 0,
      days_added INTEGER NOT NULL DEFAULT 0,
      note TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS message_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      content TEXT NOT NULL,
      footer_text TEXT NOT NULL DEFAULT '',
      buttons_json TEXT NOT NULL DEFAULT '[]',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS extension_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token_code TEXT UNIQUE NOT NULL,
      amount INTEGER NOT NULL,
      unit TEXT NOT NULL,
      duration_label TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'available',
      created_at TEXT NOT NULL,
      used_by_tenant_id TEXT,
      used_at TEXT
    );

    CREATE TABLE IF NOT EXISTS collaborator_api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      api_key_hash TEXT UNIQUE NOT NULL,
      prefix_key TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      last_used_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS collaborator_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      collaborator_id INTEGER NOT NULL,
      collaborator_name TEXT NOT NULL,
      action_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      duration_label TEXT NOT NULL,
      request_ip TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS master_admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      weight INTEGER NOT NULL DEFAULT 100,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS broadcast_campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      channel TEXT NOT NULL DEFAULT 'both',
      schedule_type TEXT NOT NULL DEFAULT 'immediate',
      scheduled_at TEXT,
      recurrence_time TEXT,
      recurrence_day_of_week INTEGER,
      recurrence_day_of_month INTEGER,
      next_run_at TEXT,
      status TEXT NOT NULL DEFAULT 'scheduled',
      total_targets INTEGER NOT NULL DEFAULT 0,
      wa_success INTEGER NOT NULL DEFAULT 0,
      wa_failed INTEGER NOT NULL DEFAULT 0,
      tg_success INTEGER NOT NULL DEFAULT 0,
      tg_failed INTEGER NOT NULL DEFAULT 0,
      run_count INTEGER NOT NULL DEFAULT 0,
      last_run_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS broadcast_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER NOT NULL,
      run_number INTEGER NOT NULL DEFAULT 1,
      tenant_id TEXT NOT NULL,
      store_name TEXT NOT NULL DEFAULT '',
      owner_name TEXT NOT NULL DEFAULT '',
      channel TEXT NOT NULL,
      target TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL,
      error_message TEXT,
      rendered_message TEXT,
      sent_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tenant_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL,
      owner_name TEXT NOT NULL DEFAULT '',
      owner_phone TEXT NOT NULL DEFAULT '',
      store_name TEXT NOT NULL DEFAULT '',
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'terkirim',
      reply_enabled INTEGER NOT NULL DEFAULT 0,
      admin_reply TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tenant_report_media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id INTEGER NOT NULL,
      tenant_id TEXT NOT NULL,
      media_type TEXT NOT NULL,
      original_name TEXT NOT NULL,
      stored_filename TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
}

function seedMasterInitialData(db: Database.Database): void {
  const now = new Date();
  const nowIso = now.toISOString();

  // 1. Bootstrap Super Admin jika tabel super_admins masih kosong
  const adminCountRow = db.prepare('SELECT COUNT(*) as count FROM super_admins').get() as {
    count: number;
  };
  if (adminCountRow.count === 0) {
    const adminUser = (process.env.ADMIN_BOOTSTRAP_USERNAME || 'main_admin774').trim();
    const envAdminPass = process.env.ADMIN_BOOTSTRAP_PASSWORD?.trim();
    const adminPass = envAdminPass || generateBootstrapSecretPassword(12);
    const adminHash = hashScryptPassword(adminPass);

    db.prepare(`
      INSERT INTO super_admins (username, password_hash, name, created_at)
      VALUES (?, ?, 'Master Admin', ?)
    `).run(adminUser, adminHash, nowIso);

    if (envAdminPass) {
      console.log(
        `[Master DB] Akun super admin "${adminUser}" diinisialisasi dari ADMIN_BOOTSTRAP_PASSWORD.`
      );
    } else {
      console.log(
        `[Master DB] Akun super admin "${adminUser}" diinisialisasi dengan password acak: ${adminPass}`
      );
    }
  }

  // 2. Bootstrap tenant default 't_wanzt' jika tabel tenants masih kosong
  const tenantCountRow = db.prepare('SELECT COUNT(*) as count FROM tenants').get() as {
    count: number;
  };
  if (tenantCountRow.count === 0) {
    const tenantUser = (process.env.TENANT_BOOTSTRAP_USERNAME || 'admin').trim();
    const envTenantPass = process.env.TENANT_BOOTSTRAP_PASSWORD?.trim();
    const tenantPass = envTenantPass || generateBootstrapSecretPassword(12);
    const tenantHash = hashScryptPassword(tenantPass);
    const expDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

    db.prepare(`
      INSERT INTO tenants (
        tenant_id, store_name, owner_name, owner_phone, username, password_hash,
        package_name, status, max_groups, created_at, expires_at, notes
      ) VALUES (?, ?, ?, ?, ?, ?, 'Akses Penuh', 'active', 50, ?, ?, ?)
    `).run(
      't_wanzt',
      'Wanzt Store',
      'Owner Wanzt',
      '',
      tenantUser,
      tenantHash,
      nowIso,
      expDate.toISOString(),
      'Unit bot default sistem'
    );

    if (envTenantPass) {
      console.log(
        `[Master DB] Tenant default "t_wanzt" (${tenantUser}) diinisialisasi dari TENANT_BOOTSTRAP_PASSWORD.`
      );
    } else {
      console.log(
        `[Master DB] Tenant default "t_wanzt" (${tenantUser}) diinisialisasi dengan password acak: ${tenantPass}`
      );
    }
  }

  // 3. Seed 8 template pesan default jika message_templates masih kosong
  const tplCountRow = db.prepare('SELECT COUNT(*) as count FROM message_templates').get() as {
    count: number;
  };
  if (tplCountRow.count === 0) {
    const defaultTemplates: Array<{
      name: string;
      category: string;
      content: string;
      footer_text: string;
      buttons_json: string;
    }> = [
      {
        name: 'Menu Utama Standar',
        category: 'menu',
        content:
          'Halo kak! Selamat datang di {storeName} ✨\n\nSilakan pilih layanan yang ingin Anda pesan melalui tombol interaktif di bawah ini:',
        footer_text: '{webLink} • Otomatis',
        buttons_json: '[]',
      },
      {
        name: 'Daftar Produk Standar',
        category: 'list',
        content: '📋 *DAFTAR LAYANAN & HARGA {storeName}*\n\nSilakan pilih produk yang tersedia:',
        footer_text: '{webLink} • Katalog Resmi',
        buttons_json: '[]',
      },
      {
        name: 'Carousel Produk Standar',
        category: 'carousel',
        content:
          '*{storeName}*\n\n*{produkName} | {category}*\n\n• Varian: {varian}\n• Harga: Rp {price}\n• Stok: {stock} tersedia',
        footer_text: '{webLink} • Geser Kartu',
        buttons_json: '[]',
      },
      {
        name: 'Invoice Pembayaran QRIS',
        category: 'invoice',
        content:
          '🧾 *INVOICE PEMBAYARAN QRIS*\nHalo kak, pesanan *{produkName} ({varian})* telah diterbitkan!\n\n• *ID Order:* `{orderId}`\n• *Harga:* Rp {price}\n• *Kode Unik:* Rp {unikCode}\n• *TOTAL BAYAR:* *Rp {total}*\n\nSilakan scan QRIS dengan nominal persis.',
        footer_text: '{webLink} • Verifikasi Otomatis',
        buttons_json: '[]',
      },
      {
        name: 'Konfirmasi Rincian Pesanan',
        category: 'confirm_summary',
        content:
          '🛒 *RINCIAN PESANAN*\n• *Produk:* {produkName}\n• *Varian:* {varian}\n• *Harga Normal:* Rp {price}\n\nPunya kode promo? Silakan pilih tombol di bawah.',
        footer_text: '{storeName} • Konfirmasi Pesanan',
        buttons_json: '[]',
      },
      {
        name: 'Prompt Input Kode Promo',
        category: 'confirm_promo_input',
        content:
          '🎟️ *MASUKKAN KODE PROMO*\nSilakan ketik kode promo Anda atau ketik *BATAL* untuk melanjutkan dengan harga normal.\n\n⏱️ _Batas waktu: 3 menit._',
        footer_text: '{storeName} • Konfirmasi Pesanan',
        buttons_json: '[]',
      },
      {
        name: 'Promo Berhasil Diterapkan',
        category: 'confirm_promo_valid',
        content:
          '🎉 *KODE PROMO BERHASIL DIGUNAKAN!*\n• *Kode Promo:* {promoCode}\n• *Harga Awal:* Rp {price}\n• *Diskon:* -Rp {discount}\n• *Total Bayar:* Rp {finalPrice}',
        footer_text: '{storeName} • Promo Berhasil',
        buttons_json: '[]',
      },
      {
        name: 'Kode Promo Tidak Valid',
        category: 'confirm_promo_invalid',
        content:
          '⚠️ *KODE PROMO TIDAK DAPAT DIGUNAKAN*\nKode promo *{promoCode}* gagal diterapkan.\nPenyebab: *{reason}*\n\nSilakan ketik kode lain atau ketik *BATAL*.',
        footer_text: '{storeName} • Cek Kode Promo',
        buttons_json: '[]',
      },
    ];

    const insertTpl = db.prepare(`
      INSERT INTO message_templates (name, category, content, footer_text, buttons_json, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 1, ?, ?)
    `);
    const tx = db.transaction(() => {
      for (const tpl of defaultTemplates) {
        insertTpl.run(tpl.name, tpl.category, tpl.content, tpl.footer_text, tpl.buttons_json, nowIso, nowIso);
      }
    });
    tx();
    console.log(`[Master DB] ${defaultTemplates.length} template pesan default berhasil diinisialisasi.`);
  }
}

export function initMasterDatabase(): Database.Database {
  const dbPath = getMasterDbPath();
  const existing = masterDbPool.get(dbPath);
  if (existing && existing.open) {
    return existing;
  }

  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const conn = new Database(dbPath);
  conn.pragma('journal_mode = WAL');
  conn.pragma('busy_timeout = 5000');
  conn.pragma('foreign_keys = ON');
  applyMasterSchema(conn);
  seedMasterInitialData(conn);

  masterDbPool.set(dbPath, conn);
  return conn;
}

export function getMasterDb(): Database.Database {
  return initMasterDatabase();
}

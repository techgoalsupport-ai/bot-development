import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { DEFAULT_TENANT_ID, getActiveTenantId } from './tenantContext.ts';
import { getMasterDb, getMasterDbPath } from '../../admin-backend/database/masterSqlite.ts';

const tenantDbPool = new Map<string, Database.Database>();

export function sanitizeTenantIdSegment(tenantId: string): string {
  const clean = String(tenantId || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '');
  return clean || DEFAULT_TENANT_ID;
}

export function getTenantDbDir(): string {
  return path.resolve(process.cwd(), 'database', 'tenants');
}

export function getTenantDbPath(tenantId: string): string {
  const safeId = sanitizeTenantIdSegment(tenantId);
  return path.join(getTenantDbDir(), `${safeId}.db`);
}

function applyTenantSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS store_info (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      store_name TEXT NOT NULL DEFAULT '',
      owner_name TEXT NOT NULL DEFAULT '',
      owner_number TEXT NOT NULL DEFAULT '',
      admin_name TEXT NOT NULL DEFAULT '',
      admin_number TEXT NOT NULL DEFAULT '',
      web_link TEXT NOT NULL DEFAULT '',
      telegram_bot TEXT NOT NULL DEFAULT '',
      wa_link TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS commands_config (
      command_type TEXT PRIMARY KEY,
      config_data TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS api_config (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      lunas_api_key TEXT DEFAULT '',
      lunas_secret_key TEXT DEFAULT '',
      lunas_base_url TEXT DEFAULT '',
      lunas_default_fee INTEGER DEFAULT 0,
      xaviera_api_key TEXT DEFAULT '',
      xaviera_secret_key TEXT DEFAULT '',
      xaviera_base_url TEXT DEFAULT '',
      xaviera_markup_percent REAL DEFAULT 10,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pricing_config (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      pricing_mode TEXT NOT NULL DEFAULT 'rp',
      pricing_value REAL NOT NULL DEFAULT 100,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS variant_pricing (
      variant_id TEXT PRIMARY KEY,
      product_name TEXT DEFAULT '',
      variant_name TEXT DEFAULT '',
      pricing_type TEXT NOT NULL DEFAULT 'general',
      pricing_mode TEXT NOT NULL DEFAULT 'rp',
      pricing_value REAL NOT NULL DEFAULT 100,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS category_pricing (
      category TEXT PRIMARY KEY,
      pricing_mode TEXT NOT NULL DEFAULT 'rp',
      pricing_value REAL NOT NULL DEFAULT 100,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS promo_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL COLLATE NOCASE,
      discount_mode TEXT NOT NULL DEFAULT 'rp',
      discount_value REAL NOT NULL DEFAULT 0,
      min_spend INTEGER DEFAULT 0,
      quota INTEGER DEFAULT NULL,
      used_count INTEGER NOT NULL DEFAULT 0,
      valid_until TEXT DEFAULT NULL,
      is_forever INTEGER NOT NULL DEFAULT 0,
      scope_type TEXT NOT NULL DEFAULT 'all',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS promo_code_variants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      promo_id INTEGER NOT NULL,
      variant_id TEXT NOT NULL,
      product_name TEXT DEFAULT '',
      variant_name TEXT DEFAULT '',
      FOREIGN KEY (promo_id) REFERENCES promo_codes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      order_id TEXT UNIQUE NOT NULL,
      trx_id TEXT NOT NULL DEFAULT '',
      customer_number TEXT NOT NULL,
      customer_name TEXT NOT NULL DEFAULT '',
      product_name TEXT NOT NULL,
      variant_name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT '',
      nominal INTEGER NOT NULL DEFAULT 0,
      unique_code INTEGER NOT NULL DEFAULT 0,
      total INTEGER NOT NULL DEFAULT 0,
      selling_price INTEGER NOT NULL DEFAULT 0,
      cost_price INTEGER NOT NULL DEFAULT 0,
      discount_amount INTEGER NOT NULL DEFAULT 0,
      profit INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      payment_url TEXT NOT NULL DEFAULT '',
      promo_id INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_order_id ON transactions(order_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_trx_id ON transactions(trx_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
    CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

    CREATE TABLE IF NOT EXISTS group_whitelist (
      group_id TEXT PRIMARY KEY,
      enabled INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bot_settings (
      setting_key TEXT PRIMARY KEY,
      setting_value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS auth (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      username TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL DEFAULT '',
      iterations INTEGER NOT NULL DEFAULT 16384,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tenants (
      id TEXT PRIMARY KEY,
      unit_number TEXT NOT NULL DEFAULT '',
      name TEXT NOT NULL DEFAULT '',
      username TEXT NOT NULL DEFAULT '',
      password_hash TEXT NOT NULL DEFAULT '',
      salt TEXT NOT NULL DEFAULT '',
      phone_number TEXT NOT NULL DEFAULT '',
      plan_name TEXT NOT NULL DEFAULT 'Standard',
      status TEXT NOT NULL DEFAULT 'active',
      start_date TEXT NOT NULL DEFAULT '',
      expired_date TEXT NOT NULL DEFAULT '',
      max_groups INTEGER NOT NULL DEFAULT 15,
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS master_admin (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      username TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL DEFAULT '',
      iterations INTEGER NOT NULL DEFAULT 16384,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS telegram_config (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      bot_token TEXT NOT NULL DEFAULT '',
      chat_id TEXT NOT NULL DEFAULT '',
      notif_enabled INTEGER NOT NULL DEFAULT 0,
      admin_disabled INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS message_stats (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      whatsapp_messages INTEGER NOT NULL DEFAULT 0,
      telegram_messages INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT ''
    );
  `);

  const now = new Date().toISOString();

  // Migrasi kolom aman untuk DB tenant lama yang sudah memiliki tabel transactions
  try {
    const existingCols = new Set(
      (db.prepare('PRAGMA table_info(transactions)').all() as Array<{ name: string }>).map(
        (c) => c.name
      )
    );
    const missingColumns: Array<[string, string]> = [
      ['category', "TEXT NOT NULL DEFAULT ''"],
      ['selling_price', 'INTEGER NOT NULL DEFAULT 0'],
      ['cost_price', 'INTEGER NOT NULL DEFAULT 0'],
      ['discount_amount', 'INTEGER NOT NULL DEFAULT 0'],
      ['profit', 'INTEGER NOT NULL DEFAULT 0'],
    ];
    for (const [colName, colDef] of missingColumns) {
      if (!existingCols.has(colName)) {
        db.exec(`ALTER TABLE transactions ADD COLUMN ${colName} ${colDef}`);
      }
    }
  } catch (migrationErr) {
    console.error('[TenantDB] Migrasi kolom transactions gagal:', migrationErr);
  }

  db.prepare(`
    INSERT OR IGNORE INTO pricing_config (id, pricing_mode, pricing_value, updated_at)
    VALUES (1, 'rp', 100, ?)
  `).run(now);

  db.prepare(`
    INSERT OR IGNORE INTO message_stats (id, whatsapp_messages, telegram_messages, updated_at)
    VALUES (1, 0, 0, ?)
  `).run(now);
}

export function initTenantDb(tenantId: string = DEFAULT_TENANT_ID): Database.Database {
  const dbPath = getTenantDbPath(tenantId);
  const existing = tenantDbPool.get(dbPath);
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
  applyTenantSchema(conn);

  // Sinkronkan store_info awal dari master.db jika belum ada di tenant DB
  try {
    const existingStore = conn.prepare('SELECT id FROM store_info WHERE id = 1').get();
    if (!existingStore && fs.existsSync(getMasterDbPath())) {
      const safeId = sanitizeTenantIdSegment(tenantId);
      const masterRow = getMasterDb()
        .prepare('SELECT store_name, owner_name, owner_phone FROM tenants WHERE tenant_id = ?')
        .get(safeId) as { store_name?: string; owner_name?: string; owner_phone?: string } | undefined;
      if (masterRow && (masterRow.store_name || masterRow.owner_name || masterRow.owner_phone)) {
        conn.prepare(`
          INSERT OR IGNORE INTO store_info (id, store_name, owner_name, owner_number, updated_at)
          VALUES (1, ?, ?, ?, ?)
        `).run(
          masterRow.store_name || '',
          masterRow.owner_name || '',
          masterRow.owner_phone || '',
          new Date().toISOString()
        );
      }
    }
  } catch {}

  tenantDbPool.set(dbPath, conn);
  return conn;
}

export function getTenantDb(tenantId?: string): Database.Database {
  const targetId = (tenantId || '').trim() || getActiveTenantId();
  return initTenantDb(targetId);
}

export function deleteTenantDb(tenantId: string): boolean {
  const dbPath = getTenantDbPath(tenantId);
  const existing = tenantDbPool.get(dbPath);
  if (existing) {
    try {
      if (existing.open) {
        existing.close();
      }
    } catch {}
    tenantDbPool.delete(dbPath);
  }

  let deleted = false;
  for (const suffix of ['', '-wal', '-shm']) {
    const filePath = `${dbPath}${suffix}`;
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        if (suffix === '') deleted = true;
      } catch {}
    }
  }
  return deleted;
}

export function incrementMessageStat(
  tenantId: string,
  channel: 'whatsapp' | 'telegram',
  delta: number = 1
): void {
  try {
    const db = getTenantDb(tenantId);
    const now = new Date().toISOString();
    const safeDelta = Math.max(1, Math.round(delta));
    if (channel === 'whatsapp') {
      db.prepare(`
        INSERT INTO message_stats (id, whatsapp_messages, telegram_messages, updated_at)
        VALUES (1, ?, 0, ?)
        ON CONFLICT(id) DO UPDATE SET
          whatsapp_messages = whatsapp_messages + excluded.whatsapp_messages,
          updated_at = excluded.updated_at
      `).run(safeDelta, now);
    } else {
      db.prepare(`
        INSERT INTO message_stats (id, whatsapp_messages, telegram_messages, updated_at)
        VALUES (1, 0, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          telegram_messages = telegram_messages + excluded.telegram_messages,
          updated_at = excluded.updated_at
      `).run(safeDelta, now);
    }
  } catch (err) {
    console.error(`[TenantDB] Gagal memperbarui statistik pesan (${tenantId}/${channel}):`, err);
  }
}

export function getBotSetting(tenantId: string, key: string): string | null {
  try {
    const db = getTenantDb(tenantId);
    const row = db
      .prepare('SELECT setting_value FROM bot_settings WHERE setting_key = ?')
      .get(key) as { setting_value: string } | undefined;
    return row ? row.setting_value : null;
  } catch {
    return null;
  }
}

export function setBotSetting(tenantId: string, key: string, value: string): void {
  try {
    const db = getTenantDb(tenantId);
    const now = new Date().toISOString();
    db.prepare(`
      INSERT OR REPLACE INTO bot_settings (setting_key, setting_value, updated_at)
      VALUES (?, ?, ?)
    `).run(key, String(value), now);
  } catch (err) {
    console.error(`[TenantDB] Gagal menyimpan bot_settings (${tenantId}/${key}):`, err);
  }
}

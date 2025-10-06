// backend/db.js
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dbPath = path.resolve('./data.db');
if (!fs.existsSync(dbPath)) {
  console.log('Создаю новую SQLite базу:', dbPath);
}
export const db = new Database(dbPath);

// === USERS ===
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    username TEXT,
    role TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// === ORDERS ===
db.prepare(`
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    user_id INTEGER,
    asset TEXT,
    amount REAL,
    rub_amount REAL,
    rate REAL,
    status TEXT,
    address TEXT,
    txid TEXT,
    comment TEXT,
    receive_method TEXT,             -- поле для способа получения RUB
    created_at TEXT,
    updated_at TEXT
  )
`).run();

// === MIGRATIONS ===
export function ensureMigrations() {
  const info = db.prepare('PRAGMA table_info(orders)').all();
  const cols = info.map(c => c.name);
  if (!cols.includes('receive_method')) {
    console.log('Миграция: добавляю колонку receive_method в orders');
    db.prepare('ALTER TABLE orders ADD COLUMN receive_method TEXT').run();
  }
}

// === USERS ===
export function upsertUser(u) {
  const now = new Date().toISOString();
  const ex = db.prepare('SELECT id FROM users WHERE id = ?').get(u.id);
  if (ex) {
    db.prepare(`
      UPDATE users SET
        first_name = @first_name,
        last_name = @last_name,
        username = @username,
        role = @role,
        updated_at = @updated_at
      WHERE id = @id
    `).run({ ...u, updated_at: now });
  } else {
    db.prepare(`
      INSERT INTO users (id, first_name, last_name, username, role, created_at, updated_at)
      VALUES (@id, @first_name, @last_name, @username, @role, @created_at, @updated_at)
    `).run({ ...u, created_at: now, updated_at: now });
  }
}

// === ORDERS CRUD ===
export function createOrder(o) {
  db.prepare(`
    INSERT INTO orders (
      id, user_id, asset, amount, rub_amount, rate, status,
      address, txid, comment, receive_method, created_at, updated_at
    ) VALUES (
      @id, @user_id, @asset, @amount, @rub_amount, @rate, @status,
      @address, @txid, @comment, @receive_method, @created_at, @updated_at
    )
  `).run(o);
}

export function updateOrder(id, patch) {
  const fields = [];
  const params = { id };
  for (const [k, v] of Object.entries(patch)) {
    fields.push(`${k} = @${k}`);
    params[k] = v;
  }
  fields.push(`updated_at = @updated_at`);
  params.updated_at = new Date().toISOString();
  const sql = `UPDATE orders SET ${fields.join(', ')} WHERE id = @id`;
  db.prepare(sql).run(params);
}

export function listOrders({ user_id, status, limit = 100 } = {}) {
  let sql = `SELECT * FROM orders WHERE 1=1`;
  const params = {};
  if (user_id) { sql += ` AND user_id = @user_id`; params.user_id = user_id; }
  if (status) { sql += ` AND status = @status`; params.status = status; }
  sql += ` ORDER BY created_at DESC LIMIT @limit`;
  params.limit = limit;
  return db.prepare(sql).all(params);
}

export function getOrder(id) {
  return db.prepare(`SELECT * FROM orders WHERE id = ?`).get(id);
}

export default db;

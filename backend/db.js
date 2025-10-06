import Database from 'better-sqlite3';
import fs from 'fs';


const db = new Database('data.sqlite');


const schema = fs.readFileSync(new URL('./schema.sql', import.meta.url)).toString();
db.exec(schema);


export function upsertUser({ id, role, first_name, last_name, username }) {
db.prepare(`INSERT INTO users(id, role, first_name, last_name, username)
VALUES(@id, @role, @first_name, @last_name, @username)
ON CONFLICT(id) DO UPDATE SET role=excluded.role, first_name=excluded.first_name, last_name=excluded.last_name, username=excluded.username`).run({ id, role, first_name, last_name, username });
}


export function getUser(id) {
return db.prepare('SELECT * FROM users WHERE id=?').get(id);
}


export function createOrder(o) {
db.prepare(`INSERT INTO orders(id,user_id,asset,amount,rub_amount,rate,status,address,txid,comment,created_at,updated_at)
VALUES(@id,@user_id,@asset,@amount,@rub_amount,@rate,@status,@address,@txid,@comment,@created_at,@updated_at)`).run(o);
}


export function listOrders({ status, user_id, limit=100 }) {
if (user_id) return db.prepare('SELECT * FROM orders WHERE user_id=? ORDER BY created_at DESC LIMIT ?').all(user_id, limit);
if (status) return db.prepare('SELECT * FROM orders WHERE status=? ORDER BY created_at DESC LIMIT ?').all(status, limit);
return db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT ?').all(limit);
}


export function getOrder(id) {
return db.prepare('SELECT * FROM orders WHERE id=?').get(id);
}


export function updateOrder(id, fields) {
const keys = Object.keys(fields);
if (!keys.length) return;
const sets = keys.map(k => `${k}=@${k}`).join(',');
db.prepare(`UPDATE orders SET ${sets}, updated_at=@updated_at WHERE id=@id`).run({ ...fields, id, updated_at: new Date().toISOString() });
}


export default db;
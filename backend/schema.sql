CREATE TABLE IF NOT EXISTS users (
id INTEGER PRIMARY KEY, -- telegram user id
role TEXT NOT NULL DEFAULT 'client',
first_name TEXT, last_name TEXT, username TEXT
);


CREATE TABLE IF NOT EXISTS orders (
id TEXT PRIMARY KEY,
user_id INTEGER NOT NULL,
asset TEXT NOT NULL, -- USDT_BEP20 | USDT_TRC20 | BTC | ETH
amount NUMERIC NOT NULL, -- сумма в крипто
rub_amount NUMERIC NOT NULL, -- рассчитанное к выдаче RUB
rate NUMERIC NOT NULL, -- применённый курс (RUB за 1 unit crypto_equiv)
status TEXT NOT NULL, -- pending | paid | released | cancelled
address TEXT NOT NULL, -- адрес для перевода
txid TEXT, -- опционально, от клиента
comment TEXT, -- опционально, от оператора
created_at TEXT NOT NULL,
updated_at TEXT NOT NULL
);


CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
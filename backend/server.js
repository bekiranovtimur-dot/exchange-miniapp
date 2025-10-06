// backend/server.js
import express from 'express';
import dotenv from 'dotenv';
import { checkTelegramAuth } from './verifyInitData.js';
import {
  upsertUser,
  getUser,
  createOrder,
  listOrders,
  getOrder,
  updateOrder,
} from './db.js';

dotenv.config();

const app = express();
app.use(express.json());

// лог всех запросов
app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});

// === Env & config ===
const {
  BOT_TOKEN,
  OPERATORS,
  WALLET_USDT_BEP20,
  WALLET_USDT_TRC20,
  WALLET_BTC,
  WALLET_ETH,
  BASE_RUB_PER_USD,
  SPREAD_PCT,
  FEE_FIXED_RUB,
  PORT,
} = process.env;

const operatorIds = new Set(
  String(OPERATORS || '')
    .split(',')
    .filter(Boolean)
    .map((s) => Number(s.trim()))
);

// === CORS (на проде лучше ограничить доменом фронтенда) ===
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // TODO: заменить на ваш домен фронтенда
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, x-init-data'
  );
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, OPTIONS'
  );
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// === Auth middleware: проверяем initData и назначаем роль ===
function requireAuth(req, res, next) {
  const initData = req.header('x-init-data') || req.body?.initData;
  if (!initData) return res.status(401).json({ error: 'initData missing' });

  const ok = checkTelegramAuth(initData, BOT_TOKEN);
  if (!ok) return res.status(401).json({ error: 'initData invalid' });

  // Разбираем initData, достаем user
  const unsafe = Object.fromEntries(new URLSearchParams(initData));
  const user = unsafe.user ? JSON.parse(unsafe.user) : null;
  if (!user?.id) return res.status(401).json({ error: 'no user' });

  const role = operatorIds.has(Number(user.id)) ? 'operator' : 'client';
  upsertUser({
    id: user.id,
    role,
    first_name: user.first_name,
    last_name: user.last_name,
    username: user.username,
  });

  req.user = { id: user.id, role };
  next();
}

app.use(requireAuth);

// === Кошельки для приёма платежей ===
const ADDRESSES = {
  USDT_BEP20: WALLET_USDT_BEP20,
  USDT_TRC20: WALLET_USDT_TRC20,
  BTC: WALLET_BTC,
  ETH: WALLET_ETH,
};

// === Котировка (заглушка) ===
// На проде подтягивайте курсы из биржи/провайдера и учитывайте комиссии сети
function quote(asset, amount) {
  const base = Number(BASE_RUB_PER_USD || 95); // базовый RUB/USD
  const spread = Number(SPREAD_PCT || 1) / 100;
  const fee = Number(FEE_FIXED_RUB || 0);

  // упрощённый эквивалент в USD
  const USD_PRICE = { USDT_BEP20: 1, USDT_TRC20: 1, BTC: 65000, ETH: 3000 };
  const usd = (USD_PRICE[asset] || 1) * amount;

  const rubRate = base * (1 + spread);
  const rubAmount = Math.max(0, usd * rubRate - fee);

  return { rubAmount, rate: rubRate };
}

// === Техническое: healthcheck ===
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// === Текущий пользователь / роль / кошельки ===
app.get('/api/me', (req, res) => {
  res.json({ id: req.user.id, role: req.user.role, addresses: ADDRESSES });
});

// === Создание заявки (client) ===
app.post('/api/orders', (req, res) => {
  const { asset, amount, txid } = req.body || {};

  if (!['USDT_BEP20', 'USDT_TRC20', 'BTC', 'ETH'].includes(asset)) {
    return res.status(400).json({ error: 'invalid asset' });
  }

  const amt = Number(amount);
  if (!amt || amt <= 0) {
    return res.status(400).json({ error: 'invalid amount' });
  }

  const address = ADDRESSES[asset];
  if (!address) {
    return res.status(400).json({ error: 'no address for asset' });
  }

  const { rubAmount, rate } = quote(asset, amt);
  const id = 'ord_' + Math.random().toString(36).slice(2, 10);
  const now = new Date().toISOString();

  createOrder({
    id,
    user_id: req.user.id,
    asset,
    amount: amt,
    rub_amount: Math.round(rubAmount * 100) / 100,
    rate,
    status: 'pending',
    address,
    txid: txid || null,
    comment: null,
    created_at: now,
    updated_at: now,
  });

  res.json({
    orderId: id,
    status: 'pending',
    address,
    rub_amount: Math.round(rubAmount * 100) / 100,
    rate,
  });
});

// === Мои заявки (client) ===
app.get('/api/my-orders', (req, res) => {
  res.json(listOrders({ user_id: req.user.id, limit: 100 }));
});

// === Все заявки (operator) ===
app.get('/api/orders', (req, res) => {
  if (req.user.role !== 'operator') {
    return res.status(403).json({ error: 'forbidden' });
  }
  const { status } = req.query;
  res.json(listOrders({ status, limit: 200 }));
});

// === Изменение статуса заявки (operator) ===
app.post('/api/orders/:id/status', (req, res) => {
  if (req.user.role !== 'operator') {
    return res.status(403).json({ error: 'forbidden' });
  }
  const { id } = req.params;
  const { status, comment } = req.body || {};

  if (!['paid', 'released', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'bad status' });
  }

  const o = getOrder(id);
  if (!o) return res.status(404).json({ error: 'not found' });

  updateOrder(id, { status, comment: comment || null });
  res.json({ ok: true });
});

// === Клиент обновляет TXID ===
app.post('/api/orders/:id/txid', (req, res) => {
  const { id } = req.params;
  const { txid } = req.body || {};

  const o = getOrder(id);
  if (!o || o.user_id !== req.user.id) {
    return res.status(404).json({ error: 'not found' });
  }

  updateOrder(id, { txid: txid || null });
  res.json({ ok: true });
});

// === Запуск сервера ===
const listenPort = Number(PORT || 8080);
app.listen(listenPort, () => {
  console.log('Backend on', listenPort);
});

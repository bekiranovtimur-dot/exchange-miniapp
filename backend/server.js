// backend/server.js
import express from 'express';
import dotenv from 'dotenv';
import { checkTelegramAuth } from './verifyInitData.js';
import {
  upsertUser,
  createOrder,
  listOrders,
  getOrder,
  updateOrder,
} from './db.js';

dotenv.config();

const app = express();
app.use(express.json());

// Лог всех запросов (полезно для дебага на Render)
app.use((req, _res, next) => {
  console.log(req.method, req.url);
  next();
});

// === ENV ===
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
  ADMIN_CHAT_ID,
  BACKEND_PUBLIC_NAME,
} = process.env;

// Утилиты
const operatorIds = new Set(
  String(OPERATORS || '')
    .split(',')
    .filter(Boolean)
    .map((s) => Number(s.trim()))
);
const BOT_API = (token, method) =>
  `https://api.telegram.org/bot${token}/${method}`;

function safe(val) {
  return (val ?? '').toString().replaceAll('\n', ' ').replaceAll('\\"', '"');
}
function toCSV(rows) {
  if (!rows?.length) return '';
  const keys = Object.keys(rows[0]);
  const head = keys.join(',');
  const body = rows
    .map((r) => keys.map((k) => `"${safe(r[k])}"`).join(','))
    .join('\n');
  return head + '\n' + body;
}

// === CORS (на проде рекомендуется ограничить доменом фронтенда) ===
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // TODO: заменить на домен Vercel
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-init-data');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// === Auth middleware: проверяем initData и назначаем роль ===
function requireAuth(req, res, next) {
  const initData = req.header('x-init-data') || req.body?.initData;
  if (!initData) {
    console.log('AUTH ERR: initData missing');
    return res.status(401).json({ error: 'initData missing' });
  }
  const ok = checkTelegramAuth(initData, BOT_TOKEN);
  if (!ok) {
    console.log('AUTH ERR: initData invalid (token mismatch?)');
    return res.status(401).json({ error: 'initData invalid' });
  }
  const unsafe = Object.fromEntries(new URLSearchParams(initData));
  const user = unsafe.user ? JSON.parse(unsafe.user) : null;
  if (!user?.id) {
    console.log('AUTH ERR: no user');
    return res.status(401).json({ error: 'no user' });
  }
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

// Healthcheck (без авторизации)
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// Далее все защищённые маршруты
app.use(requireAuth);

// Кошельки для приёма
const ADDRESSES = {
  USDT_BEP20: WALLET_USDT_BEP20,
  USDT_TRC20: WALLET_USDT_TRC20,
  BTC: WALLET_BTC,
  ETH: WALLET_ETH,
};

// Котировка (заглушка). На проде подтягивайте реальные курсы.
function quote(asset, amount) {
  const base = Number(BASE_RUB_PER_USD || 95); // RUB/USD
  const spread = Number(SPREAD_PCT || 1) / 100;
  const fee = Number(FEE_FIXED_RUB || 0);
  const USD_PRICE = { USDT_BEP20: 1, USDT_TRC20: 1, BTC: 65000, ETH: 3000 };
  const usd = (USD_PRICE[asset] || 1) * amount;
  const rubRate = base * (1 + spread);
  const rubAmount = Math.max(0, usd * rubRate - fee);
  return { rubAmount, rate: rubRate };
}

// Текущий пользователь / роль / кошельки
app.get('/api/me', (req, res) => {
  res.json({ id: req.user.id, role: req.user.role, addresses: ADDRESSES });
});

// Создание заявки
app.post('/api/orders', async (req, res) => {
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

  // Отправляем клиенту ответ
  res.json({
    orderId: id,
    status: 'pending',
    address,
    rub_amount: Math.round(rubAmount * 100) / 100,
    rate,
  });

  // Уведомление в Telegram-чат/канал (если настроено)
  try {
    if (ADMIN_CHAT_ID && BOT_TOKEN) {
      const title = BACKEND_PUBLIC_NAME ? `<b>${safe(BACKEND_PUBLIC_NAME)}</b>\n` : '';
      const text =
        `${title}🆕 <b>Новая заявка</b>\n` +
        `<b>ID:</b> ${id}\n` +
        `<b>Пользователь:</b> <code>${req.user.id}</code>\n` +
        `<b>Актив:</b> ${asset}\n` +
        `<b>Сумма:</b> ${amt}\n` +
        `<b>RUB к выдаче:</b> ${Math.round(rubAmount * 100) / 100}\n` +
        `<b>Адрес:</b> <code>${address}</code>`;

      await fetch(BOT_API(BOT_TOKEN, 'sendMessage'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: ADMIN_CHAT_ID,
          text,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }),
      });
    }
  } catch (e) {
    console.error('notify error', e?.message);
  }
});

// Мои заявки (клиент)
app.get('/api/my-orders', (req, res) => {
  res.json(listOrders({ user_id: req.user.id, limit: 100 }));
});

// Все заявки (оператор)
app.get('/api/orders', (req, res) => {
  if (req.user.role !== 'operator') return res.status(403).json({ error: 'forbidden' });
  const { status } = req.query;
  res.json(listOrders({ status, limit: 200 }));
});

// Изменение статуса (оператор)
app.post('/api/orders/:id/status', (req, res) => {
  if (req.user.role !== 'operator') return res.status(403).json({ error: 'forbidden' });
  const { id } = req.params;
  const { status, comment } = req.body || {};
  if (!['paid', 'released', 'cancelled'].includes(status))
    return res.status(400).json({ error: 'bad status' });
  const o = getOrder(id);
  if (!o) return res.status(404).json({ error: 'not found' });
  updateOrder(id, { status, comment: comment || null });
  res.json({ ok: true });
});

// Клиент добавляет/меняет TXID
app.post('/api/orders/:id/txid', (req, res) => {
  const { id } = req.params;
  const { txid } = req.body || {};
  const o = getOrder(id);
  if (!o || o.user_id !== req.user.id) return res.status(404).json({ error: 'not found' });
  updateOrder(id, { txid: txid || null });
  res.json({ ok: true });
});

// Экспорт CSV (оператор)
app.get('/api/export.csv', (req, res) => {
  if (req.user.role !== 'operator') return res.status(403).send('forbidden');
  const status = req.query.status || undefined;
  const rows = listOrders({ status, limit: 1000 });
  const csv = toCSV(rows);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="orders.csv"');
  res.send(csv);
});

// Запуск
const listenPort = Number(PORT || 8080);
app.listen(listenPort, () => {
  console.log('Backend on', listenPort);
});

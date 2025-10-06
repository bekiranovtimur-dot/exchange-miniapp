// src/App.jsx
import React, { useEffect, useMemo, useState } from 'react';

const ASSETS = [
  { code: 'USDT_BEP20', label: 'USDT (BEP20)' },
  { code: 'USDT_TRC20', label: 'USDT (TRC20)' },
  { code: 'BTC', label: 'BTC' },
  { code: 'ETH', label: 'ETH' }
];

export default function App() {
  const tg = window.Telegram?.WebApp;
  const initData = tg?.initData || '';
  const initDataUnsafe = tg?.initDataUnsafe || {};
  const backend = import.meta.env.VITE_BACKEND_URL || 'https://your-backend.example';

  const [me, setMe] = useState(null);
  const [asset, setAsset] = useState(ASSETS[0].code);
  const [amount, setAmount] = useState('100');
  const [created, setCreated] = useState(null);
  const [myOrders, setMyOrders] = useState([]);
  const [opOrders, setOpOrders] = useState([]);
  const [filter, setFilter] = useState('pending');

  const headers = useMemo(() => ({
    'Content-Type': 'application/json',
    'x-init-data': initData
  }), [initData]);

  useEffect(() => { tg?.expand(); }, [tg]);

  useEffect(() => {
    (async () => {
      const me = await fetch(`${backend}/api/me`, { headers }).then(r=>r.json());
      setMe(me);
      const mine = await fetch(`${backend}/api/my-orders`, { headers }).then(r=>r.json());
      setMyOrders(mine);
      if (me.role === 'operator') {
        const all = await fetch(`${backend}/api/orders?status=${encodeURIComponent(filter)}`, { headers }).then(r=>r.json());
        setOpOrders(all);
      }
    })();
  }, [backend, headers, filter]);

  async function createOrder() {
    const r = await fetch(`${backend}/api/orders`, {
      method: 'POST', headers,
      body: JSON.stringify({ asset, amount: Number(amount) })
    }).then(r=>r.json());
    if (r.error) return tg?.showAlert('Ошибка: ' + r.error);
    setCreated(r);
    const mine = await fetch(`${backend}/api/my-orders`, { headers }).then(r=>r.json());
    setMyOrders(mine);
  }

  async function setTxid(orderId) {
    const txid = window.prompt('Введите TXID/Hash перевода (необязательно)');
    if (txid === null) return;
    await fetch(`${backend}/api/orders/${orderId}/txid`, {
      method: 'POST', headers, body: JSON.stringify({ txid })
    });
    const mine = await fetch(`${backend}/api/my-orders`, { headers }).then(r=>r.json());
    setMyOrders(mine);
  }

  async function opAction(orderId, status) {
    const comment = window.prompt('Комментарий (необязательно)');
    await fetch(`${backend}/api/orders/${orderId}/status`, {
      method: 'POST', headers, body: JSON.stringify({ status, comment })
    });
    const all = await fetch(`${backend}/api/orders?status=${encodeURIComponent(filter)}`, { headers }).then(r=>r.json());
    setOpOrders(all);
  }

  const userName = useMemo(() => {
    const u = initDataUnsafe?.user; if (!u) return 'гость';
    return u.first_name + (u.last_name ? ' ' + u.last_name : '');
  }, [initDataUnsafe]);

  return (
    <div style={{ padding: 16, fontFamily: 'system-ui, sans-serif' }}>
      <h2>Обмен • Привет, {userName}!</h2>
      {me && (
        <div style={{ marginBottom: 12, fontSize: 12, opacity: 0.8 }}>
          Роль: <b>{me.role}</b>
        </div>
      )}

      {/* Клиентская форма */}
      <div style={{ border: '1px solid #ddd', borderRadius: 12, padding: 12, marginBottom: 16 }}>
        <h3>Создать заявку</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <label>Актив:</label>
          <select value={asset} onChange={e=>setAsset(e.target.value)}>
            {ASSETS.map(a => <option key={a.code} value={a.code}>{a.label}</option>)}
          </select>
          <label>Сумма:</label>
          <input type="number" min="0" step="0.0001" value={amount}
                 onChange={e=>setAmount(e.target.value)} style={{ width: 140 }} />
          <button onClick={createOrder}>Создать</button>
        </div>
        {created && (
          <div style={{ marginTop: 12, background: '#fafafa', padding: 12, borderRadius: 8 }}>
            <div><b>Заявка:</b> {created.orderId}</div>
            <div><b>Отправьте на адрес:</b> {created.address}</div>
            <div><b>К зачислению (RUB):</b> {created.rub_amount}</div>
            <div><b>Статус:</b> {created.status}</div>
            <div style={{ marginTop: 8 }}>
              <button onClick={()=>setTxid(created.orderId)}>Указать TXID</button>
            </div>
            <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
              Важно: переведите ровно указанную сумму. Учтите комиссию сети.
              После поступления средств оператор подтвердит и выдаст RUB.
            </div>
          </div>
        )}
      </div>

      {/* Мои заявки */}
      <div style={{ border: '1px solid #ddd', borderRadius: 12, padding: 12, marginBottom: 16 }}>
        <h3>Мои заявки</h3>
        {myOrders.length === 0 && <div>Пока пусто</div>}
        {myOrders.map(o => (
          <div key={o.id} style={{ borderTop: '1px dashed #ddd', paddingTop: 8, marginTop: 8 }}>
            <div><b>{o.id}</b> • {o.asset} • {o.amount} → {o.rub_amount} RUB</div>
            <div>Адрес: {o.address}</div>
            <div>Статус: <b>{o.status}</b>{o.comment ? ` • ${o.comment}` : ''}</div>
            <div>TXID: {o.txid || '—'}</div>
            <button onClick={()=>setTxid(o.id)}>Изменить TXID</button>
          </div>
        ))}
      </div>

      {/* Панель оператора */}
      {me?.role === 'operator' && (
        <div style={{ border: '2px solid #86b7fe', borderRadius: 12, padding: 12 }}>
          <h3>Оператор</h3>
          <div style={{ marginBottom: 8 }}>
            Фильтр статуса:
            <select value={filter} onChange={e=>setFilter(e.target.value)} style={{ marginLeft: 8 }}>
              <option value="pending">pending</option>
              <option value="paid">paid</option>
              <option value="released">released</option>
              <option value="cancelled">cancelled</option>
              <option value="">все</option>
            </select>
          </div>
          {opOrders.length === 0 && <div>Нет заявок</div>}
          {opOrders.map(o => (
            <div key={o.id} style={{ borderTop: '1px dashed #ddd', paddingTop: 8, marginTop: 8 }}>
              <div><b>{o.id}</b> • uid {o.user_id} • {o.asset} • {o.amount} → {o.rub_amount} RUB</div>
              <div>Адрес: {o.address} • TXID: {o.txid || '—'}</div>
              <div>Статус: <b>{o.status}</b>{o.comment ? ` • ${o.comment}` : ''}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                <button onClick={()=>opAction(o.id,'paid')}>Отметить «Получено»</button>
                <button onClick={()=>opAction(o.id,'released')}>Выдать RUB</button>
                <button onClick={()=>opAction(o.id,'cancelled')}>Отменить</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

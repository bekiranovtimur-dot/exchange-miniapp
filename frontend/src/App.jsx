// frontend/src/App.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';

const ASSETS = [
  { code: 'USDT_BEP20', label: 'USDT', sub: 'BEP20', img: '/icons/usdt-bep20.png' },
  { code: 'USDT_TRC20', label: 'USDT', sub: 'TRC20', img: '/icons/usdt-trc20.png' },
  { code: 'BTC', label: 'BTC', sub: '', img: '/icons/btc.svg' },
  { code: 'ETH', label: 'ETH', sub: '', img: '/icons/eth.svg' },
];

export default function App() {
  const tg = window.Telegram?.WebApp;
  const initData = tg?.initData || '';
  const initDataUnsafe = tg?.initDataUnsafe || {};
  const backend = import.meta.env.VITE_BACKEND_URL || 'https://your-backend.example';
  const supportUsername = import.meta.env.VITE_SUPPORT_USERNAME || 'help';

  const [me, setMe] = useState(null);
  const [asset, setAsset] = useState(ASSETS[0].code);
  const [amount, setAmount] = useState('100');
  const [created, setCreated] = useState(null);
  const [myOrders, setMyOrders] = useState([]);
  const [opOrders, setOpOrders] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [tab, setTab] = useState('client');
  const [quote, setQuote] = useState({ rub_amount: null, rate: null, loading: false });
  const [loading, setLoading] = useState(true);

  const headers = useMemo(() => ({
    'Content-Type': 'application/json',
    'x-init-data': initData,
  }), [initData]);

  useEffect(() => { tg?.expand(); }, [tg]);

  useEffect(() => {
    (async () => {
      try {
        const me = await fetch(`${backend}/api/me`, { headers }).then(r => r.json());
        setMe(me);
        const mine = await fetch(`${backend}/api/my-orders`, { headers }).then(r => r.json());
        setMyOrders(mine);
        if (me.role === 'operator') {
          const all = await fetch(`${backend}/api/orders?status=${encodeURIComponent(filter)}`, { headers }).then(r => r.json());
          setOpOrders(all);
        }
      } catch {
        tg?.showAlert?.('Ошибка загрузки данных. Проверьте подключение.');
      } finally {
        setLoading(false);
      }
    })();
  }, [backend, headers, filter]);

  const debounceRef = useRef(null);
  useEffect(() => {
    setQuote(q => ({ ...q, loading: true }));
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const a = Number(amount);
        if (!a || a <= 0) { setQuote({ rub_amount: null, rate: null, loading: false }); return; }
        const q = await fetch(`${backend}/api/quote?asset=${encodeURIComponent(asset)}&amount=${encodeURIComponent(a)}`, { headers }).then(r => r.json());
        if (q.error) throw new Error(q.error);
        setQuote({ rub_amount: q.rub_amount, rate: q.rate, loading: false });
      } catch { setQuote({ rub_amount: null, rate: null, loading: false }); }
    }, 200);
    return () => clearTimeout(debounceRef.current);
  }, [asset, amount, backend, headers]);

  async function createOrder() {
    const r = await fetch(`${backend}/api/orders`, {
      method: 'POST', headers, body: JSON.stringify({ asset, amount: Number(amount) })
    }).then(r => r.json());
    if (r.error) return tg?.showAlert('Ошибка: ' + r.error);
    setCreated(r);
    const mine = await fetch(`${backend}/api/my-orders`, { headers }).then(r => r.json());
    setMyOrders(mine);
  }

  async function setTxid(orderId) {
    const txid = window.prompt('Введите TXID/Hash перевода (необязательно)');
    if (txid === null) return;
    await fetch(`${backend}/api/orders/${orderId}/txid`, { method: 'POST', headers, body: JSON.stringify({ txid }) });
    const mine = await fetch(`${backend}/api/my-orders`, { headers }).then(r => r.json());
    setMyOrders(mine);
  }

  async function opAction(orderId, status) {
    const comment = window.prompt('Комментарий (необязательно)');
    await fetch(`${backend}/api/orders/${orderId}/status`, { method: 'POST', headers, body: JSON.stringify({ status, comment }) });
    const all = await fetch(`${backend}/api/orders?status=${encodeURIComponent(filter)}`, { headers }).then(r => r.json());
    setOpOrders(all);
  }

  const userName = useMemo(() => {
    const u = initDataUnsafe?.user; if (!u) return 'гость';
    return u.first_name + (u.last_name ? ' ' + u.last_name : '');
  }, [initDataUnsafe]);

  function openSupport() {
    const url = `https://t.me/${supportUsername}`;
    if (tg?.openTelegramLink) tg.openTelegramLink(url);
    else window.open(url, '_blank');
  }

  const AssetBtn = ({ a, active, onClick }) => (
    <button className={`asset-btn ${active ? 'active' : ''}`} onClick={onClick}>
      <span className="asset-ico">
        <img src={a.img} alt={a.label} className="asset-img" loading="lazy" />
      </span>
      <span className="asset-text">
        <b>{a.label}</b>
        {a.sub ? <small>{a.sub}</small> : null}
      </span>
    </button>
  );

  return (
    <div className="screen">
      <div className="topbar glass rise">
        <div className="brand">
          <span>💱</span>
          <span>Top Crypto Exchange</span>
        </div>
        <div className="actions">
          <button className="btn gold" onClick={openSupport}>Служба помощи</button>
          <span className="badge">Привет, {userName}</span>
        </div>
      </div>

      <div className="container">
        <div className="tabs">
          <button className={`tab ${tab==='client'?'active':''}`} onClick={()=>setTab('client')}>Клиент</button>
          {me?.role==='operator' && (
            <button className={`tab ${tab==='operator'?'active':''}`} onClick={()=>setTab('operator')}>Оператор</button>
          )}
        </div>

        {tab==='client' && (
          <div className="grid two">
            <div className="card glow section">
              <h3 className="title">Создать заявку</h3>

              <div className="asset-picker">
                <div className="asset-scroll">
                  {ASSETS.map(a => (
                    <AssetBtn key={a.code} a={a} active={asset===a.code} onClick={()=>setAsset(a.code)} />
                  ))}
                </div>
              </div>

              <div className="row" style={{margin:'8px 0'}}>
                <label className="muted">Сумма</label>
                <input className="input" type="number" min="0" step="0.0001" value={amount}
                  onChange={e=>setAmount(e.target.value)} style={{ width: 180 }} />
                <button className="btn gold" onClick={createOrder}>Создать</button>
              </div>

              <div className="quote">
                <div className="muted">К зачислению (RUB)</div>
                <div className={`quote-value ${quote.loading ? 'loading' : ''}`}>
                  {quote.rub_amount !== null ? <span>{quote.rub_amount}</span> : <span>—</span>}
                </div>
                {quote.rate && (
                  <div className="muted" style={{fontSize:12}}>Курс: {Math.round(quote.rate)}</div>
                )}
              </div>

              {created && (
                <div className="created fade-in">
                  <div className="divider"></div>
                  <div className="row" style={{gap:8, alignItems:'center'}}>
                    <span className="status s-pending">● pending</span>
                    <span className="chip">ID: {created.orderId}</span>
                    <span className="chip">RUB: {created.rub_amount}</span>
                  </div>
                  <div className="list-item">
                    <div className="muted">Отправьте на адрес</div>
                    <div className="addr">{created.address}</div>
                    <div style={{marginTop:8}}>
                      <button className="btn" onClick={()=>setTxid(created.orderId)}>Указать TXID</button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="card glass section">
              <h3 className="title">Мои заявки</h3>
              {myOrders.length === 0 && <div className="muted">Пока пусто</div>}
              {myOrders.map(o => (
                <div key={o.id} className="list-item hover-rise">
                  <div className="row" style={{justifyContent:'space-between'}}>
                    <div><b>{o.asset}</b> • {o.amount} → {o.rub_amount} RUB</div>
                    <div><span className={`status s-${o.status}`}>● {o.status}</span></div>
                  </div>
                  <div className="muted">ID: {o.id}</div>
                  <div className="muted">Адрес: <span className="addr">{o.address}</span></div>
                  <div className="muted">TXID: {o.txid || '—'}</div>
                  <div style={{marginTop:6}}>
                    <button className="btn" onClick={()=>setTxid(o.id)}>Изменить TXID</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab==='operator' && me?.role==='operator' && (
          <div className="card glow">
            <div className="row" style={{justifyContent:'space-between'}}>
              <h3 className="title">Оператор</h3>
              <div>
                <span className="muted">Фильтр:</span>{' '}
                <select value={filter} onChange={e=>setFilter(e.target.value)}>
                  <option value="pending">pending</option>
                  <option value="paid">paid</option>
                  <option value="released">released</option>
                  <option value="cancelled">cancelled</option>
                  <option value="">все</option>
                </select>
              </div>
            </div>
            {opOrders.length === 0 && <div className="muted" style={{marginTop:8}}>Нет заявок</div>}
            {opOrders.map(o => (
              <div key={o.id} className="list-item hover-rise">
                <div className="row" style={{justifyContent:'space-between'}}>
                  <div><b>{o.id}</b> • uid {o.user_id}</div>
                  <span className={`status s-${o.status}`}>● {o.status}</span>
                </div>
                <div className="muted">{o.asset} • {o.amount} → {o.rub_amount} RUB • rate {Math.round(o.rate)}</div>
                <div className="muted">Адрес: <span className="addr">{o.address}</span></div>
                <div className="muted">TXID: {o.txid || '—'}</div>
                <div className="row" style={{marginTop:6}}>
                  <button className="btn" onClick={()=>opAction(o.id,'paid')}>Отметить «Получено»</button>
                  <button className="btn" onClick={()=>opAction(o.id,'released')}>Выдать RUB</button>
                  <button className="btn" onClick={()=>opAction(o.id,'cancelled')}>Отменить</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

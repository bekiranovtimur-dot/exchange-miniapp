// frontend/src/App.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';

function UsdtIcon({ size=18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" fill="none" aria-hidden>
      <circle cx="128" cy="128" r="128" fill="#26A17B"/>
      <path fill="#fff" d="M57 77h142v22h-53v17.4c36 2.8 60 10.4 60 19.6 0 11.3-37.7 20.5-84 20.5s-84-9.2-84-20.5c0-9.2 24-16.8 60-19.6V99H57V77zm71 78c41.5 0 63.7-5.8 70.8-9.2-7.1-3.4-29.3-9.2-70.8-9.2s-63.7 5.8-70.8 9.2c7.1 3.4 29.3 9.2 70.8 9.2z"/>
    </svg>
  );
}
function BtcIcon({ size=18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <circle cx="16" cy="16" r="16" fill="#F7931A"/>
      <path fill="#fff" d="M18.7 14.2c1-.6 1.6-1.5 1.5-2.9-.2-2-1.9-2.7-4.1-2.9V5.3h-2v3H12v-3H10v3H7v2h3v6H7v2h3v3h2v-3h1.2v3h2v-3.2c2.7-.2 4.4-1.1 4.5-3.2.1-1.4-.5-2.3-2-2.9ZM14 9.5h2c1.3 0 2 .4 2 1.4 0 1-.8 1.5-2.2 1.5H14V9.5Zm1.9 8.4H14v-3h2c1.6 0 2.4.5 2.4 1.5 0 1.1-.8 1.5-2.5 1.5Z"/>
    </svg>
  );
}
function EthIcon({ size=18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 417" aria-hidden>
      <path fill="#343434" d="M127.6 0l-1 5.7v279.1l1 .9 127.6-75z"/>
      <path fill="#8C8C8C" d="M127.6 0L0 210.7l127.6 75V0z"/>
      <path fill="#3C3C3B" d="M127.6 310.6l-.6.7v105l.6 1.7 127.7-180.1z"/>
      <path fill="#8C8C8C" d="M127.6 418v-107.5L0 237.9z"/>
      <path fill="#141414" d="M127.6 285.7l127.6-75-127.6-57.9z"/>
      <path fill="#393939" d="M0 210.7l127.6 75v-132.9z"/>
    </svg>
  );
}

const ASSETS = [
  { code: 'USDT_BEP20', label: 'USDT (BEP20)', icon: UsdtIcon },
  { code: 'USDT_TRC20', label: 'USDT (TRC20)', icon: UsdtIcon },
  { code: 'BTC', label: 'BTC', icon: BtcIcon },
  { code: 'ETH', label: 'ETH', icon: EthIcon }
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
  const [tab, setTab] = useState('client'); // client | operator
  const [quote, setQuote] = useState({ rub_amount: null, rate: null, loading: false });
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'night'); // 'night' | 'dawn'

  const headers = useMemo(
    () => ({ 'Content-Type': 'application/json', 'x-init-data': initData }),
    [initData]
  );

  // Apply theme to <body>
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Particle background
  useEffect(() => {
    const c = document.getElementById('bg-canvas');
    if (!c) return;
    const ctx = c.getContext('2d');
    let w, h, raf;
    const DPR = Math.min(2, window.devicePixelRatio || 1);
    const P = Array.from({ length: 40 }, () => ({
      x: Math.random(), y: Math.random(),
      r: 0.6 + Math.random() * 1.5,
      s: 0.0007 + Math.random() * 0.0014
    }));
    const resize = () => {
      w = c.offsetWidth; h = c.offsetHeight;
      c.width = w * DPR; c.height = h * DPR; ctx.setTransform(DPR,0,0,DPR,0,0);
    };
    const tick = (t) => {
      ctx.clearRect(0, 0, w, h);
      for (const p of P) {
        const x = (p.x + Math.sin(t * p.s) * 0.0015 + 1) % 1;
        const y = (p.y + Math.cos(t * p.s) * 0.0015 + 1) % 1;
        ctx.beginPath();
        ctx.arc(x * w, y * h, p.r, 0, Math.PI * 2);
        ctx.fillStyle = theme === 'night' ? 'rgba(200,161,90,0.08)' : 'rgba(255,214,153,0.10)';
        ctx.shadowColor = theme === 'night' ? 'rgba(200,161,90,0.25)' : 'rgba(255,214,153,0.28)';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      raf = requestAnimationFrame(tick);
    };
    resize();
    window.addEventListener('resize', resize);
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [theme]);

  useEffect(() => { tg?.expand(); }, [tg]);

  // Initial load with skeleton
  useEffect(() => {
    (async () => {
      try {
        const meRes = await fetch(`${backend}/api/me`, { headers });
        const meJson = await meRes.json();
        setMe(meJson);
        const mine = await fetch(`${backend}/api/my-orders`, { headers }).then(r => r.json());
        setMyOrders(mine);
        if (meJson.role === 'operator') {
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

  // Live quote (debounced)
  const debounceRef = useRef(null);
  useEffect(() => {
    setQuote(q => ({ ...q, loading: true }));
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const a = Number(amount);
        if (!a || a <= 0) {
          setQuote({ rub_amount: null, rate: null, loading: false });
          return;
        }
        const q = await fetch(`${backend}/api/quote?asset=${encodeURIComponent(asset)}&amount=${encodeURIComponent(a)}`, { headers })
          .then(r => r.json());
        if (q.error) throw new Error(q.error);
        setQuote({ rub_amount: q.rub_amount, rate: q.rate, loading: false });
      } catch {
        setQuote({ rub_amount: null, rate: null, loading: false });
      }
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
    const all = await fetch(`${backend}/api/orders?status=${encodeURIComponent(filter)}`, { headers }).then(r => r.json());
    setOpOrders(all);
  }

  const userName = useMemo(() => {
    const u = initDataUnsafe?.user; if (!u) return 'гость';
    return u.first_name + (u.last_name ? ' ' + u.last_name : '');
  }, [initDataUnsafe]);

  const ActiveIcon = (ASSETS.find(a => a.code === asset)?.icon) || (() => null);

  // 3D tilt for cards
  function useTilt() {
    const ref = useRef(null);
    useEffect(() => {
      const el = ref.current; if (!el) return;
      const onMove = (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        const rx = (py - 0.5) * 8;   // tilt X
        const ry = (px - 0.5) * -8;  // tilt Y
        el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`;
      };
      const onLeave = () => { el.style.transform = ''; };
      el.addEventListener('mousemove', onMove);
      el.addEventListener('mouseleave', onLeave);
      return () => { el.removeEventListener('mousemove', onMove); el.removeEventListener('mouseleave', onLeave); };
    }, []);
    return ref;
  }
  const tiltA = useTilt();
  const tiltB = useTilt();
  const tiltC = useTilt();

  function openSupport() {
    const url = `https://t.me/${supportUsername}`;
    if (tg?.openTelegramLink) tg.openTelegramLink(url);
    else window.open(url, '_blank');
  }

  return (
    <div className="screen">
      <canvas id="bg-canvas" className="bg"></canvas>

      <div className="topbar glass rise">
        <div className="brand">
          <span className="logo">
            <ActiveIcon size={16}/>
          </span>
          <span>Top Crypto Exchange</span>
        </div>
        <div className="actions">
          <button className="btn ghost" onClick={()=>setTheme(theme==='night'?'dawn':'night')}>
            {theme === 'night' ? 'Gothic Dawn' : 'Gothic Night'}
          </button>
          <button className="btn gold" onClick={openSupport}>Служба помощи</button>
          <span className="badge">Привет, {userName}</span>
        </div>
      </div>

      <div className="container">
        {/* Tabs */}
        <div className="tabs">
          <button className={`tab ${tab==='client'?'active':''}`} onClick={()=>setTab('client')}>Клиент</button>
          {me?.role==='operator' && (
            <button className={`tab ${tab==='operator'?'active':''}`} onClick={()=>setTab('operator')}>Оператор</button>
          )}
        </div>

        {loading ? (
          // Skeleton layout
          <div className="grid two">
            <div ref={tiltA} className="card glass section tilt">
              <div className="skeleton title-sk"></div>
              <div className="skeleton row-sk"></div>
              <div className="skeleton row-sk"></div>
              <div className="skeleton block-sk"></div>
            </div>
            <div ref={tiltB} className="card glass section tilt">
              <div className="skeleton title-sk"></div>
              <div className="skeleton list-sk"></div>
              <div className="skeleton list-sk"></div>
              <div className="skeleton list-sk"></div>
            </div>
          </div>
        ) : (
          <>
            {tab==='client' && (
              <div className="grid two">
                <div ref={tiltA} className="card glow section tilt">
                  <h3 className="title">Создать заявку</h3>
                  <div className="row" style={{margin:'8px 0'}}>
                    <label className="muted">Актив</label>
                    <select value={asset} onChange={e=>setAsset(e.target.value)}>
                      {ASSETS.map(a => <option key={a.code} value={a.code}>{a.label}</option>)}
                    </select>
                    <label className="muted">Сумма</label>
                    <input className="input" type="number" min="0" step="0.0001" value={amount}
                      onChange={e=>setAmount(e.target.value)} style={{ width: 160 }} />
                    <button className="btn gold pulse" onClick={createOrder}>Создать</button>
                  </div>

                  {/* Live quote */}
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

                <div ref={tiltB} className="card glass section tilt">
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
              <div ref={tiltC} className="card glow tilt">
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
          </>
        )}
      </div>
    </div>
  );
}

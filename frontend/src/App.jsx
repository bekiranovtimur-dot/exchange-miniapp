// frontend/src/App.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';

/* =========================
   Inline SVG "coin" icons 48x48
   ========================= */
const Coin = ({ gradFrom = '#fff', gradTo = '#f5f6f8', ring = '#e9edf2', children }) => (
  <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden>
    <defs>
      <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor={gradFrom}/>
        <stop offset="100%" stopColor={gradTo}/>
      </linearGradient>
      <filter id="s" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.16"/>
      </filter>
    </defs>
    <g filter="url(#s)">
      <circle cx="24" cy="24" r="22" fill="url(#g1)" stroke={ring} strokeWidth="1.2"/>
      {children}
    </g>
  </svg>
);

const IconUSDT = ({ label='BEP20' }) => (
  <Coin gradFrom="#ffffff" gradTo="#f6faf8" ring="#e6f2ed">
    <circle cx="24" cy="24" r="14" fill="#26A17B"/>
    <path fill="#fff" d="M14.8 18h18.4v3h-6.8v2.5c4.6.4 7.6 1.5 7.6 2.9 0 1.9-4.8 3.4-10.8 3.4S12 28.3 12 26.4c0-1.4 3-2.5 7.6-2.9V21H14.8v-3zm9.2 9.5c5.3 0 8.1-.8 9-1.5-.9-.6-3.7-1.5-9-1.5s-8.1.9-9 1.5c.9.7 3.7 1.5 9 1.5z"/>
    <text x="24" y="41" textAnchor="middle" fontFamily="system-ui, -apple-system, Segoe UI, Roboto" fontSize="8" fill="#ff8e57">{label}</text>
  </Coin>
);

const IconBTC = () => (
  <Coin gradFrom="#fff" gradTo="#faf7f2" ring="#f2e8dd">
    <circle cx="24" cy="24" r="14" fill="#F7931A"/>
    <path fill="#fff" d="M26.8 21.7c1.3-.7 2-1.9 1.8-3.7-.3-2.6-2.4-3.5-5.2-3.7V12h-2.3v2.2h-1.3V12h-2.3v2.2H15v2h1.6v7.4H15v2h1.1v2.2h2.3v-2.2h1.3v2.2h2.3v-2.4c3.4-.2 5.4-1.4 5.6-3.9.2-1.7-.5-2.9-1.8-3.6Zm-5.5-5.6h2.3c1.5 0 2.3.5 2.3 1.6 0 1.2-.9 1.7-2.5 1.7h-2.1V16.1Zm2.1 8.9h-2.1v-3h2.1c1.8 0 2.7.6 2.7 1.7 0 1.2-.9 1.7-2.7 1.7Z"/>
  </Coin>
);

const IconETH = () => (
  <Coin gradFrom="#fff" gradTo="#f6f7fb" ring="#e7e9f5">
    <g transform="translate(24 24) scale(0.8) translate(-24 -24)">
      <path fill="#343434" d="M24 7l-.2 1.1V33l.2.2 14.9-8.7z"/>
      <path fill="#8C8C8C" d="M24 7L9.1 24.5 24 33V7z"/>
      <path fill="#3C3C3B" d="M24 35.8l-.1.2V43l.1.3 15-21.1z"/>
      <path fill="#8C8C8C" d="M24 43v-7.4L9.1 22.2z"/>
      <path fill="#141414" d="M24 33l14.9-8.7L24 18.2z"/>
      <path fill="#393939" d="M9.1 24.5L24 33V18.2z"/>
    </g>
  </Coin>
);

const IconRUB = () => (
  <Coin gradFrom="#fff" gradTo="#fff7f3" ring="#ffe5d6">
    <circle cx="24" cy="24" r="14" fill="#ffb36b"/>
    <path fill="#fff" d="M19.5 18h6a4 4 0 0 1 0 8h-3v2h3v2h-3v2h-3v-2h-2v-2h2v-2h-2v-2h2v-6Zm3 6h3a1 1 0 0 0 0-2h-3v2Z"/>
  </Coin>
);

/* =========================
   Data sets
   ========================= */
const ASSETS_GIVE = [
  { code: 'USDT_BEP20', label: 'USDT', sub: 'BEP20', icon: () => <IconUSDT label="BEP20" /> },
  { code: 'USDT_TRC20', label: 'USDT', sub: 'TRC20', icon: () => <IconUSDT label="TRC20" /> },
];

const RECEIVE_METHODS = [
  { code: 'TINKOFF',  label: 'Т-банк',   color:'#ff8e57', icon: () => (
    <Coin gradFrom="#fff" gradTo="#fff7f3" ring="#ffe4d3">
      <rect x="14" y="16" width="20" height="16" rx="3" fill="#ff8e57"/>
      <rect x="17" y="19" width="14" height="2.5" rx="1.25" fill="#fff" opacity=".95"/>
      <rect x="17" y="23" width="10" height="2.5" rx="1.25" fill="#fff" opacity=".95"/>
      <rect x="17" y="27" width="6" height="2.5" rx="1.25" fill="#fff" opacity=".95"/>
    </Coin>
  )},
  { code: 'SBER',     label: 'Сбербанк', color:'#38c76a', icon: () => (
    <Coin gradFrom="#fff" gradTo="#f5fff8" ring="#dff5e7">
      <circle cx="24" cy="24" r="12" fill="#38c76a"/>
      <path fill="#fff" d="M18.2 24.8l3.8 3.2 7.8-7.2-1.6-1.8-6.2 5.7-2.2-1.9z"/>
    </Coin>
  )},
  { code: 'ALFA',     label: 'Альфа',    color:'#e54d42', icon: () => (
    <Coin gradFrom="#fff" gradTo="#fff5f4" ring="#ffe1de">
      <circle cx="24" cy="24" r="12" fill="#e54d42"/>
      <path fill="#fff" d="M24 16l5 16h-3l-1-3h-3.8l-1 3h-3L21.2 24h5.4l-.8-2.5H22l1-3.5h1z"/>
    </Coin>
  )},
  { code: 'CASH',     label: 'Наличные', color:'#ffa445', icon: () => (
    <Coin gradFrom="#fff" gradTo="#fff8ef" ring="#ffe9d3">
      <rect x="14" y="16" width="20" height="16" rx="3" fill="#ffa445"/>
      <circle cx="24" cy="24" r="4.6" fill="#ffd9b3"/>
      <path fill="#a85f2a" d="M23 22h2v4h-2zM22 25h4v2h-4z" opacity=".6"/>
    </Coin>
  )},
];

/* =========================
   App
   ========================= */
export default function App() {
  const tg = window.Telegram?.WebApp;
  const initData = tg?.initData || '';
  const initDataUnsafe = tg?.initDataUnsafe || {};
  const backend = import.meta.env.VITE_BACKEND_URL || 'https://your-backend.example';
  const supportUsername = import.meta.env.VITE_SUPPORT_USERNAME || 'help';

  const [me, setMe] = useState(null);
  const [tab, setTab] = useState('client'); // client | operator

  const [giveAsset, setGiveAsset] = useState(ASSETS_GIVE[0].code);
  const [receiveMethod, setReceiveMethod] = useState(RECEIVE_METHODS[0].code);
  const [amount, setAmount] = useState('100');

  const [quote, setQuote] = useState({ rub_amount: null, rate: null, loading: false });
  const [created, setCreated] = useState(null);
  const [myOrders, setMyOrders] = useState([]);
  const [opOrders, setOpOrders] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);

  const headers = useMemo(() => ({
    'Content-Type': 'application/json',
    'x-init-data': initData,
  }), [initData]);

  useEffect(() => { tg?.expand?.(); }, [tg]);

  // Initial load (with skeleton)
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

  // Live quote (debounced) — зависит от giveAsset + amount
  const debounceRef = useRef(null);
  useEffect(() => {
    setQuote(q => ({ ...q, loading: true }));
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const a = Number(amount);
        if (!a || a <= 0) { setQuote({ rub_amount: null, rate: null, loading: false }); return; }
        const q = await fetch(`${backend}/api/quote?asset=${encodeURIComponent(giveAsset)}&amount=${encodeURIComponent(a)}`, { headers })
          .then(r => r.json());
        if (q.error) throw new Error(q.error);
        setQuote({ rub_amount: q.rub_amount, rate: q.rate, loading: false });
      } catch {
        setQuote({ rub_amount: null, rate: null, loading: false });
      }
    }, 200);
    return () => clearTimeout(debounceRef.current);
  }, [giveAsset, amount, backend, headers]);

  async function createOrder() {
    const r = await fetch(`${backend}/api/orders`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        asset: giveAsset,
        amount: Number(amount),
        receive_method: receiveMethod, // бэкенд может игнорировать; добавлено на будущее
      }),
    }).then(r => r.json());
    if (r.error) return tg?.showAlert?.('Ошибка: ' + r.error);
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

  function openSupport() {
    const url = `https://t.me/${supportUsername}`;
    if (tg?.openTelegramLink) tg.openTelegramLink(url);
    else window.open(url, '_blank');
  }

  /* UI helpers */
  const Pill = ({ active, onClick, icon:Icon, title, subtitle }) => (
    <button
      onClick={onClick}
      className={[
        'group flex items-center gap-3 rounded-2xl border px-3 py-2.5',
        'bg-white/70 backdrop-blur-sm',
        active
          ? 'border-[#ff9a62] shadow-[0_10px_28px_rgba(255,150,90,.25)] ring-1 ring-[#ffb36b]'
          : 'border-[#e8edf3] hover:border-[#ffc099] hover:shadow-[0_8px_22px_rgba(255,150,90,.18)]',
        'transition-all ease-out'
      ].join(' ')}
    >
      <span className="w-12 h-12 flex items-center justify-center">{Icon ? <Icon/> : null}</span>
      <span className="flex flex-col text-left leading-tight">
        <b className="text-slate-900 tracking-tight">{title}</b>
        {subtitle ? <small className="text-slate-500 -mt-0.5">{subtitle}</small> : null}
      </span>
    </button>
  );

  return (
    <div className="relative">
      {/* Topbar */}
      <div className="mx-2 mt-2 mb-3 rounded-2xl border border-[#edf1f6] bg-white/80 backdrop-blur-md shadow-[0_12px_30px_rgba(19,24,30,.06)] px-3 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 font-extrabold tracking-wide text-slate-900">
          <span className="text-xl">💱</span>
          <span>Top Crypto Exchange</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={openSupport} className="btn btn-primary">Служба помощи</button>
          <span className="text-xs text-slate-500">Привет, {userName}</span>
        </div>
      </div>

      <div className="p-4">
        {/* Tabs */}
        <div className="flex gap-2 mb-3">
          <button className={`tab ${tab==='client'?'active':''}`} onClick={()=>setTab('client')}>Клиент</button>
          {me?.role==='operator' && (
            <button className={`tab ${tab==='operator'?'active':''}`} onClick={()=>setTab('operator')}>Оператор</button>
          )}
        </div>

        {loading ? (
          // Light skeletons
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card">
              <div className="skeleton h-4 w-1/3 mb-3"></div>
              <div className="skeleton h-14 w-full mb-2"></div>
              <div className="skeleton h-14 w-full mb-2"></div>
              <div className="skeleton h-24 w-full"></div>
            </div>
            <div className="card">
              <div className="skeleton h-4 w-1/3 mb-3"></div>
              <div className="skeleton h-14 w-full mb-2"></div>
              <div className="skeleton h-14 w-full mb-2"></div>
              <div className="skeleton h-14 w-full"></div>
            </div>
          </div>
        ) : (
          <>
            {tab === 'client' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadein">
                {/* Create order */}
                <div className="card">
                  <h3 className="title mb-3 text-slate-900">Создать заявку</h3>

                  {/* Я отдаю */}
                  <div className="mb-2">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm font-semibold text-slate-700">Я отдаю</div>
                    </div>
                    <div className="grid auto-cols-max grid-flow-col gap-2 overflow-x-auto pb-1 no-scrollbar">
                      {ASSETS_GIVE.map(a => (
                        <Pill
                          key={a.code}
                          active={giveAsset===a.code}
                          onClick={()=>setGiveAsset(a.code)}
                          icon={a.icon}
                          title={a.label}
                          subtitle={a.sub}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Сумма */}
                  <div className="flex flex-wrap items-center gap-2 my-3">
                    <label className="text-slate-600">Сумма</label>
                    <input
                      type="number"
                      min="0"
                      step="0.0001"
                      value={amount}
                      onChange={e=>setAmount(e.target.value)}
                      className="input w-48"
                      placeholder="0.00"
                    />
                  </div>

                  {/* Получаю */}
                  <div className="mb-3">
                    <div className="text-sm font-semibold text-slate-700 mb-1">Получаю</div>
                    <div className="grid auto-cols-max grid-flow-col gap-2 overflow-x-auto pb-1 no-scrollbar">
                      {RECEIVE_METHODS.map(m => (
                        <Pill
                          key={m.code}
                          active={receiveMethod===m.code}
                          onClick={()=>setReceiveMethod(m.code)}
                          icon={m.icon}
                          title={m.label}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Live quote */}
                  <div className="rounded-2xl border border-[#f0f3f7] bg-white/80 backdrop-blur-sm p-3 shadow-[0_6px_16px_rgba(19,24,30,.05)]">
                    <div className="text-slate-500">К зачислению (RUB)</div>
                    <div className={`mt-1 text-3xl font-extrabold tracking-tight text-slate-900 transition-all ${quote.loading ? 'opacity-60 -translate-y-0.5' : 'opacity-100'}`}>
                      {quote.rub_amount !== null ? quote.rub_amount : '—'}
                    </div>
                    {quote.rate && (
                      <div className="text-xs text-slate-500 mt-1">Курс: {Math.round(quote.rate)}</div>
                    )}
                  </div>

                  <div className="mt-3">
                    <button className="btn btn-primary" onClick={createOrder}>Создать</button>
                  </div>

                  {created && (
                    <div className="mt-4 animate-fadein">
                      <div className="divider" />
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="badge badge-warn">pending</span>
                        <span className="chip">ID: {created.orderId}</span>
                        <span className="chip">RUB: {created.rub_amount}</span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-dashed border-[#e9eef4]">
                        <div className="text-slate-600">Отправьте на адрес</div>
                        <div className="addr">{created.address}</div>
                        <button className="btn mt-2" onClick={()=>setTxid(created.orderId)}>Указать TXID</button>
                      </div>
                    </div>
                  )}
                </div>

                {/* My orders */}
                <div className="card">
                  <h3 className="title mb-3 text-slate-900">Мои заявки</h3>
                  {myOrders.length === 0 && <div className="text-slate-500">Пока пусто</div>}
                  {myOrders.map(o => (
                    <div key={o.id} className="pt-3 mt-3 border-t border-dashed border-[#e9eef4] hover:-translate-y-[1px] hover:shadow-[0_12px_26px_rgba(19,24,30,.06)] transition">
                      <div className="flex items-center justify-between">
                        <div className="text-slate-900"><b>{o.asset}</b> • {o.amount} → {o.rub_amount} RUB</div>
                        <span className={`status s-${o.status}`}>{o.status}</span>
                      </div>
                      <div className="text-slate-500">ID: {o.id}</div>
                      <div className="text-slate-500">Адрес: <span className="addr">{o.address}</span></div>
                      <div className="text-slate-500">TXID: {o.txid || '—'}</div>
                      <button className="btn mt-2" onClick={()=>setTxid(o.id)}>Изменить TXID</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'operator' && me?.role==='operator' && (
              <div className="card animate-fadein">
                <div className="flex items-center justify-between">
                  <h3 className="title text-slate-900">Оператор</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600">Фильтр:</span>
                    <select className="input" value={filter} onChange={e=>setFilter(e.target.value)}>
                      <option value="pending">pending</option>
                      <option value="paid">paid</option>
                      <option value="released">released</option>
                      <option value="cancelled">cancelled</option>
                      <option value="">все</option>
                    </select>
                  </div>
                </div>
                {opOrders.length === 0 && <div className="text-slate-500 mt-2">Нет заявок</div>}
                {opOrders.map(o => (
                  <div key={o.id} className="pt-3 mt-3 border-t border-dashed border-[#e9eef4] hover:-translate-y-[1px] hover:shadow-[0_12px_26px_rgba(19,24,30,.06)] transition">
                    <div className="flex items-center justify-between">
                      <div className="text-slate-900"><b>{o.id}</b> • uid {o.user_id}</div>
                      <span className={`status s-${o.status}`}>{o.status}</span>
                    </div>
                    <div className="text-slate-500">{o.asset} • {o.amount} → {o.rub_amount} RUB • rate {Math.round(o.rate)}</div>
                    <div className="text-slate-500">Адрес: <span className="addr">{o.address}</span></div>
                    <div className="text-slate-500">TXID: {o.txid || '—'}</div>
                    <div className="flex gap-2 mt-2">
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

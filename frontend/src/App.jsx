import React, { useEffect, useMemo, useState } from 'react';


const ASSETS = [
{ code: 'USDT_BEP20', label: 'USDT (BEP20)', icon: UsdtIcon },
{ code: 'USDT_TRC20', label: 'USDT (TRC20)', icon: UsdtIcon },
{ code: 'BTC', label: 'BTC', icon: BtcIcon },
{ code: 'ETH', label: 'ETH', icon: EthIcon }
];


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
const [tab, setTab] = useState('client'); // client | operator


const headers = useMemo(() => ({ 'Content-Type': 'application/json', 'x-init-data': initData }), [initData]);


useEffect(() => { tg?.expand(); }, [tg]);


}

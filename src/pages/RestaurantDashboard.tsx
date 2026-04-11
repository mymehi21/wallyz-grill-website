import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Printer, Check, LogOut, UtensilsCrossed, Clock, Phone, FileText, ChevronDown, ChevronUp, ShoppingBag, Hash, Trash2, RotateCcw, AlertTriangle } from 'lucide-react';

interface RestaurantAccount {
  id: string;
  username: string;
  location_id: string;
  location_name: string;
}

interface RestaurantDashboardProps {
  account: RestaurantAccount;
  onLogout: () => void;
}

type AnyOrder = any;
type TabType = 'pending' | 'done' | 'deleted';

export default function RestaurantDashboard({ account, onLogout }: RestaurantDashboardProps) {
  const [pendingOrders, setPendingOrders] = useState<AnyOrder[]>([]);
  const [confirmedOrders, setConfirmedOrders] = useState<AnyOrder[]>([]);
  const [deletedOrders, setDeletedOrders] = useState<AnyOrder[]>([]);
  const [activeAlert, setActiveAlert] = useState<AnyOrder | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<TabType>('pending');
  const [orderCount, setOrderCount] = useState(0);
  const audioIntervalRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const knownOrderIds = useRef<Set<string>>(new Set());
  const isFirstLoad = useRef(true);

  // Loud urgent alarm sound for busy restaurant
  const playAlertSound = useCallback(() => {
    try {
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;

      const playBeep = (freq: number, start: number, dur: number, vol: number, type: OscillatorType = 'square') => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const dist = ctx.createWaveShaper();
        
        // Distortion for harsh sound
        const curve = new Float32Array(256);
        for (let i = 0; i < 256; i++) {
          const x = (i * 2) / 256 - 1;
          curve[i] = (Math.PI + 200) * x / (Math.PI + 200 * Math.abs(x));
        }
        dist.curve = curve;
        
        osc.connect(gain);
        gain.connect(dist);
        dist.connect(ctx.destination);
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(vol, ctx.currentTime + start);
        gain.gain.setValueAtTime(0, ctx.currentTime + start + dur);
        
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + dur + 0.01);
      };

      // Aggressive repeating alarm: 3 short loud beeps
      const vol = 1.0;
      playBeep(880, 0.00, 0.12, vol, 'square');
      playBeep(880, 0.18, 0.12, vol, 'square');
      playBeep(880, 0.36, 0.12, vol, 'square');
      // Second burst
      playBeep(1100, 0.65, 0.12, vol, 'square');
      playBeep(1100, 0.83, 0.12, vol, 'square');
      playBeep(1100, 1.01, 0.12, vol, 'square');
    } catch (e) {
      console.error('Audio error:', e);
    }
  }, []);

  const startAlert = useCallback((order: AnyOrder) => {
    setActiveAlert(order);
    playAlertSound();
    if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    audioIntervalRef.current = window.setInterval(playAlertSound, 4000);
  }, [playAlertSound]);

  const stopAlert = useCallback(() => {
    if (audioIntervalRef.current) { clearInterval(audioIntervalRef.current); audioIntervalRef.current = null; }
    setActiveAlert(null);
  }, []);

  const fetchOrders = useCallback(async () => {
    const { data, error } = await supabase
      .from('pickup_orders')
      .select('*')
      .eq('location_id', account.location_id)
      .in('status', ['paid', 'paid_clover_sync_failed'])
      .order('created_at', { ascending: false });

    if (error) { console.error('Fetch error:', error); return; }

    const allOrders = data || [];
    const pendingList = allOrders.filter(o => !o.confirmed_at && !o.deleted_at);
    const confirmedList = allOrders.filter(o => o.confirmed_at && !o.deleted_at);
    const deletedList = allOrders.filter(o => o.deleted_at);

    if (!isFirstLoad.current) {
      pendingList.forEach(order => {
        if (!knownOrderIds.current.has(order.id)) {
          knownOrderIds.current.add(order.id);
          startAlert(order);
        }
      });
    } else {
      pendingList.forEach(o => knownOrderIds.current.add(o.id));
      isFirstLoad.current = false;
    }

    setPendingOrders(pendingList);
    setConfirmedOrders(confirmedList);
    setDeletedOrders(deletedList);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count } = await supabase
      .from('pickup_orders')
      .select('id', { count: 'exact', head: true })
      .eq('location_id', account.location_id)
      .in('status', ['paid', 'paid_clover_sync_failed'])
      .is('deleted_at', null)
      .gte('created_at', today.toISOString());
    setOrderCount(count || 0);
  }, [account.location_id, startAlert]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  useEffect(() => {
    const channel = supabase.channel(`restaurant-${account.location_id}-${Date.now()}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pickup_orders', filter: `location_id=eq.${account.location_id}` }, (payload) => {
        const order = payload.new;
        if (['paid', 'paid_clover_sync_failed'].includes(order.status) && !order.confirmed_at && !order.deleted_at) {
          if (!knownOrderIds.current.has(order.id)) {
            knownOrderIds.current.add(order.id);
            setPendingOrders(prev => [order, ...prev]);
            startAlert(order);
          }
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pickup_orders', filter: `location_id=eq.${account.location_id}` }, (payload) => {
        const order = payload.new;
        if (['paid', 'paid_clover_sync_failed'].includes(order.status) && !order.confirmed_at && !order.deleted_at) {
          if (!knownOrderIds.current.has(order.id)) {
            knownOrderIds.current.add(order.id);
            setPendingOrders(prev => prev.find(o => o.id === order.id) ? prev : [order, ...prev]);
            startAlert(order);
          }
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [account.location_id, startAlert]);

  const confirmOrder = async (order: AnyOrder) => {
    const now = new Date().toISOString();
    await supabase.from('pickup_orders').update({ confirmed_at: now }).eq('id', order.id);
    stopAlert();
    setPendingOrders(prev => prev.filter(o => o.id !== order.id));
    setConfirmedOrders(prev => [{ ...order, confirmed_at: now }, ...prev]);
  };

  const deleteOrder = async (order: AnyOrder) => {
    const now = new Date().toISOString();
    await supabase.from('pickup_orders').update({ deleted_at: now }).eq('id', order.id);
    if (activeAlert?.id === order.id) stopAlert();
    setPendingOrders(prev => prev.filter(o => o.id !== order.id));
    setConfirmedOrders(prev => prev.filter(o => o.id !== order.id));
    setDeletedOrders(prev => [{ ...order, deleted_at: now }, ...prev]);
  };

  const recoverOrder = async (order: AnyOrder) => {
    await supabase.from('pickup_orders').update({ deleted_at: null }).eq('id', order.id);
    setDeletedOrders(prev => prev.filter(o => o.id !== order.id));
    const recovered = { ...order, deleted_at: null };
    if (order.confirmed_at) {
      setConfirmedOrders(prev => [recovered, ...prev]);
    } else {
      setPendingOrders(prev => [recovered, ...prev]);
    }
  };

  const deleteAllDeleted = async () => {
    if (!confirm('Permanently delete all recently deleted orders? This cannot be undone.')) return;
    for (const order of deletedOrders) {
      await supabase.from('pickup_orders').update({ status: 'deleted_permanently' }).eq('id', order.id);
    }
    setDeletedOrders([]);
  };

  const printOrder = (order: AnyOrder) => {
    const win = window.open('', '_blank');
    if (!win) { window.print(); return; }
    const o = order as any;
    const orderNum = order.id?.slice(-6).toUpperCase();
    win.document.write(`
      <html><head><title>Order #${orderNum}</title>
      <style>body{font-family:monospace;font-size:14px;padding:20px;max-width:400px;}.row{display:flex;justify-content:space-between;margin:4px 0;}.section{border-top:1px dashed #000;margin-top:10px;padding-top:10px;}.total{font-weight:bold;font-size:16px;}@media print{button{display:none;}}</style>
      </head><body>
      <h2 style="text-align:center">WALLYZ GRILL — ${account.location_name.toUpperCase()}</h2>
      <p style="text-align:center">ORDER #${orderNum} | 🥡 PICKUP</p>
      <p style="text-align:center">${new Date(order.created_at).toLocaleString()}</p>
      <div class="section">
        <div class="row"><span>Customer:</span><span>${o.customer_name}</span></div>
        <div class="row"><span>Phone:</span><span>${o.customer_phone}</span></div>
        <div class="row"><span>Pickup:</span><span>${o.pickup_time || 'ASAP'}</span></div>
      </div>
      <div class="section"><p><b>Items:</b></p>
        ${(o.order_items || []).map((item: any) => `
          <div class="row"><span>${item.quantity}x ${item.name}</span><span>$${(item.price * item.quantity).toFixed(2)}</span></div>
          ${item.customizations?.add?.length ? `<div style="font-size:12px;margin-left:8px">+ ${item.customizations.add.join(', ')}</div>` : ''}
          ${item.customizations?.remove?.length ? `<div style="font-size:12px;margin-left:8px">- ${item.customizations.remove.join(', ')}</div>` : ''}
        `).join('')}
      </div>
      ${o.special_instructions ? `<div class="section"><b>Notes:</b> ${o.special_instructions}</div>` : ''}
      <div class="section row total"><span>TOTAL:</span><span>$${Number(o.total_amount).toFixed(2)}</span></div>
      <script>window.onload=function(){window.print();window.close();}<\/script>
      </body></html>
    `);
    win.document.close();
  };

  const toggleExpand = (id: string) => {
    setExpandedOrders(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const renderCard = (order: AnyOrder, isConfirmed: boolean, isDeleted: boolean = false) => {
    const o = order as any;
    const isExpanded = expandedOrders.has(order.id);
    const orderNum = order.id?.slice(-6).toUpperCase();

    return (
      <div key={order.id} className={`bg-gray-900 rounded-xl border ${isDeleted ? 'border-red-900/50 opacity-75' : !isConfirmed ? 'border-orange-500' : 'border-gray-700'} overflow-hidden mb-4`}>
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400">#{orderNum}</span>
                {o.status === 'paid_clover_sync_failed' && <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">⚠ Manual Print</span>}
                {isConfirmed && !isDeleted && <span className="text-xs text-green-400 font-semibold">✓ Done</span>}
                {isDeleted && <span className="text-xs text-red-400 font-semibold flex items-center gap-1"><Trash2 size={10} /> Deleted</span>}
              </div>
              <h3 className="text-white font-bold text-lg">{o.customer_name}</h3>
              <p className="text-gray-400 text-sm flex items-center gap-1"><Phone size={12} /> {o.customer_phone}</p>
              <p className="text-gray-400 text-sm flex items-center gap-1 mt-1"><Clock size={12} /> Pickup: {o.pickup_time || 'ASAP'}</p>
            </div>
            <div className="text-right">
              <p className="text-orange-500 font-bold text-xl">${Number(o.total_amount).toFixed(2)}</p>
              <p className="text-gray-500 text-xs">{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>

          <button onClick={() => toggleExpand(order.id)} className="mt-3 text-sm text-gray-400 flex items-center gap-1 hover:text-white transition-colors">
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {isExpanded ? 'Hide items' : `Show ${(o.order_items || []).length} item(s)`}
          </button>

          {isExpanded && (
            <div className="mt-3 border-t border-gray-700 pt-3 space-y-2">
              {(o.order_items || []).map((item: any, i: number) => (
                <div key={i} className="text-sm">
                  <div className="flex justify-between text-white"><span>{item.quantity}x {item.name}</span><span>${(item.price * item.quantity).toFixed(2)}</span></div>
                  {item.customizations?.add?.length > 0 && <p className="text-green-400 text-xs ml-4">+ {item.customizations.add.join(', ')}</p>}
                  {item.customizations?.remove?.length > 0 && <p className="text-red-400 text-xs ml-4">- {item.customizations.remove.join(', ')}</p>}
                </div>
              ))}
              {o.special_instructions && (
                <div className="bg-yellow-500/10 rounded-lg p-2 text-yellow-300 text-sm">
                  <FileText size={12} className="inline mr-1" />{o.special_instructions}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex border-t border-gray-800">
          {isDeleted ? (
            <button onClick={() => recoverOrder(order)} className="flex-1 py-3 flex items-center justify-center gap-2 text-green-400 hover:bg-gray-800 transition-colors text-sm font-semibold">
              <RotateCcw size={16} /> Recover
            </button>
          ) : (
            <>
              <button onClick={() => printOrder(order)} className="flex-1 py-3 flex items-center justify-center gap-2 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors text-sm">
                <Printer size={16} /> Print
              </button>
              {!isConfirmed && (
                <button onClick={() => confirmOrder(order)} className="flex-1 py-3 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold transition-colors text-sm">
                  <Check size={16} /> Confirm
                </button>
              )}
              <button onClick={() => deleteOrder(order)} className="px-4 py-3 flex items-center justify-center text-gray-600 hover:text-red-400 hover:bg-gray-800 transition-colors">
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Full screen alert */}
      {activeAlert && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          style={{ backgroundColor: '#f97316', animation: 'bgpulse 1s infinite' }}>
          <style>{`@keyframes bgpulse { 0%,100%{background-color:#f97316} 50%{background-color:#c2540a} }`}</style>
          <div className="text-center p-8 max-w-lg w-full">
            <div className="text-8xl mb-4" style={{ animation: 'bounce 0.5s infinite alternate' }}>🔔</div>
            <style>{`@keyframes bounce { from{transform:scale(1)} to{transform:scale(1.2)} }`}</style>
            <h1 className="text-5xl font-black text-white mb-2">NEW ORDER!</h1>
            <p className="text-2xl text-orange-100 font-bold mb-1">#{activeAlert.id?.slice(-6).toUpperCase()}</p>
            <p className="text-2xl text-orange-100 font-bold mb-1">{activeAlert.customer_name}</p>
            <p className="text-xl text-orange-100 mb-1">📞 {activeAlert.customer_phone}</p>
            <p className="text-xl text-orange-100 mb-6">🕐 Pickup: {activeAlert.pickup_time || 'ASAP'}</p>
            <p className="text-4xl font-black text-white mb-8">${Number(activeAlert.total_amount).toFixed(2)}</p>
            <button onClick={() => confirmOrder(activeAlert)}
              className="bg-white text-orange-600 font-black text-2xl px-16 py-6 rounded-2xl shadow-2xl hover:bg-orange-50 transition-colors active:scale-95 w-full max-w-xs mx-auto block">
              ✓ CONFIRM ORDER
            </button>
            <p className="text-orange-200 text-sm mt-4">Tap to confirm and stop alert</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <UtensilsCrossed size={22} className="text-orange-500" />
          <div>
            <h1 className="font-bold text-white leading-tight">Wallyz Grill — {account.location_name}</h1>
            <p className="text-xs text-gray-400">@{account.username}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full">
            <Hash size={12} />
            <span className="text-sm font-bold">{orderCount} today</span>
          </div>
          <button onClick={onLogout} className="text-gray-400 hover:text-white transition-colors p-1">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 bg-black sticky top-14 z-10">
        <button onClick={() => setTab('pending')}
          className={`flex-1 py-3 font-semibold text-sm transition-colors flex items-center justify-center gap-1 ${tab === 'pending' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-gray-400'}`}>
          <ShoppingBag size={13} /> New
          {pendingOrders.length > 0 && <span className="bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full animate-pulse ml-1">{pendingOrders.length}</span>}
        </button>
        <button onClick={() => setTab('done')}
          className={`flex-1 py-3 font-semibold text-sm transition-colors flex items-center justify-center gap-1 ${tab === 'done' ? 'text-green-400 border-b-2 border-green-400' : 'text-gray-400'}`}>
          <Check size={13} /> Done
          {confirmedOrders.length > 0 && <span className="bg-gray-700 text-gray-300 text-xs px-1.5 py-0.5 rounded-full ml-1">{confirmedOrders.length}</span>}
        </button>
        <button onClick={() => setTab('deleted')}
          className={`flex-1 py-3 font-semibold text-sm transition-colors flex items-center justify-center gap-1 ${tab === 'deleted' ? 'text-red-400 border-b-2 border-red-400' : 'text-gray-400'}`}>
          <Trash2 size={13} /> Deleted
          {deletedOrders.length > 0 && <span className="bg-red-900/60 text-red-300 text-xs px-1.5 py-0.5 rounded-full ml-1">{deletedOrders.length}</span>}
        </button>
      </div>

      {/* Content */}
      <div className="p-4 pb-20">
        {tab === 'pending' && (
          pendingOrders.length === 0
            ? <div className="text-center text-gray-500 py-24"><ShoppingBag size={56} className="mx-auto mb-4 opacity-20" /><p className="text-lg font-semibold">No new orders</p><p className="text-sm mt-1">Orders appear here automatically when paid</p></div>
            : pendingOrders.map(o => renderCard(o, false))
        )}
        {tab === 'done' && (
          confirmedOrders.length === 0
            ? <div className="text-center text-gray-500 py-24"><Check size={56} className="mx-auto mb-4 opacity-20" /><p className="text-lg font-semibold">No completed orders yet</p></div>
            : confirmedOrders.map(o => renderCard(o, true))
        )}
        {tab === 'deleted' && (
          deletedOrders.length === 0
            ? <div className="text-center text-gray-500 py-24"><Trash2 size={56} className="mx-auto mb-4 opacity-20" /><p className="text-lg font-semibold">No deleted orders</p></div>
            : <>
                <div className="flex justify-end mb-4">
                  <button onClick={deleteAllDeleted} className="flex items-center gap-2 bg-red-900/40 hover:bg-red-900/70 text-red-400 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                    <AlertTriangle size={14} /> Delete All Permanently
                  </button>
                </div>
                {deletedOrders.map(o => renderCard(o, !!o.confirmed_at, true))}
              </>
        )}
      </div>
    </div>
  );
}

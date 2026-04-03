import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Printer, Check, LogOut, UtensilsCrossed, Clock, Phone, FileText, ChevronDown, ChevronUp, ShoppingBag, Coffee } from 'lucide-react';

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

interface PickupOrder {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  pickup_time: string;
  special_instructions: string;
  total_amount: number;
  order_items: any[];
  status: string;
  created_at: string;
  location_id: string;
  confirmed_at?: string;
  type: 'pickup';
}

interface CateringOrder {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  event_date: string;
  event_time: string;
  guest_count: number;
  special_requests: string;
  selected_trays: any[];
  total_amount: number;
  status: string;
  created_at: string;
  location_id: string;
  confirmed_at?: string;
  type: 'catering';
}

type AnyOrder = PickupOrder | CateringOrder;

export default function RestaurantDashboard({ account, onLogout }: RestaurantDashboardProps) {
  const [pickupOrders, setPickupOrders] = useState<PickupOrder[]>([]);
  const [cateringOrders, setCateringOrders] = useState<CateringOrder[]>([]);
  const [confirmedPickup, setConfirmedPickup] = useState<PickupOrder[]>([]);
  const [confirmedCatering, setConfirmedCatering] = useState<CateringOrder[]>([]);
  const [activeAlert, setActiveAlert] = useState<AnyOrder | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<'pickup' | 'catering' | 'confirmed'>('pickup');
  const audioIntervalRef = useRef<number | null>(null);
  const knownOrderIds = useRef<Set<string>>(new Set());

  const playAlertSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playBeep = (time: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, ctx.currentTime + time);
        gain.gain.setValueAtTime(0.3, ctx.currentTime + time);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + time + 0.3);
        osc.start(ctx.currentTime + time);
        osc.stop(ctx.currentTime + time + 0.3);
      };
      playBeep(0); playBeep(0.4); playBeep(0.8);
    } catch (e) { console.error('Audio error:', e); }
  }, []);

  const startAlert = useCallback((order: AnyOrder) => {
    setActiveAlert(order);
    playAlertSound();
    if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    audioIntervalRef.current = window.setInterval(playAlertSound, 3000);
  }, [playAlertSound]);

  const stopAlert = useCallback(() => {
    if (audioIntervalRef.current) { clearInterval(audioIntervalRef.current); audioIntervalRef.current = null; }
    setActiveAlert(null);
  }, []);

  const fetchOrders = useCallback(async () => {
    // Pickup orders — paid and unconfirmed
    const { data: pu } = await supabase
      .from('pickup_orders')
      .select('*')
      .eq('location_id', account.location_id)
      .eq('status', 'paid')
      .is('confirmed_at', null)
      .order('created_at', { ascending: false });

    // Confirmed pickup
    const { data: cpu } = await supabase
      .from('pickup_orders')
      .select('*')
      .eq('location_id', account.location_id)
      .eq('status', 'paid')
      .not('confirmed_at', 'is', null)
      .order('confirmed_at', { ascending: false })
      .limit(30);

    const newPickup = (pu || []).map(o => ({ ...o, type: 'pickup' as const }));
    const newPickupIds = newPickup.map(o => o.id);

    // Check for new pickup orders
    newPickup.forEach(o => {
      if (!knownOrderIds.current.has(o.id) && knownOrderIds.current.size > 0) {
        startAlert(o);
      }
      knownOrderIds.current.add(o.id);
    });

    setPickupOrders(newPickup);
    setConfirmedPickup((cpu || []).map(o => ({ ...o, type: 'pickup' as const })));

    // For catering — using pickup_orders with a note or separate table if exists
    // Try catering_orders table first, fallback gracefully
    try {
      const { data: cat } = await supabase
        .from('catering_orders')
        .select('*')
        .eq('location_id', account.location_id)
        .is('confirmed_at', null)
        .order('created_at', { ascending: false });

      const { data: ccat } = await supabase
        .from('catering_orders')
        .select('*')
        .eq('location_id', account.location_id)
        .not('confirmed_at', 'is', null)
        .order('confirmed_at', { ascending: false })
        .limit(30);

      const newCatering = (cat || []).map(o => ({ ...o, type: 'catering' as const }));
      newCatering.forEach(o => {
        if (!knownOrderIds.current.has(o.id) && knownOrderIds.current.size > 0) {
          startAlert(o);
        }
        knownOrderIds.current.add(o.id);
      });

      setCateringOrders(newCatering);
      setConfirmedCatering((ccat || []).map(o => ({ ...o, type: 'catering' as const })));
    } catch (e) {
      // catering_orders table may not exist yet
    }
  }, [account.location_id, startAlert]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 8000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Realtime
  useEffect(() => {
    const channel = supabase.channel('restaurant-realtime')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'pickup_orders',
        filter: `location_id=eq.${account.location_id}`,
      }, (payload) => {
        if (payload.new.status === 'paid' && !knownOrderIds.current.has(payload.new.id)) {
          const order = { ...payload.new, type: 'pickup' as const };
          knownOrderIds.current.add(order.id);
          setPickupOrders(prev => [order, ...prev]);
          startAlert(order);
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'pickup_orders',
        filter: `location_id=eq.${account.location_id}`,
      }, (payload) => {
        if (payload.new.status === 'paid' && !payload.new.confirmed_at && !knownOrderIds.current.has(payload.new.id)) {
          const order = { ...payload.new, type: 'pickup' as const };
          knownOrderIds.current.add(order.id);
          setPickupOrders(prev => prev.find(o => o.id === order.id) ? prev : [order, ...prev]);
          startAlert(order);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [account.location_id, startAlert]);

  const confirmOrder = async (order: AnyOrder) => {
    const table = order.type === 'pickup' ? 'pickup_orders' : 'catering_orders';
    await supabase.from(table).update({ confirmed_at: new Date().toISOString() }).eq('id', order.id);
    stopAlert();
    if (order.type === 'pickup') {
      setPickupOrders(prev => prev.filter(o => o.id !== order.id));
      setConfirmedPickup(prev => [{ ...order as PickupOrder, confirmed_at: new Date().toISOString() }, ...prev]);
    } else {
      setCateringOrders(prev => prev.filter(o => o.id !== order.id));
      setConfirmedCatering(prev => [{ ...order as CateringOrder, confirmed_at: new Date().toISOString() }, ...prev]);
    }
  };

  const printOrder = (order: AnyOrder) => {
    const win = window.open('', '_blank');
    if (!win) { window.print(); return; }
    const isPickup = order.type === 'pickup';
    const o = order as any;
    win.document.write(`
      <html><head><title>Order</title>
      <style>
        body{font-family:monospace;font-size:14px;padding:20px;max-width:400px;}
        h1{font-size:18px;text-align:center;border-bottom:2px solid #000;padding-bottom:10px;}
        .row{display:flex;justify-content:space-between;margin:4px 0;}
        .section{border-top:1px dashed #000;margin-top:10px;padding-top:10px;}
        .total{font-weight:bold;font-size:16px;}
        @media print{button{display:none;}}
      </style></head><body>
      <h1>WALLYZ GRILL - ${account.location_name.toUpperCase()}</h1>
      <p style="text-align:center">${isPickup ? '🥡 PICKUP ORDER' : '🎉 PARTY TRAY ORDER'}</p>
      <p style="text-align:center">${new Date(order.created_at).toLocaleString()}</p>
      <div class="section">
        <div class="row"><span>Customer:</span><span>${o.customer_name}</span></div>
        <div class="row"><span>Phone:</span><span>${o.customer_phone}</span></div>
        ${isPickup ? `<div class="row"><span>Pickup:</span><span>${o.pickup_time || 'ASAP'}</span></div>` : ''}
        ${!isPickup ? `<div class="row"><span>Event:</span><span>${o.event_date} ${o.event_time}</span></div><div class="row"><span>Guests:</span><span>${o.guest_count}</span></div>` : ''}
      </div>
      <div class="section">
        <p><strong>Items:</strong></p>
        ${isPickup
          ? (o.order_items || []).map((item: any) => `
            <div class="row"><span>${item.quantity}x ${item.name}</span><span>$${(item.price * item.quantity).toFixed(2)}</span></div>
            ${item.customizations?.add?.length ? `<div style="font-size:12px;color:#555">+ ${item.customizations.add.join(', ')}</div>` : ''}
            ${item.customizations?.remove?.length ? `<div style="font-size:12px;color:#555">- ${item.customizations.remove.join(', ')}</div>` : ''}
          `).join('')
          : (o.selected_trays || []).map((tray: any) => `
            <div class="row"><span>${tray.quantity}x ${tray.name}</span><span>$${(tray.price * tray.quantity).toFixed(2)}</span></div>
          `).join('')
        }
      </div>
      ${o.special_instructions || o.special_requests ? `<div class="section"><p><strong>Notes:</strong> ${o.special_instructions || o.special_requests}</p></div>` : ''}
      <div class="section row total"><span>TOTAL:</span><span>$${Number(o.total_amount).toFixed(2)}</span></div>
      <script>window.onload=function(){window.print();window.close();}<\/script>
      </body></html>
    `);
    win.document.close();
  };

  const toggleExpand = (id: string) => {
    setExpandedOrders(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const renderCard = (order: AnyOrder, isConfirmed: boolean) => {
    const isPickup = order.type === 'pickup';
    const o = order as any;
    const isExpanded = expandedOrders.has(order.id);

    return (
      <div key={order.id} className={`bg-gray-900 rounded-xl border ${!isConfirmed ? 'border-orange-500' : 'border-gray-700'} overflow-hidden mb-4`}>
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isPickup ? 'bg-orange-500/20 text-orange-400' : 'bg-purple-500/20 text-purple-400'}`}>
                  {isPickup ? '🥡 Pickup' : '🎉 Party Tray'}
                </span>
                {isConfirmed && <span className="text-xs text-green-400 font-semibold">✓ Confirmed</span>}
              </div>
              <h3 className="text-white font-bold text-lg">{o.customer_name}</h3>
              <p className="text-gray-400 text-sm flex items-center gap-1"><Phone size={12} /> {o.customer_phone}</p>
              <p className="text-gray-400 text-sm flex items-center gap-1 mt-1">
                <Clock size={12} />
                {isPickup ? `Pickup: ${o.pickup_time || 'ASAP'}` : `Event: ${o.event_date} at ${o.event_time}`}
              </p>
            </div>
            <div className="text-right">
              <p className="text-orange-500 font-bold text-xl">${Number(o.total_amount).toFixed(2)}</p>
              <p className="text-gray-500 text-xs">{new Date(order.created_at).toLocaleTimeString()}</p>
            </div>
          </div>
          <button onClick={() => toggleExpand(order.id)} className="mt-3 text-sm text-gray-400 flex items-center gap-1 hover:text-white transition-colors">
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {isExpanded ? 'Hide details' : 'Show details'}
          </button>
          {isExpanded && (
            <div className="mt-3 border-t border-gray-700 pt-3 space-y-2">
              {isPickup && (o.order_items || []).map((item: any, i: number) => (
                <div key={i} className="text-sm">
                  <div className="flex justify-between text-white"><span>{item.quantity}x {item.name}</span><span>${(item.price * item.quantity).toFixed(2)}</span></div>
                  {item.customizations?.add?.length > 0 && <p className="text-green-400 text-xs ml-4">+ {item.customizations.add.join(', ')}</p>}
                  {item.customizations?.remove?.length > 0 && <p className="text-red-400 text-xs ml-4">- {item.customizations.remove.join(', ')}</p>}
                </div>
              ))}
              {!isPickup && (o.selected_trays || []).map((tray: any, i: number) => (
                <div key={i} className="flex justify-between text-sm text-white"><span>{tray.quantity}x {tray.name}</span><span>${(tray.price * tray.quantity).toFixed(2)}</span></div>
              ))}
              {(o.special_instructions || o.special_requests) && (
                <div className="bg-yellow-500/10 rounded-lg p-2 text-yellow-300 text-sm">
                  <FileText size={12} className="inline mr-1" />{o.special_instructions || o.special_requests}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex border-t border-gray-800">
          <button onClick={() => printOrder(order)} className="flex-1 py-3 flex items-center justify-center gap-2 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors text-sm">
            <Printer size={16} /> Print
          </button>
          {!isConfirmed && (
            <button onClick={() => confirmOrder(order)} className="flex-1 py-3 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold transition-colors text-sm">
              <Check size={16} /> Confirm
            </button>
          )}
        </div>
      </div>
    );
  };

  const pendingCount = pickupOrders.length + cateringOrders.length;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Full screen alert overlay */}
      {activeAlert && (
        <div className="fixed inset-0 z-50 bg-orange-500 flex flex-col items-center justify-center"
          style={{ animation: 'pulse 1s infinite' }}>
          <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.85} }`}</style>
          <div className="text-center p-8 max-w-lg">
            <div className="text-8xl mb-6">{activeAlert.type === 'pickup' ? '🥡' : '🎉'}</div>
            <h1 className="text-5xl font-black text-white mb-4">NEW ORDER!</h1>
            <p className="text-2xl text-orange-100 mb-2 font-bold">{(activeAlert as any).customer_name}</p>
            <p className="text-xl text-orange-100 mb-2">{activeAlert.type === 'pickup' ? 'Pickup Order' : 'Party Tray Order'}</p>
            <p className="text-3xl font-bold text-white mb-8">${Number((activeAlert as any).total_amount).toFixed(2)}</p>
            <button onClick={() => confirmOrder(activeAlert)}
              className="bg-white text-orange-600 font-black text-2xl px-16 py-6 rounded-2xl shadow-2xl hover:bg-orange-50 transition-colors active:scale-95">
              ✓ CONFIRM ORDER
            </button>
            <p className="text-orange-200 text-sm mt-4">Tap to confirm and stop alert</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <UtensilsCrossed size={24} className="text-orange-500" />
          <div>
            <h1 className="font-bold text-white">Wallyz Grill</h1>
            <p className="text-xs text-orange-400">{account.location_name}</p>
          </div>
        </div>
        <button onClick={onLogout} className="text-gray-400 hover:text-white flex items-center gap-1 text-sm">
          <LogOut size={16} /> Sign Out
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 sticky top-14 z-10 bg-black">
        <button onClick={() => setTab('pickup')}
          className={`flex-1 py-3 font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${tab === 'pickup' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-gray-400'}`}>
          <ShoppingBag size={14} /> Pickup
          {pickupOrders.length > 0 && <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">{pickupOrders.length}</span>}
        </button>
        <button onClick={() => setTab('catering')}
          className={`flex-1 py-3 font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${tab === 'catering' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400'}`}>
          <Coffee size={14} /> Party Trays
          {cateringOrders.length > 0 && <span className="bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full">{cateringOrders.length}</span>}
        </button>
        <button onClick={() => setTab('confirmed')}
          className={`flex-1 py-3 font-semibold text-sm transition-colors ${tab === 'confirmed' ? 'text-green-400 border-b-2 border-green-400' : 'text-gray-400'}`}>
          ✓ Confirmed
        </button>
      </div>

      {/* Content */}
      <div className="p-4 pb-20">
        {tab === 'pickup' && (
          pickupOrders.length === 0
            ? <div className="text-center text-gray-500 py-20"><ShoppingBag size={48} className="mx-auto mb-4 opacity-30" /><p>No pending pickup orders</p></div>
            : pickupOrders.map(o => renderCard(o, false))
        )}
        {tab === 'catering' && (
          cateringOrders.length === 0
            ? <div className="text-center text-gray-500 py-20"><Coffee size={48} className="mx-auto mb-4 opacity-30" /><p>No pending party tray orders</p></div>
            : cateringOrders.map(o => renderCard(o, false))
        )}
        {tab === 'confirmed' && (
          <>
            {confirmedPickup.length === 0 && confirmedCatering.length === 0
              ? <div className="text-center text-gray-500 py-20"><Check size={48} className="mx-auto mb-4 opacity-30" /><p>No confirmed orders today</p></div>
              : <>
                  {confirmedPickup.length > 0 && <p className="text-gray-500 text-xs font-semibold mb-2 uppercase tracking-wider">Pickup</p>}
                  {confirmedPickup.map(o => renderCard(o, true))}
                  {confirmedCatering.length > 0 && <p className="text-gray-500 text-xs font-semibold mb-2 mt-4 uppercase tracking-wider">Party Trays</p>}
                  {confirmedCatering.map(o => renderCard(o, true))}
                </>
            }
          </>
        )}
      </div>
    </div>
  );
}

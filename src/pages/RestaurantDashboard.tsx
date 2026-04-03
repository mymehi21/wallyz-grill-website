import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Printer, Check, LogOut, UtensilsCrossed, Clock, Phone, FileText, ChevronDown, ChevronUp, ShoppingBag, Coffee, Hash } from 'lucide-react';

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

export default function RestaurantDashboard({ account, onLogout }: RestaurantDashboardProps) {
  const [pickupOrders, setPickupOrders] = useState<AnyOrder[]>([]);
  const [confirmedOrders, setConfirmedOrders] = useState<AnyOrder[]>([]);
  const [activeAlert, setActiveAlert] = useState<AnyOrder | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<'pending' | 'done'>('pending');
  const [orderCount, setOrderCount] = useState(0);
  const audioIntervalRef = useRef<number | null>(null);
  const knownOrderIds = useRef<Set<string>>(new Set());
  const isFirstLoad = useRef(true);

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
    // Fetch paid unconfirmed orders — handle confirmed_at not existing gracefully
    const { data: pending, error } = await supabase
      .from('pickup_orders')
      .select('*')
      .eq('location_id', account.location_id)
      .in('status', ['paid', 'paid_clover_sync_failed'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      return;
    }

    const allOrders = (pending || []);

    // Split into pending (no confirmed_at) and confirmed
    const pendingList = allOrders.filter(o => !o.confirmed_at);
    const confirmedList = allOrders.filter(o => o.confirmed_at);

    // Detect new orders on subsequent fetches
    if (!isFirstLoad.current) {
      pendingList.forEach(order => {
        if (!knownOrderIds.current.has(order.id)) {
          knownOrderIds.current.add(order.id);
          startAlert(order);
        }
      });
    } else {
      // First load — just record existing IDs, don't alert
      pendingList.forEach(o => knownOrderIds.current.add(o.id));
      isFirstLoad.current = false;
    }

    setPickupOrders(pendingList);
    setConfirmedOrders(confirmedList);

    // Count all orders today for this location
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count } = await supabase
      .from('pickup_orders')
      .select('id', { count: 'exact', head: true })
      .eq('location_id', account.location_id)
      .in('status', ['paid', 'paid_clover_sync_failed'])
      .gte('created_at', today.toISOString());

    setOrderCount(count || 0);
  }, [account.location_id, startAlert]);

  useEffect(() => {
    fetchOrders();
    // Poll every 15 seconds as backup
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Realtime subscription — listen for BOTH insert and update
  useEffect(() => {
    const channel = supabase.channel(`restaurant-${account.location_id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'pickup_orders',
        filter: `location_id=eq.${account.location_id}`,
      }, (payload) => {
        const order = payload.new;
        if (['paid', 'paid_clover_sync_failed'].includes(order.status) && !order.confirmed_at) {
          if (!knownOrderIds.current.has(order.id)) {
            knownOrderIds.current.add(order.id);
            setPickupOrders(prev => [order, ...prev]);
            startAlert(order);
          }
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'pickup_orders',
        filter: `location_id=eq.${account.location_id}`,
      }, (payload) => {
        const order = payload.new;
        // Order just became paid
        if (['paid', 'paid_clover_sync_failed'].includes(order.status) && !order.confirmed_at) {
          if (!knownOrderIds.current.has(order.id)) {
            knownOrderIds.current.add(order.id);
            setPickupOrders(prev => {
              if (prev.find(o => o.id === order.id)) return prev;
              return [order, ...prev];
            });
            startAlert(order);
          }
        }
        // Order was confirmed
        if (order.confirmed_at) {
          setPickupOrders(prev => prev.filter(o => o.id !== order.id));
          setConfirmedOrders(prev => {
            if (prev.find(o => o.id === order.id)) return prev;
            return [order, ...prev];
          });
        }
      })
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => { supabase.removeChannel(channel); };
  }, [account.location_id, startAlert]);

  const confirmOrder = async (order: AnyOrder) => {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('pickup_orders')
      .update({ confirmed_at: now })
      .eq('id', order.id);

    if (error) {
      console.error('Error confirming order:', error);
      return;
    }

    stopAlert();
    setPickupOrders(prev => prev.filter(o => o.id !== order.id));
    setConfirmedOrders(prev => [{ ...order, confirmed_at: now }, ...prev]);
    setOrderCount(prev => prev); // already counted
  };

  const printOrder = (order: AnyOrder) => {
    const win = window.open('', '_blank');
    if (!win) { window.print(); return; }
    const o = order as any;
    win.document.write(`
      <html><head><title>Order #${o.id?.slice(-6).toUpperCase()}</title>
      <style>
        body{font-family:monospace;font-size:14px;padding:20px;max-width:400px;}
        h1{font-size:18px;text-align:center;border-bottom:2px solid #000;padding-bottom:10px;}
        .row{display:flex;justify-content:space-between;margin:4px 0;}
        .section{border-top:1px dashed #000;margin-top:10px;padding-top:10px;}
        .total{font-weight:bold;font-size:16px;}
        @media print{button{display:none;}}
      </style></head><body>
      <h1>WALLYZ GRILL - ${account.location_name.toUpperCase()}</h1>
      <p style="text-align:center">ORDER #${o.id?.slice(-6).toUpperCase()}</p>
      <p style="text-align:center">🥡 PICKUP ORDER</p>
      <p style="text-align:center">${new Date(order.created_at).toLocaleString()}</p>
      <div class="section">
        <div class="row"><span>Customer:</span><span>${o.customer_name}</span></div>
        <div class="row"><span>Phone:</span><span>${o.customer_phone}</span></div>
        <div class="row"><span>Pickup:</span><span>${o.pickup_time || 'ASAP'}</span></div>
      </div>
      <div class="section">
        <p><strong>Items:</strong></p>
        ${(o.order_items || []).map((item: any) => `
          <div class="row"><span>${item.quantity}x ${item.name}</span><span>$${(item.price * item.quantity).toFixed(2)}</span></div>
          ${item.customizations?.add?.length ? `<div style="font-size:12px;color:#555">+ ${item.customizations.add.join(', ')}</div>` : ''}
          ${item.customizations?.remove?.length ? `<div style="font-size:12px;color:#555">- ${item.customizations.remove.join(', ')}</div>` : ''}
        `).join('')}
      </div>
      ${o.special_instructions ? `<div class="section"><p><strong>Notes:</strong> ${o.special_instructions}</p></div>` : ''}
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
    const o = order as any;
    const isExpanded = expandedOrders.has(order.id);
    const orderNum = order.id?.slice(-6).toUpperCase();

    return (
      <div key={order.id} className={`bg-gray-900 rounded-xl border ${!isConfirmed ? 'border-orange-500' : 'border-gray-700'} overflow-hidden mb-4`}>
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400">
                  🥡 #{orderNum}
                </span>
                {o.status === 'paid_clover_sync_failed' && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">⚠ Manual Print</span>
                )}
                {isConfirmed && <span className="text-xs text-green-400 font-semibold">✓ Done</span>}
              </div>
              <h3 className="text-white font-bold text-lg">{o.customer_name}</h3>
              <p className="text-gray-400 text-sm flex items-center gap-1"><Phone size={12} /> {o.customer_phone}</p>
              <p className="text-gray-400 text-sm flex items-center gap-1 mt-1">
                <Clock size={12} /> Pickup: {o.pickup_time || 'ASAP'}
              </p>
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

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Full screen alert */}
      {activeAlert && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          style={{ backgroundColor: '#f97316', animation: 'bgpulse 1s infinite' }}>
          <style>{`@keyframes bgpulse { 0%,100%{background-color:#f97316} 50%{background-color:#ea6c0a} }`}</style>
          <div className="text-center p-8 max-w-lg w-full">
            <div className="text-8xl mb-4">🔔</div>
            <h1 className="text-5xl font-black text-white mb-2">NEW ORDER!</h1>
            <p className="text-2xl text-orange-100 font-bold mb-1">#{activeAlert.id?.slice(-6).toUpperCase()}</p>
            <p className="text-2xl text-orange-100 font-bold mb-1">{activeAlert.customer_name}</p>
            <p className="text-xl text-orange-100 mb-1">📞 {activeAlert.customer_phone}</p>
            <p className="text-xl text-orange-100 mb-6">Pickup: {activeAlert.pickup_time || 'ASAP'}</p>
            <p className="text-4xl font-black text-white mb-8">${Number(activeAlert.total_amount).toFixed(2)}</p>
            <button onClick={() => confirmOrder(activeAlert)}
              className="bg-white text-orange-600 font-black text-2xl px-16 py-6 rounded-2xl shadow-2xl hover:bg-orange-50 transition-colors active:scale-95 w-full max-w-xs">
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
          <button onClick={onLogout} className="text-gray-400 hover:text-white transition-colors">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 bg-black sticky top-14 z-10">
        <button onClick={() => setTab('pending')}
          className={`flex-1 py-3 font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${tab === 'pending' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-gray-400'}`}>
          <ShoppingBag size={14} />
          New Orders
          {pickupOrders.length > 0 && (
            <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">{pickupOrders.length}</span>
          )}
        </button>
        <button onClick={() => setTab('done')}
          className={`flex-1 py-3 font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${tab === 'done' ? 'text-green-400 border-b-2 border-green-400' : 'text-gray-400'}`}>
          <Check size={14} />
          Done Today
          {confirmedOrders.length > 0 && (
            <span className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded-full">{confirmedOrders.length}</span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="p-4 pb-20">
        {tab === 'pending' && (
          pickupOrders.length === 0
            ? (
              <div className="text-center text-gray-500 py-24">
                <ShoppingBag size={56} className="mx-auto mb-4 opacity-20" />
                <p className="text-lg font-semibold">No new orders</p>
                <p className="text-sm mt-1">Orders will appear here automatically when paid</p>
              </div>
            )
            : pickupOrders.map(o => renderCard(o, false))
        )}
        {tab === 'done' && (
          confirmedOrders.length === 0
            ? (
              <div className="text-center text-gray-500 py-24">
                <Check size={56} className="mx-auto mb-4 opacity-20" />
                <p className="text-lg font-semibold">No completed orders yet</p>
              </div>
            )
            : confirmedOrders.map(o => renderCard(o, true))
        )}
      </div>
    </div>
  );
}

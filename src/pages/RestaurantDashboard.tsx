import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Printer, Check, LogOut, UtensilsCrossed, Clock, Phone, User, FileText, ChevronDown, ChevronUp } from 'lucide-react';

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

interface Order {
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
}

type AnyOrder = (Order & { type: 'pickup' }) | (CateringOrder & { type: 'catering' });

export default function RestaurantDashboard({ account, onLogout }: RestaurantDashboardProps) {
  const [pendingOrders, setPendingOrders] = useState<AnyOrder[]>([]);
  const [confirmedOrders, setConfirmedOrders] = useState<AnyOrder[]>([]);
  const [activeAlert, setActiveAlert] = useState<AnyOrder | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<'pending' | 'confirmed'>('pending');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioIntervalRef = useRef<number | null>(null);
  const knownOrderIds = useRef<Set<string>>(new Set());

  // DoorDash-style multi-tone chime using Web Audio API
  const playAlertSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

      const playTone = (freq: number, startTime: number, duration: number, vol: number = 0.5) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const compressor = ctx.createDynamicsCompressor();
        osc.connect(gain);
        gain.connect(compressor);
        compressor.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(vol, startTime + 0.02);
        gain.gain.setValueAtTime(vol, startTime + duration - 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      // Upbeat 4-note chime: D5 → F#5 → A5 → D6
      const t = ctx.currentTime;
      playTone(587.3,  t,        0.18, 0.45); // D5
      playTone(739.9,  t + 0.18, 0.18, 0.45); // F#5
      playTone(880.0,  t + 0.36, 0.18, 0.45); // A5
      playTone(1174.7, t + 0.54, 0.35, 0.55); // D6 (held longer)
    } catch (e) {
      console.error('Audio error:', e);
    }
  }, []);

  const startAlert = useCallback((order: AnyOrder) => {
    setActiveAlert(order);
    playAlertSound();
    audioIntervalRef.current = window.setInterval(() => {
      playAlertSound();
    }, 3000);
  }, [playAlertSound]);

  const stopAlert = useCallback(() => {
    if (audioIntervalRef.current) {
      clearInterval(audioIntervalRef.current);
      audioIntervalRef.current = null;
    }
    setActiveAlert(null);
  }, []);

  const fetchOrders = useCallback(async () => {
    // Fetch pickup orders
    const { data: pickupData } = await supabase
      .from('pickup_orders')
      .select('*')
      .eq('location_id', account.location_id)
      .eq('status', 'paid')
      .is('confirmed_at', null)
      .order('created_at', { ascending: false });

    // Fetch catering orders
    const { data: cateringData } = await supabase
      .from('catering_orders')
      .select('*')
      .eq('location_id', account.location_id)
      .is('confirmed_at', null)
      .order('created_at', { ascending: false });

    const pickupOrders: AnyOrder[] = (pickupData || []).map(o => ({ ...o, type: 'pickup' as const }));
    const cateringOrders: AnyOrder[] = (cateringData || []).map(o => ({ ...o, type: 'catering' as const }));
    const allPending = [...pickupOrders, ...cateringOrders].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Check for new orders
    const newOrders = allPending.filter(o => !knownOrderIds.current.has(o.id));
    if (newOrders.length > 0 && knownOrderIds.current.size > 0) {
      // New order arrived — trigger alert
      if (!activeAlert) {
        startAlert(newOrders[0]);
      }
    }

    // Update known IDs
    allPending.forEach(o => knownOrderIds.current.add(o.id));
    setPendingOrders(allPending);

    // Fetch confirmed orders
    const { data: confirmedPickup } = await supabase
      .from('pickup_orders')
      .select('*')
      .eq('location_id', account.location_id)
      .eq('status', 'paid')
      .not('confirmed_at', 'is', null)
      .order('confirmed_at', { ascending: false })
      .limit(50);

    const { data: confirmedCatering } = await supabase
      .from('catering_orders')
      .select('*')
      .eq('location_id', account.location_id)
      .not('confirmed_at', 'is', null)
      .order('confirmed_at', { ascending: false })
      .limit(50);

    const allConfirmed: AnyOrder[] = [
      ...(confirmedPickup || []).map(o => ({ ...o, type: 'pickup' as const })),
      ...(confirmedCatering || []).map(o => ({ ...o, type: 'catering' as const })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setConfirmedOrders(allConfirmed);
  }, [account.location_id, activeAlert, startAlert]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('restaurant-orders')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'pickup_orders',
        filter: `location_id=eq.${account.location_id}`,
      }, (payload) => {
        if (payload.new.status === 'paid') {
          const newOrder = { ...payload.new, type: 'pickup' as const };
          if (!knownOrderIds.current.has(newOrder.id)) {
            knownOrderIds.current.add(newOrder.id);
            setPendingOrders(prev => [newOrder, ...prev]);
            startAlert(newOrder);
          }
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'pickup_orders',
        filter: `location_id=eq.${account.location_id}`,
      }, (payload) => {
        if (payload.new.status === 'paid' && !payload.new.confirmed_at) {
          const newOrder = { ...payload.new, type: 'pickup' as const };
          if (!knownOrderIds.current.has(newOrder.id)) {
            knownOrderIds.current.add(newOrder.id);
            setPendingOrders(prev => {
              if (prev.find(o => o.id === newOrder.id)) return prev;
              return [newOrder, ...prev];
            });
            startAlert(newOrder);
          }
        }
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'catering_orders',
        filter: `location_id=eq.${account.location_id}`,
      }, (payload) => {
        const newOrder = { ...payload.new, type: 'catering' as const };
        if (!knownOrderIds.current.has(newOrder.id)) {
          knownOrderIds.current.add(newOrder.id);
          setPendingOrders(prev => [newOrder, ...prev]);
          startAlert(newOrder);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [account.location_id, startAlert]);

  const confirmOrder = async (order: AnyOrder) => {
    const table = order.type === 'pickup' ? 'pickup_orders' : 'catering_orders';
    await supabase.from(table).update({ confirmed_at: new Date().toISOString() }).eq('id', order.id);
    stopAlert();
    setPendingOrders(prev => prev.filter(o => o.id !== order.id));
    setConfirmedOrders(prev => [{ ...order, confirmed_at: new Date().toISOString() }, ...prev]);
    setTab('pending');
    fetchOrders();
  };

  const printOrder = (order: AnyOrder) => {
    const win = window.open('', '_blank');
    if (!win) return;

    const isPickup = order.type === 'pickup';
    const o = order as any;

    win.document.write(`
      <html><head><title>Order</title>
      <style>
        body { font-family: monospace; font-size: 14px; padding: 20px; max-width: 400px; }
        h1 { font-size: 18px; text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; }
        .row { display: flex; justify-content: space-between; margin: 4px 0; }
        .section { border-top: 1px dashed #000; margin-top: 10px; padding-top: 10px; }
        .total { font-weight: bold; font-size: 16px; }
        @media print { button { display: none; } }
      </style></head><body>
      <h1>WALLYZ GRILL - ${account.location_name.toUpperCase()}</h1>
      <p style="text-align:center">${isPickup ? '🥡 PICKUP ORDER' : '🎉 CATERING ORDER'}</p>
      <p style="text-align:center">${new Date(order.created_at).toLocaleString()}</p>
      <div class="section">
        <div class="row"><span>Customer:</span><span>${o.customer_name}</span></div>
        <div class="row"><span>Phone:</span><span>${o.customer_phone}</span></div>
        ${isPickup ? `<div class="row"><span>Pickup:</span><span>${o.pickup_time || 'ASAP'}</span></div>` : ''}
        ${!isPickup ? `<div class="row"><span>Event:</span><span>${o.event_date} ${o.event_time}</span></div>` : ''}
        ${!isPickup ? `<div class="row"><span>Guests:</span><span>${o.guest_count}</span></div>` : ''}
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
      ${o.special_instructions || o.special_requests ? `
        <div class="section"><p><strong>Notes:</strong> ${o.special_instructions || o.special_requests}</p></div>
      ` : ''}
      <div class="section row total"><span>TOTAL:</span><span>$${Number(o.total_amount).toFixed(2)}</span></div>
      <script>window.print(); window.close();</script>
      </body></html>
    `);
    win.document.close();
  };

  const toggleExpand = (id: string) => {
    setExpandedOrders(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const renderOrderCard = (order: AnyOrder, isPending: boolean) => {
    const isPickup = order.type === 'pickup';
    const o = order as any;
    const isExpanded = expandedOrders.has(order.id);

    return (
      <div key={order.id} className={`bg-gray-900 rounded-xl border ${isPending ? 'border-orange-500' : 'border-gray-700'} overflow-hidden`}>
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isPickup ? 'bg-orange-500/20 text-orange-400' : 'bg-purple-500/20 text-purple-400'}`}>
                  {isPickup ? '🥡 Pickup' : '🎉 Catering'}
                </span>
                {!isPending && <span className="text-xs text-green-400 font-semibold">✓ Confirmed</span>}
              </div>
              <h3 className="text-white font-bold text-lg">{o.customer_name}</h3>
              <p className="text-gray-400 text-sm flex items-center gap-1">
                <Phone size={12} /> {o.customer_phone}
              </p>
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
                  <div className="flex justify-between text-white">
                    <span>{item.quantity}x {item.name}</span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                  {item.customizations?.add?.length > 0 && (
                    <p className="text-green-400 text-xs ml-4">+ {item.customizations.add.join(', ')}</p>
                  )}
                  {item.customizations?.remove?.length > 0 && (
                    <p className="text-red-400 text-xs ml-4">- {item.customizations.remove.join(', ')}</p>
                  )}
                </div>
              ))}
              {!isPickup && (o.selected_trays || []).map((tray: any, i: number) => (
                <div key={i} className="flex justify-between text-sm text-white">
                  <span>{tray.quantity}x {tray.name}</span>
                  <span>${(tray.price * tray.quantity).toFixed(2)}</span>
                </div>
              ))}
              {(o.special_instructions || o.special_requests) && (
                <div className="bg-yellow-500/10 rounded-lg p-2 text-yellow-300 text-sm">
                  <FileText size={12} className="inline mr-1" />
                  {o.special_instructions || o.special_requests}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex border-t border-gray-800">
          <button onClick={() => printOrder(order)} className="flex-1 py-3 flex items-center justify-center gap-2 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors text-sm">
            <Printer size={16} /> Print
          </button>
          {isPending && (
            <button onClick={() => confirmOrder(order)} className="flex-1 py-3 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold transition-colors text-sm">
              <Check size={16} /> Confirm Order
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Alert Overlay — fullscreen, shows all order details, must confirm to dismiss */}
      {activeAlert && (() => {
        const al = activeAlert as any;
        const isPickup = activeAlert.type === 'pickup';
        const items = isPickup ? (al.order_items || []) : (al.selected_trays || []);
        return (
          <div className="fixed inset-0 z-50 bg-orange-500 flex flex-col overflow-y-auto">
            {/* Pulsing top banner */}
            <div className="bg-red-600 animate-pulse text-white text-center py-3 font-black text-lg tracking-widest shrink-0">
              🔔 NEW ORDER — TAP BELOW TO CONFIRM 🔔
            </div>

            <div className="flex-1 flex flex-col items-center justify-start px-4 py-6 gap-4 w-full max-w-lg mx-auto">
              {/* Order type badge */}
              <div className="bg-white/20 rounded-2xl px-6 py-2 text-white font-bold text-xl">
                {isPickup ? '🥡 PICKUP ORDER' : '🎉 CATERING ORDER'}
              </div>

              {/* Customer info card */}
              <div className="w-full bg-white/20 rounded-2xl p-5 text-white">
                <p className="text-3xl font-black mb-1">{al.customer_name}</p>
                <p className="text-lg opacity-90 mb-1">📞 {al.customer_phone}</p>
                {isPickup && (
                  <p className="text-lg font-semibold">
                    🕐 Pickup: <span className="font-black">{al.pickup_time || 'ASAP'}</span>
                  </p>
                )}
                {!isPickup && (
                  <p className="text-lg font-semibold">
                    📅 Event: <span className="font-black">{al.event_date} at {al.event_time}</span>
                    {al.guest_count && <span className="ml-2">· {al.guest_count} guests</span>}
                  </p>
                )}
              </div>

              {/* Items list */}
              <div className="w-full bg-white/20 rounded-2xl p-5 text-white">
                <p className="font-black text-lg mb-3 border-b border-white/30 pb-2">ORDER ITEMS</p>
                <div className="space-y-3">
                  {items.map((item: any, i: number) => (
                    <div key={i}>
                      <div className="flex justify-between items-start font-bold text-base">
                        <span>{item.quantity}x {item.name}</span>
                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                      {item.customizations?.add?.length > 0 && (
                        <p className="text-green-200 text-sm ml-3">+ {item.customizations.add.join(', ')}</p>
                      )}
                      {item.customizations?.remove?.length > 0 && (
                        <p className="text-red-200 text-sm ml-3">− {item.customizations.remove.join(', ')}</p>
                      )}
                    </div>
                  ))}
                </div>
                {(al.special_instructions || al.special_requests) && (
                  <div className="mt-3 pt-3 border-t border-white/30">
                    <p className="font-bold text-yellow-200 text-sm">📝 Note: {al.special_instructions || al.special_requests}</p>
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="w-full bg-white rounded-2xl p-4 flex justify-between items-center">
                <span className="text-orange-600 font-black text-xl">TOTAL</span>
                <span className="text-orange-600 font-black text-3xl">${Number(al.total_amount).toFixed(2)}</span>
              </div>

              {/* Confirm button */}
              <button
                onClick={() => confirmOrder(activeAlert)}
                className="w-full bg-green-500 hover:bg-green-400 active:scale-95 text-white font-black text-2xl py-6 rounded-2xl shadow-2xl transition-all"
              >
                ✓ CONFIRM ORDER
              </button>
              <p className="text-orange-200 text-sm pb-4">Order will keep ringing until confirmed</p>
            </div>
          </div>
        );
      })()}

      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
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
      <div className="flex border-b border-gray-800">
        <button
          onClick={() => setTab('pending')}
          className={`flex-1 py-3 font-semibold text-sm transition-colors ${tab === 'pending' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-gray-400'}`}
        >
          Pending {pendingOrders.length > 0 && <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full ml-1">{pendingOrders.length}</span>}
        </button>
        <button
          onClick={() => setTab('confirmed')}
          className={`flex-1 py-3 font-semibold text-sm transition-colors ${tab === 'confirmed' ? 'text-green-400 border-b-2 border-green-400' : 'text-gray-400'}`}
        >
          Confirmed Today
        </button>
      </div>

      {/* Orders */}
      <div className="p-4 space-y-4 pb-20">
        {tab === 'pending' && (
          pendingOrders.length === 0
            ? <div className="text-center text-gray-500 py-20"><UtensilsCrossed size={48} className="mx-auto mb-4 opacity-30" /><p>No pending orders</p></div>
            : pendingOrders.map(o => renderOrderCard(o, true))
        )}
        {tab === 'confirmed' && (
          confirmedOrders.length === 0
            ? <div className="text-center text-gray-500 py-20"><Check size={48} className="mx-auto mb-4 opacity-30" /><p>No confirmed orders today</p></div>
            : confirmedOrders.map(o => renderOrderCard(o, false))
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TrendingUp, ShoppingBag, DollarSign, Users, Calendar, RefreshCw } from 'lucide-react';

type Period = '24h' | '10d' | '30d' | '1y';

interface Stats {
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  byLocation: { location1: number; location2: number };
  byDay: { date: string; count: number; revenue: number }[];
}

export default function ActivityDashboard() {
  const [period, setPeriod] = useState<Period>('30d');
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const getPeriodStart = (p: Period): Date => {
    const now = new Date();
    if (p === '24h') return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    if (p === '10d') return new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
    if (p === '30d') return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    if (p === '1y') return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  };

  const fetchStats = async () => {
    setLoading(true);
    const since = getPeriodStart(period).toISOString();

    const { data: orders } = await supabase
      .from('pickup_orders')
      .select('id, total_amount, location_id, created_at, status')
      .in('status', ['paid', 'paid_clover_sync_failed'])
      .gte('created_at', since)
      .order('created_at', { ascending: true });

    const allOrders = orders || [];
    const totalOrders = allOrders.length;
    const totalRevenue = allOrders.reduce((s, o) => s + Number(o.total_amount), 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const byLocation = {
      location1: allOrders.filter(o => o.location_id === 'location1').length,
      location2: allOrders.filter(o => o.location_id === 'location2').length,
    };

    // Group by day
    const dayMap: Record<string, { count: number; revenue: number }> = {};
    allOrders.forEach(o => {
      const day = new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!dayMap[day]) dayMap[day] = { count: 0, revenue: 0 };
      dayMap[day].count++;
      dayMap[day].revenue += Number(o.total_amount);
    });

    const byDay = Object.entries(dayMap).map(([date, v]) => ({ date, ...v }));

    setStats({ totalOrders, totalRevenue, avgOrderValue, byLocation, byDay });
    setLoading(false);
  };

  useEffect(() => { fetchStats(); }, [period]);

  const periodLabels: Record<Period, string> = {
    '24h': 'Last 24 Hours',
    '10d': 'Last 10 Days',
    '30d': 'Last 30 Days',
    '1y': 'Last Year',
  };

  const maxCount = stats ? Math.max(...stats.byDay.map(d => d.count), 1) : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <TrendingUp size={20} className="text-orange-500" /> Activity
        </h2>
        <div className="flex items-center gap-2">
          <button onClick={fetchStats} className="text-gray-400 hover:text-white transition-colors p-2">
            <RefreshCw size={16} />
          </button>
          <div className="flex bg-gray-800 rounded-lg p-1 gap-1">
            {(['24h', '10d', '30d', '1y'] as Period[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${period === p ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'}`}>
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-12">Loading activity...</div>
      ) : stats ? (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <ShoppingBag size={18} className="text-orange-500" />
                <span className="text-gray-400 text-sm">Total Orders</span>
              </div>
              <p className="text-3xl font-black text-white">{stats.totalOrders}</p>
              <p className="text-gray-500 text-xs mt-1">{periodLabels[period]}</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign size={18} className="text-green-400" />
                <span className="text-gray-400 text-sm">Revenue</span>
              </div>
              <p className="text-3xl font-black text-white">${stats.totalRevenue.toFixed(0)}</p>
              <p className="text-gray-500 text-xs mt-1">{periodLabels[period]}</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={18} className="text-blue-400" />
                <span className="text-gray-400 text-sm">Avg Order</span>
              </div>
              <p className="text-3xl font-black text-white">${stats.avgOrderValue.toFixed(2)}</p>
              <p className="text-gray-500 text-xs mt-1">Per order</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <Users size={18} className="text-purple-400" />
                <span className="text-gray-400 text-sm">By Location</span>
              </div>
              <p className="text-sm text-white font-semibold">Oak Park: <span className="text-orange-400">{stats.byLocation.location1}</span></p>
              <p className="text-sm text-white font-semibold">Redford: <span className="text-orange-400">{stats.byLocation.location2}</span></p>
            </div>
          </div>

          {/* Bar chart */}
          {stats.byDay.length > 0 ? (
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
                <Calendar size={16} className="text-orange-500" /> Orders Over Time
              </h3>
              <div className="flex items-end gap-1 h-40 overflow-x-auto pb-2">
                {stats.byDay.map(day => (
                  <div key={day.date} className="flex flex-col items-center gap-1 flex-shrink-0" style={{ minWidth: '40px' }}>
                    <span className="text-gray-400 text-xs">{day.count}</span>
                    <div
                      className="w-8 bg-orange-500 rounded-t-md transition-all hover:bg-orange-400"
                      style={{ height: `${Math.max(4, (day.count / maxCount) * 120)}px` }}
                      title={`${day.date}: ${day.count} orders ($${day.revenue.toFixed(2)})`}
                    />
                    <span className="text-gray-500 text-xs">{day.date}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-gray-800 rounded-xl p-12 border border-gray-700 text-center">
              <TrendingUp size={40} className="mx-auto mb-3 text-gray-600" />
              <p className="text-gray-400">No orders in this period yet.</p>
              <p className="text-gray-500 text-sm mt-1">Orders will appear here once customers start ordering.</p>
            </div>
          )}

          {/* Daily breakdown table */}
          {stats.byDay.length > 0 && (
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-700">
                <h3 className="text-white font-semibold">Daily Breakdown</h3>
              </div>
              <div className="divide-y divide-gray-700 max-h-64 overflow-y-auto">
                {[...stats.byDay].reverse().map(day => (
                  <div key={day.date} className="flex items-center justify-between px-6 py-3 hover:bg-gray-700/50 transition-colors">
                    <span className="text-gray-300 text-sm">{day.date}</span>
                    <div className="flex items-center gap-6">
                      <span className="text-orange-400 font-semibold text-sm">{day.count} order{day.count !== 1 ? 's' : ''}</span>
                      <span className="text-green-400 font-semibold text-sm">${day.revenue.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

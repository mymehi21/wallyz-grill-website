import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Tag, ToggleLeft, ToggleRight } from 'lucide-react';

interface Discount {
  id: string;
  name: string;
  type: 'percentage' | 'fixed' | 'bogo';
  value: number;
  scope: 'store' | 'item';
  item_ids: string[];
  location_id: string;
  is_active: boolean;
  created_at: string;
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
}

export default function DiscountsManager() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    type: 'percentage' as 'percentage' | 'fixed' | 'bogo',
    value: '',
    scope: 'store' as 'store' | 'item',
    item_ids: [] as string[],
    location_id: 'all',
    is_active: true,
  });

  const fetchData = async () => {
    const [{ data: d }, { data: m }] = await Promise.all([
      supabase.from('discounts').select('*').order('created_at', { ascending: false }),
      supabase.from('menu_items').select('id, name, price').eq('is_available', true).order('name'),
    ]);
    setDiscounts(d || []);
    setMenuItems(m || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) { setError('Name is required.'); return; }
    if (form.type !== 'bogo' && (!form.value || Number(form.value) <= 0)) { setError('Enter a valid value.'); return; }
    if (form.scope === 'item' && form.item_ids.length === 0) { setError('Select at least one item.'); return; }

    setSaving(true);
    const { error: dbError } = await supabase.from('discounts').insert({
      name: form.name.trim(),
      type: form.type,
      value: form.type === 'bogo' ? 100 : Number(form.value),
      scope: form.scope,
      item_ids: form.item_ids,
      location_id: form.location_id,
      is_active: form.is_active,
    });
    setSaving(false);

    if (dbError) { setError(dbError.message); return; }
    setShowForm(false);
    setForm({ name: '', type: 'percentage', value: '', scope: 'store', item_ids: [], location_id: 'all', is_active: true });
    fetchData();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('discounts').update({ is_active: !current }).eq('id', id);
    fetchData();
  };

  const deleteDiscount = async (id: string) => {
    if (!confirm('Delete this discount?')) return;
    await supabase.from('discounts').delete().eq('id', id);
    fetchData();
  };

  const toggleItem = (id: string) => {
    setForm(prev => ({
      ...prev,
      item_ids: prev.item_ids.includes(id)
        ? prev.item_ids.filter(i => i !== id)
        : [...prev.item_ids, id],
    }));
  };

  const formatDiscount = (d: Discount) => {
    if (d.type === 'percentage') return `${d.value}% off`;
    if (d.type === 'fixed') return `$${d.value} off`;
    if (d.type === 'bogo') return 'Buy 1 Get 1 Free';
    return '';
  };

  const locationLabel = (id: string) => {
    if (id === 'all') return 'All Locations';
    if (id === 'location1') return 'Oak Park';
    if (id === 'location2') return 'Redford';
    return id;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Tag size={20} className="text-orange-500" /> Discounts & Promos
        </h2>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors">
          <Plus size={16} /> New Discount
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-800 rounded-xl p-6 space-y-5">
          <h3 className="font-semibold text-white text-lg">Create Discount</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Discount Name</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="e.g. Summer Sale, Weekend Special" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Location</label>
              <select value={form.location_id} onChange={e => setForm(p => ({ ...p, location_id: e.target.value }))}
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option value="all">All Locations</option>
                <option value="location1">Oak Park Only</option>
                <option value="location2">Redford Only</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Discount Type</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as any, value: '' }))}
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option value="percentage">Percentage (e.g. 10%)</option>
                <option value="fixed">Fixed Amount (e.g. $5 off)</option>
                <option value="bogo">Buy 1 Get 1 Free</option>
              </select>
            </div>
            {form.type !== 'bogo' && (
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  {form.type === 'percentage' ? 'Percentage (%)' : 'Amount ($)'}
                </label>
                <input
                  type="number" min="0" max={form.type === 'percentage' ? 100 : undefined}
                  step={form.type === 'percentage' ? 1 : 0.01}
                  value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))}
                  className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder={form.type === 'percentage' ? '10' : '5.00'} />
              </div>
            )}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Apply To</label>
              <select value={form.scope} onChange={e => setForm(p => ({ ...p, scope: e.target.value as any, item_ids: [] }))}
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option value="store">Entire Store</option>
                <option value="item">Specific Items</option>
              </select>
            </div>
          </div>

          {form.scope === 'item' && (
            <div>
              <label className="block text-sm text-gray-400 mb-2">Select Items ({form.item_ids.length} selected)</label>
              <div className="bg-gray-700 rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                {menuItems.map(item => (
                  <label key={item.id} className="flex items-center gap-3 cursor-pointer hover:bg-gray-600 px-2 py-1 rounded">
                    <input type="checkbox" checked={form.item_ids.includes(item.id)} onChange={() => toggleItem(item.id)}
                      className="accent-orange-500 w-4 h-4" />
                    <span className="text-white text-sm flex-1">{item.name}</span>
                    <span className="text-gray-400 text-sm">${item.price.toFixed(2)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))}
                className="accent-orange-500 w-4 h-4" />
              <span className="text-gray-300 text-sm">Active immediately</span>
            </label>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3">
            <button type="submit" disabled={saving}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50">
              {saving ? 'Saving...' : 'Create Discount'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : discounts.length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          <Tag size={40} className="mx-auto mb-3 opacity-30" />
          <p>No discounts yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {discounts.map(d => (
            <div key={d.id} className={`bg-gray-800 rounded-xl p-4 flex items-center justify-between border ${d.is_active ? 'border-orange-500/30' : 'border-gray-700'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full ${d.is_active ? 'bg-green-400' : 'bg-gray-500'}`} />
                <div>
                  <p className="text-white font-semibold">{d.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-orange-400 text-sm font-bold">{formatDiscount(d)}</span>
                    <span className="text-gray-500 text-xs">•</span>
                    <span className="text-gray-400 text-xs">{d.scope === 'store' ? 'Whole store' : `${d.item_ids.length} item(s)`}</span>
                    <span className="text-gray-500 text-xs">•</span>
                    <span className="text-gray-400 text-xs">{locationLabel(d.location_id)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => toggleActive(d.id, d.is_active)}
                  className={`transition-colors ${d.is_active ? 'text-green-400 hover:text-gray-400' : 'text-gray-500 hover:text-green-400'}`}>
                  {d.is_active ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                </button>
                <button onClick={() => deleteDiscount(d.id)} className="text-gray-500 hover:text-red-400 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

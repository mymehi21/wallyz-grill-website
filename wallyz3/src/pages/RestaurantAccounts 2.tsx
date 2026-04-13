import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Eye, EyeOff, UtensilsCrossed } from 'lucide-react';

const LOCATIONS = [
  { id: 'location1', name: 'Oak Park' },
  { id: 'location2', name: 'Redford' },
];

interface RestaurantAccountsProps {
  isSuperAdmin: boolean;
}

export default function RestaurantAccounts({ isSuperAdmin }: RestaurantAccountsProps) {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [locationId, setLocationId] = useState('location1');
  const [showPins, setShowPins] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchAccounts = async () => {
    const { data } = await supabase.from('restaurant_accounts').select('*').order('created_at', { ascending: false });
    setAccounts(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAccounts(); }, []);

  const createAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    if (pin.length !== 4) { setError('PIN must be exactly 4 digits.'); setSaving(false); return; }

    const { error: dbError } = await supabase.from('restaurant_accounts').insert({
      username: username.toLowerCase().trim(),
      pin,
      location_id: locationId,
      is_active: true,
    });

    setSaving(false);
    if (dbError) { setError(dbError.message); return; }
    setShowForm(false);
    setUsername(''); setPin(''); setLocationId('location1');
    fetchAccounts();
  };

  const deleteAccount = async (id: string) => {
    if (!confirm('Delete this restaurant account?')) return;
    await supabase.from('restaurant_accounts').delete().eq('id', id);
    fetchAccounts();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('restaurant_accounts').update({ is_active: !current }).eq('id', id);
    fetchAccounts();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <UtensilsCrossed size={20} className="text-orange-500" /> Restaurant Accounts
        </h2>
        <button onClick={() => setShowForm(!showForm)} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors">
          <Plus size={16} /> New Account
        </button>
      </div>

      {showForm && (
        <form onSubmit={createAccount} className="bg-gray-800 rounded-xl p-6 space-y-4">
          <h3 className="font-semibold text-white">Create Restaurant Account</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Username</label>
              <input value={username} onChange={e => setUsername(e.target.value)} required
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="e.g. oakpark1" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">4-Digit PIN</label>
              <input value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                required maxLength={4} inputMode="numeric"
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 tracking-widest text-center"
                placeholder="1234" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Location</label>
              <select value={locationId} onChange={e => setLocationId(e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
                {LOCATIONS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50">
              {saving ? 'Creating...' : 'Create Account'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : accounts.length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          <UtensilsCrossed size={40} className="mx-auto mb-3 opacity-30" />
          <p>No restaurant accounts yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map(acc => (
            <div key={acc.id} className="bg-gray-800 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full ${acc.is_active ? 'bg-green-400' : 'bg-gray-500'}`} />
                <div>
                  <p className="text-white font-semibold">@{acc.username}</p>
                  <p className="text-gray-400 text-sm">{LOCATIONS.find(l => l.id === acc.location_id)?.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm font-mono">
                    {showPins[acc.id] ? acc.pin : '••••'}
                  </span>
                  <button onClick={() => setShowPins(p => ({ ...p, [acc.id]: !p[acc.id] }))} className="text-gray-500 hover:text-gray-300">
                    {showPins[acc.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleActive(acc.id, acc.is_active)}
                  className={`text-xs px-3 py-1 rounded-full font-semibold transition-colors ${acc.is_active ? 'bg-green-500/20 text-green-400 hover:bg-red-500/20 hover:text-red-400' : 'bg-gray-700 text-gray-400 hover:bg-green-500/20 hover:text-green-400'}`}>
                  {acc.is_active ? 'Active' : 'Inactive'}
                </button>
                <button onClick={() => deleteAccount(acc.id)} className="text-gray-500 hover:text-red-400 transition-colors">
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

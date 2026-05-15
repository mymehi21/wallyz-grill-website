import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Eye, EyeOff, UtensilsCrossed, KeyRound, Check, X } from 'lucide-react';

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
  const [changingPinFor, setChangingPinFor] = useState<string | null>(null);
  const [newPin, setNewPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinSaving, setPinSaving] = useState(false);

  const fetchAccounts = async () => {
    const { data } = await supabase.from('restaurant_accounts').select('*').order('created_at', { ascending: false });
    setAccounts(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAccounts(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim()) { setError('Username is required.'); return; }
    if (!/^\d{4}$/.test(pin)) { setError('PIN must be exactly 4 digits.'); return; }

    setSaving(true);
    const { error: dbError } = await supabase.from('restaurant_accounts').insert({
      username: username.trim().toLowerCase(),
      pin,
      location_id: locationId,
      is_active: true,
    });
    setSaving(false);

    if (dbError) { setError(dbError.message); return; }
    setUsername(''); setPin(''); setLocationId('location1');
    setShowForm(false);
    fetchAccounts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this restaurant account?')) return;
    await supabase.from('restaurant_accounts').delete().eq('id', id);
    fetchAccounts();
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    await supabase.from('restaurant_accounts').update({ is_active: !current }).eq('id', id);
    fetchAccounts();
  };

  const handleChangePin = async (id: string) => {
    setPinError('');
    if (!/^\d{4}$/.test(newPin)) { setPinError('PIN must be exactly 4 digits.'); return; }
    setPinSaving(true);
    const { error: dbError } = await supabase
      .from('restaurant_accounts')
      .update({ pin: newPin })
      .eq('id', id);
    setPinSaving(false);
    if (dbError) { setPinError(dbError.message); return; }
    setChangingPinFor(null);
    setNewPin('');
    fetchAccounts();
  };

  const locationName = (id: string) => LOCATIONS.find(l => l.id === id)?.name || id;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <UtensilsCrossed size={20} className="text-orange-500" /> Restaurant Accounts
        </h2>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors">
          <Plus size={16} /> New Account
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-gray-800 rounded-xl p-6 space-y-4">
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
              <input value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))} required
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="1234" maxLength={4} />
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
            <button type="submit" disabled={saving}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50">
              {saving ? 'Creating...' : 'Create Account'}
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
      ) : accounts.length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          <UtensilsCrossed size={40} className="mx-auto mb-3 opacity-30" />
          <p>No restaurant accounts yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map(acc => (
            <div key={acc.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${acc.is_active ? 'bg-green-400' : 'bg-gray-500'}`} />
                  <div>
                    <p className="text-white font-semibold">@{acc.username}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-gray-400 text-sm">{locationName(acc.location_id)}</span>
                      <span className="text-gray-600 text-xs">•</span>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400 text-sm font-mono">
                          {showPins[acc.id] ? acc.pin : '••••'}
                        </span>
                        <button onClick={() => setShowPins(p => ({ ...p, [acc.id]: !p[acc.id] }))}
                          className="text-gray-500 hover:text-gray-300 transition-colors">
                          {showPins[acc.id] ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${acc.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-500'}`}>
                        {acc.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setChangingPinFor(changingPinFor === acc.id ? null : acc.id); setNewPin(''); setPinError(''); }}
                    className="text-gray-400 hover:text-orange-400 transition-colors p-1.5 rounded-lg hover:bg-gray-700"
                    title="Change PIN">
                    <KeyRound size={16} />
                  </button>
                  <button onClick={() => handleToggleActive(acc.id, acc.is_active)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${acc.is_active ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-green-600/20 hover:bg-green-600/40 text-green-400'}`}>
                    {acc.is_active ? 'Disable' : 'Enable'}
                  </button>
                  <button onClick={() => handleDelete(acc.id)}
                    className="text-gray-500 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-gray-700">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Inline PIN change */}
              {changingPinFor === acc.id && (
                <div className="mt-3 pt-3 border-t border-gray-700 flex items-center gap-3">
                  <div className="flex-1">
                    <input
                      value={newPin}
                      onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="New 4-digit PIN"
                      maxLength={4}
                      className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono tracking-widest"
                      autoFocus
                    />
                    {pinError && <p className="text-red-400 text-xs mt-1">{pinError}</p>}
                  </div>
                  <button onClick={() => handleChangePin(acc.id)} disabled={pinSaving}
                    className="bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-lg transition-colors disabled:opacity-50">
                    <Check size={16} />
                  </button>
                  <button onClick={() => { setChangingPinFor(null); setNewPin(''); setPinError(''); }}
                    className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors">
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

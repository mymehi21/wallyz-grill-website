import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { UtensilsCrossed } from 'lucide-react';

interface RestaurantLoginProps {
  onLogin: (account: { id: string; username: string; location_id: string; location_name: string }) => void;
}

export default function RestaurantLogin({ onLogin }: RestaurantLoginProps) {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error: dbError } = await supabase
      .from('restaurant_accounts')
      .select('*')
      .eq('username', username.toLowerCase().trim())
      .eq('pin', pin)
      .eq('is_active', true)
      .single();

    setLoading(false);

    if (dbError || !data) {
      setError('Invalid username or PIN.');
      return;
    }

    const locationName = data.location_id === 'location1' ? 'Oak Park' : 'Redford';
    onLogin({ id: data.id, username: data.username, location_id: data.location_id, location_name: locationName });
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <UtensilsCrossed size={48} className="text-orange-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white">Restaurant Portal</h1>
          <p className="text-gray-400 mt-2">Wallyz Grill</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-2xl p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Enter username"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">4-Digit PIN</label>
            <input
              type="password"
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 text-center text-2xl tracking-widest"
              placeholder="••••"
              maxLength={4}
              inputMode="numeric"
              required
            />
          </div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading || pin.length !== 4}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-4 rounded-lg text-lg transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

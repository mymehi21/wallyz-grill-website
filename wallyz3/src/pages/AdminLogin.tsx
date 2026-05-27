import { useState, useEffect } from 'react';
import { Lock, Mail, Eye, EyeOff, UtensilsCrossed, ShieldCheck, Delete } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Logo from '../components/Logo';

type Tab = 'admin' | 'restaurant';

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onRestaurantLogin?: (account: { id: string; username: string; location_id: string; location_name: string }) => void;
}

// ─── iPhone-style PIN pad ─────────────────────────────────────────────────────
function PinPad({ onSubmit, loading, error }: {
  onSubmit: (pin: string, location: string) => void;
  loading: boolean;
  error: string;
}) {
  const [pin, setPin] = useState('');
  const [location, setLocation] = useState<'location1' | 'location2'>('location1');
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (pin.length === 4) {
      onSubmit(pin, location);
    }
  }, [pin]);

  useEffect(() => {
    if (error) {
      setShake(true);
      setPin('');
      const t = setTimeout(() => setShake(false), 600);
      return () => clearTimeout(t);
    }
  }, [error]);

  const press = (digit: string) => {
    if (pin.length < 4 && !loading) setPin(p => p + digit);
  };

  const del = () => {
    if (!loading) setPin(p => p.slice(0, -1));
  };

  const keys = ['1','2','3','4','5','6','7','8','9','','0','del'];

  return (
    <div className="flex flex-col items-center gap-6 py-2">
      {/* Location selector */}
      <div className="flex bg-gray-800 rounded-xl p-1 gap-1 w-full">
        {[{ id: 'location1', label: 'Oak Park' }, { id: 'location2', label: 'Redford' }].map(loc => (
          <button
            key={loc.id}
            onClick={() => { setLocation(loc.id as any); setPin(''); }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              location === loc.id
                ? 'bg-orange-500 text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {loc.label}
          </button>
        ))}
      </div>

      {/* PIN dots */}
      <div
        className="flex gap-5"
        style={{ animation: shake ? 'pinShake 0.5s ease-in-out' : 'none' }}
      >
        {[0,1,2,3].map(i => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
              i < pin.length
                ? 'bg-orange-500 border-orange-500 scale-110'
                : 'border-gray-500 bg-transparent'
            }`}
          />
        ))}
      </div>

      {error && <p className="text-red-400 text-sm font-medium -mt-2">{error}</p>}
      {loading && <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin -mt-2" />}

      {/* Keypad grid */}
      <div className="grid grid-cols-3 gap-3 w-full">
        {keys.map((key, i) => {
          if (key === '') return <div key={i} />;
          const isDel = key === 'del';
          return (
            <button
              key={i}
              onClick={() => isDel ? del() : press(key)}
              disabled={loading}
              className={`
                h-16 rounded-2xl text-xl font-semibold transition-all duration-100 active:scale-90
                ${isDel
                  ? 'bg-transparent text-gray-400 hover:text-white flex items-center justify-center w-full'
                  : 'bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-white border border-gray-700 hover:border-orange-500/40 shadow-lg'
                }
                disabled:opacity-40 select-none
              `}
            >
              {isDel ? <Delete size={20} /> : key}
            </button>
          );
        })}
      </div>

      <p className="text-gray-500 text-xs">Enter your 4-digit PIN</p>

      <style>{`
        @keyframes pinShake {
          0%,100% { transform: translateX(0); }
          20% { transform: translateX(-10px); }
          40% { transform: translateX(10px); }
          60% { transform: translateX(-8px); }
          80% { transform: translateX(8px); }
        }
      `}</style>
    </div>
  );
}

// ─── Unified login page ────────────────────────────────────────────────────────
export default function AdminLogin({ onLoginSuccess, onRestaurantLogin }: AdminLoginProps) {
  const [tab, setTab] = useState<Tab>('admin');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);

  const [pinError, setPinError] = useState('');
  const [pinLoading, setPinLoading] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    setAdminLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.user) {
        await supabase.from('admin_users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', data.user.id);
        onLoginSuccess();
      }
    } catch (err: any) {
      setAdminError(
        err.message === 'Invalid login credentials'
          ? 'Incorrect email or password.'
          : err.message || 'Failed to sign in'
      );
    } finally {
      setAdminLoading(false);
    }
  };

  const handlePinSubmit = async (pin: string, locationId: string) => {
    setPinError('');
    setPinLoading(true);
    const { data, error } = await supabase
      .from('restaurant_accounts')
      .select('*')
      .eq('pin', pin)
      .eq('location_id', locationId)
      .eq('is_active', true)
      .maybeSingle();

    setPinLoading(false);

    if (error || !data) {
      setPinError('Incorrect PIN. Try again.');
      return;
    }

    if (onRestaurantLogin) {
      const locationName = data.location_id === 'location1' ? 'Oak Park' : 'Redford';
      onRestaurantLogin({ id: data.id, username: data.username, location_id: data.location_id, location_name: locationName });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <Logo size={56} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">WALLYZ GRILL</h1>
          <p className="text-gray-500 text-sm mt-1">Staff Portal</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-800">
            <button
              onClick={() => setTab('admin')}
              className={`flex-1 py-4 flex items-center justify-center gap-2 text-sm font-semibold transition-colors ${
                tab === 'admin'
                  ? 'text-orange-500 border-b-2 border-orange-500 bg-orange-500/5'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <ShieldCheck size={16} />
              Admin Sign In
            </button>
            <button
              onClick={() => { setTab('restaurant'); setPinError(''); }}
              className={`flex-1 py-4 flex items-center justify-center gap-2 text-sm font-semibold transition-colors ${
                tab === 'restaurant'
                  ? 'text-orange-500 border-b-2 border-orange-500 bg-orange-500/5'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <UtensilsCrossed size={16} />
              Restaurant Sign In
            </button>
          </div>

          {/* Admin tab */}
          {tab === 'admin' && (
            <div className="px-8 py-8">
              <form onSubmit={handleAdminLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-colors"
                      placeholder="your@email.com"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-colors"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {adminError && (
                  <div className="bg-red-500/10 border border-red-500/40 text-red-400 px-4 py-3 rounded-lg text-sm">
                    {adminError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={adminLoading}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {adminLoading
                    ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Signing In...</>
                    : 'Sign In'
                  }
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-800 text-center">
                <p className="text-xs text-gray-500">
                  Need access?{' '}
                  <a href="mailto:testnetwork61@gmail.com" className="text-orange-500 hover:text-orange-400">
                    Contact your administrator
                  </a>
                </p>
              </div>
            </div>
          )}

          {/* Restaurant PIN tab */}
          {tab === 'restaurant' && (
            <div className="px-8 py-6">
              <PinPad
                onSubmit={handlePinSubmit}
                loading={pinLoading}
                error={pinError}
              />
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          © {new Date().getFullYear()} Wallyz Grill — Authorized personnel only
        </p>
      </div>
    </div>
  );
}

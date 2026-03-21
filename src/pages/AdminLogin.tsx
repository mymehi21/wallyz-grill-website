import { useState } from 'react';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Logo from '../components/Logo';

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

export default function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) throw error;

      if (data.user) {
        // Update last login in admin_users table
        await supabase.from('admin_users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', data.user.id);

        onLoginSuccess();
      }
    } catch (err: any) {
      setError(err.message === 'Invalid login credentials'
        ? 'Incorrect email or password. Please try again.'
        : err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-gray-900 border border-orange-500 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-600 to-orange-500 px-8 py-8 text-center">
            <div className="flex justify-center mb-3">
              <Logo size={56} />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-wide">WALLYZ GRILL</h1>
            <p className="text-orange-100 text-sm mt-1">Admin Portal</p>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            <h2 className="text-xl font-semibold text-white mb-6">Sign in to your account</h2>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
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
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
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

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 accent-orange-500"
                  />
                  <span className="text-sm text-gray-300">Remember me</span>
                </label>
              </div>

              {error && (
                <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                  <Lock size={16} />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing In...
                  </>
                ) : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-800 text-center">
              <p className="text-xs text-gray-500">Authorized personnel only</p>
              <p className="text-xs text-gray-600 mt-1">© {new Date().getFullYear()} Wallyz Grill</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

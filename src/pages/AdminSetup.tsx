import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AdminSetupProps {
  onSetupComplete: () => void;
}

export default function AdminSetup({ onSetupComplete }: AdminSetupProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      console.log('Checking if email is approved:', email);

      const { data: approvedAdmin, error: checkError } = await supabase
        .from('approved_admins')
        .select('email, is_active')
        .eq('email', email.toLowerCase())
        .eq('is_active', true)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking approved admins:', checkError);
        throw new Error('Unable to verify admin approval status');
      }

      if (!approvedAdmin) {
        setError('This email is not approved for admin access. Please contact the restaurant owner.');
        setLoading(false);
        return;
      }

      console.log('Email approved, creating admin user');

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin + '/admin',
        }
      });

      console.log('SignUp response:', { data, error: signUpError });

      if (signUpError) throw signUpError;

      if (data.user) {
        setSuccess('Admin user created successfully! You can now login.');
        setEmail('');
        setPassword('');
        setConfirmPassword('');

        setTimeout(() => {
          onSetupComplete();
        }, 2000);
      }
    } catch (err: any) {
      console.error('Setup error:', err);
      setError(err.message || 'Failed to create admin user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-gray-900 border border-orange-500 rounded-lg shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-full mb-4">
              <UserPlus size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              <span className="text-orange-500">WALLYZ</span> GRILL
            </h1>
            <p className="text-gray-400">Create Admin Account</p>
            <p className="text-sm text-gray-500 mt-2">Setup your first admin user to access the dashboard</p>
          </div>

          <form onSubmit={handleSetup} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="admin@wallyzgrill.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Enter password (min 6 characters)"
                required
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Confirm password"
                required
              />
            </div>

            {error && (
              <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-500 bg-opacity-10 border border-green-500 text-green-500 px-4 py-3 rounded-lg text-sm">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Admin Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={onSetupComplete}
              className="text-sm text-gray-400 hover:text-orange-500 transition-colors"
            >
              Already have an account? Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

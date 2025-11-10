import { useState } from 'react';
import { Lock } from 'lucide-react';

interface PasswordGateProps {
  onUnlock: () => void;
  title?: string;
}

export default function PasswordGate({ onUnlock, title = 'WALLYZ GRILL' }: PasswordGateProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const correctPassword = 'wallyz2024';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === correctPassword) {
      onUnlock();
      setError('');
    } else {
      setError('Incorrect password');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-gray-900 border border-orange-500 rounded-lg shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-full mb-4">
              <Lock size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              <span className="text-orange-500">{title}</span>
            </h1>
            <p className="text-gray-400">This site is password protected</p>
            <p className="text-xs text-gray-500 mt-2">Enter password to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter password"
                  required
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Unlock
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

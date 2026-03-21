import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserPlus, Trash2, CheckCircle, XCircle, Mail, User } from 'lucide-react';

export default function SuperAdminPanel() {
  const [approvedAdmins, setApprovedAdmins] = useState<any[]>([]);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [formData, setFormData] = useState({ email: '', full_name: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [approvedRes, usersRes] = await Promise.all([
      supabase.from('approved_admins').select('*').order('created_at', { ascending: false }),
      supabase.from('admin_users').select('*').order('created_at', { ascending: false }),
    ]);
    if (approvedRes.data) setApprovedAdmins(approvedRes.data);
    if (usersRes.data) setAdminUsers(usersRes.data);
    setLoading(false);
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.email.trim() || !formData.full_name.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    setAdding(true);
    try {
      const { error } = await supabase.from('approved_admins').insert([{
        email: formData.email.toLowerCase().trim(),
        full_name: formData.full_name.trim(),
        is_active: true,
      }]);

      if (error) throw error;

      setSuccess(`${formData.full_name} has been approved. They can now create an admin account at /admin.`);
      setFormData({ email: '', full_name: '' });
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to add admin');
    } finally {
      setAdding(false);
    }
  };

  const handleToggleAdmin = async (id: string, currentStatus: boolean, name: string) => {
    const { error } = await supabase
      .from('approved_admins')
      .update({ is_active: !currentStatus })
      .eq('id', id);
    
    if (!error) {
      setSuccess(`${name} has been ${!currentStatus ? 'activated' : 'deactivated'}.`);
      fetchData();
    }
  };

  const handleRemoveAdmin = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from approved admins?`)) return;
    
    const { error } = await supabase.from('approved_admins').delete().eq('id', id);
    if (!error) {
      setSuccess(`${name} has been removed.`);
      fetchData();
    }
  };

  if (loading) return <div className="text-gray-400 py-12 text-center">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">
          Manage <span className="text-orange-500">Admins</span>
        </h2>
        <p className="text-gray-400 text-sm">Only you can add or remove admin accounts.</p>
      </div>

      {/* Add new admin form */}
      <div className="bg-gray-800 rounded-lg p-6 border border-orange-500">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <UserPlus size={20} className="text-orange-500" />
          Add New Admin
        </h3>
        <form onSubmit={handleAddAdmin} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="John Doe"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="admin@wallyzgrill.com"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-500 bg-opacity-10 border border-green-500 text-green-400 px-4 py-3 rounded-lg text-sm">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={adding}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
          >
            {adding ? 'Adding...' : 'Add Admin'}
          </button>
        </form>
      </div>

      {/* Approved admins list */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-bold text-white mb-4">Approved Admins ({approvedAdmins.length})</h3>
        {approvedAdmins.length === 0 ? (
          <p className="text-gray-400">No approved admins yet.</p>
        ) : (
          <div className="space-y-3">
            {approvedAdmins.map(admin => {
              const hasAccount = adminUsers.some(u => u.email === admin.email);
              return (
                <div key={admin.id} className="bg-gray-900 rounded-lg p-4 border border-gray-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-white font-bold">
                      {(admin.full_name || admin.email).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-semibold">{admin.full_name || '—'}</p>
                      <p className="text-gray-400 text-sm">{admin.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${admin.is_active ? 'bg-green-500 bg-opacity-20 text-green-400' : 'bg-red-500 bg-opacity-20 text-red-400'}`}>
                          {admin.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${hasAccount ? 'bg-blue-500 bg-opacity-20 text-blue-400' : 'bg-gray-600 bg-opacity-20 text-gray-400'}`}>
                          {hasAccount ? 'Account Created' : 'Not Signed Up Yet'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleAdmin(admin.id, admin.is_active, admin.full_name || admin.email)}
                      className={`p-2 rounded-lg transition-colors ${admin.is_active ? 'bg-yellow-500 bg-opacity-20 hover:bg-opacity-30 text-yellow-400' : 'bg-green-500 bg-opacity-20 hover:bg-opacity-30 text-green-400'}`}
                      title={admin.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {admin.is_active ? <XCircle size={18} /> : <CheckCircle size={18} />}
                    </button>
                    <button
                      onClick={() => handleRemoveAdmin(admin.id, admin.full_name || admin.email)}
                      className="p-2 rounded-lg bg-red-500 bg-opacity-20 hover:bg-opacity-30 text-red-400 transition-colors"
                      title="Remove"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

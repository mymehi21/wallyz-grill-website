import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserPlus, Trash2, CheckCircle, XCircle, Mail, User, KeyRound, RefreshCw } from 'lucide-react';

export default function SuperAdminPanel() {
  const [approvedAdmins, setApprovedAdmins] = useState<any[]>([]);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [formData, setFormData] = useState({ email: '', full_name: '' });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => { fetchData(); }, []);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

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

  const callAdminFunction = async (action: string, email: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const { data, error } = await supabase.functions.invoke('admin-management', {
      body: { action, email },
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    if (error) throw new Error(error.message);
    if (!data?.success) throw new Error(data?.error || 'Action failed');
    return data;
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email.trim() || !formData.full_name.trim()) {
      showMessage('error', 'Please fill in all fields.');
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
      showMessage('success', `${formData.full_name} has been added. They can now create an account at /admin.`);
      setFormData({ email: '', full_name: '' });
      fetchData();
    } catch (err: any) {
      showMessage('error', err.message || 'Failed to add admin');
    } finally {
      setAdding(false);
    }
  };

  const handleToggleAdmin = async (id: string, currentStatus: boolean, name: string) => {
    setActionLoading(id + '-toggle');
    const { error } = await supabase.from('approved_admins').update({ is_active: !currentStatus }).eq('id', id);
    if (!error) {
      showMessage('success', `${name} has been ${!currentStatus ? 'activated' : 'deactivated'}.`);
      fetchData();
    }
    setActionLoading(null);
  };

  const handleResetPassword = async (email: string, name: string) => {
    if (!confirm(`Send a password reset email to ${name} (${email})?`)) return;
    setActionLoading(email + '-reset');
    try {
      await callAdminFunction('reset_password', email);
      showMessage('success', `Password reset email sent to ${email}.`);
    } catch (err: any) {
      showMessage('error', err.message || 'Failed to send reset email');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveAdmin = async (id: string, email: string, name: string) => {
    if (!confirm(`Remove ${name} completely? This will delete their login access and cannot be undone.`)) return;
    setActionLoading(id + '-remove');
    try {
      await callAdminFunction('delete_admin', email);
      showMessage('success', `${name} has been removed from all admin access.`);
      fetchData();
    } catch (err: any) {
      // Fallback: just remove from approved_admins table
      await supabase.from('approved_admins').delete().eq('id', id);
      showMessage('success', `${name} has been removed.`);
      fetchData();
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <div className="text-gray-400 py-12 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Manage <span className="text-orange-500">Admins</span></h2>
        <p className="text-gray-400 text-sm">Add or remove admin accounts. Only you can do this.</p>
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-lg text-sm border ${message.type === 'success' ? 'bg-green-500 bg-opacity-10 border-green-500 text-green-400' : 'bg-red-500 bg-opacity-10 border-red-500 text-red-400'}`}>
          {message.text}
        </div>
      )}

      {/* Add admin form */}
      <div className="bg-gray-800 rounded-lg p-6 border border-orange-500">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <UserPlus size={20} className="text-orange-500" /> Add New Admin
        </h3>
        <form onSubmit={handleAddAdmin} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="John Doe" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="admin@example.com" />
              </div>
            </div>
          </div>
          <button type="submit" disabled={adding}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center gap-2">
            {adding ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Adding...</> : <><UserPlus size={18} /> Add Admin</>}
          </button>
        </form>
      </div>

      {/* Admin list */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Admin Accounts ({approvedAdmins.length})</h3>
          <button onClick={fetchData} className="text-gray-400 hover:text-white transition-colors" title="Refresh">
            <RefreshCw size={18} />
          </button>
        </div>

        {approvedAdmins.length === 0 ? (
          <p className="text-gray-400">No admins added yet.</p>
        ) : (
          <div className="space-y-3">
            {approvedAdmins.map(admin => {
              const hasAccount = adminUsers.some(u => u.email?.toLowerCase() === admin.email?.toLowerCase());
              const isRemoving = actionLoading === admin.id + '-remove';
              const isResetting = actionLoading === admin.email + '-reset';
              const isToggling = actionLoading === admin.id + '-toggle';

              return (
                <div key={admin.id} className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                        {(admin.full_name || admin.email).charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-semibold">{admin.full_name || '—'}</p>
                        <p className="text-gray-400 text-sm truncate">{admin.email}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${admin.is_active ? 'bg-green-500 bg-opacity-20 text-green-400' : 'bg-red-500 bg-opacity-20 text-red-400'}`}>
                            {admin.is_active ? 'Active' : 'Inactive'}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${hasAccount ? 'bg-blue-500 bg-opacity-20 text-blue-400' : 'bg-gray-600 bg-opacity-40 text-gray-400'}`}>
                            {hasAccount ? 'Account Created' : 'Pending Signup'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Toggle active/inactive */}
                      <button onClick={() => handleToggleAdmin(admin.id, admin.is_active, admin.full_name || admin.email)}
                        disabled={!!actionLoading}
                        className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${admin.is_active ? 'bg-yellow-500 bg-opacity-20 hover:bg-opacity-40 text-yellow-400' : 'bg-green-500 bg-opacity-20 hover:bg-opacity-40 text-green-400'}`}
                        title={admin.is_active ? 'Deactivate' : 'Activate'}>
                        {isToggling ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : admin.is_active ? <XCircle size={18} /> : <CheckCircle size={18} />}
                      </button>

                      {/* Reset password — only if they have an account */}
                      {hasAccount && (
                        <button onClick={() => handleResetPassword(admin.email, admin.full_name || admin.email)}
                          disabled={!!actionLoading}
                          className="p-2 rounded-lg bg-blue-500 bg-opacity-20 hover:bg-opacity-40 text-blue-400 transition-colors disabled:opacity-50"
                          title="Send password reset email">
                          {isResetting ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <KeyRound size={18} />}
                        </button>
                      )}

                      {/* Remove */}
                      <button onClick={() => handleRemoveAdmin(admin.id, admin.email, admin.full_name || admin.email)}
                        disabled={!!actionLoading}
                        className="p-2 rounded-lg bg-red-500 bg-opacity-20 hover:bg-opacity-40 text-red-400 transition-colors disabled:opacity-50"
                        title="Remove admin">
                        {isRemoving ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Trash2 size={18} />}
                      </button>
                    </div>
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

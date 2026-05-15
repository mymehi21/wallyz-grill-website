import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserPlus, Trash2, CheckCircle, XCircle, Mail, User, KeyRound, RefreshCw, Eye, EyeOff, Lock } from 'lucide-react';

export default function SuperAdminPanel() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Add admin form
  const [addForm, setAddForm] = useState({ full_name: '', email: '', temp_password: '', confirm_password: '' });
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [adding, setAdding] = useState(false);

  // Reset password modal
  const [resetModal, setResetModal] = useState<{ email: string; name: string } | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirm, setResetConfirm] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => { fetchAdmins(); }, []);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const fetchAdmins = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('approved_admins')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setAdmins(data);
    setLoading(false);
  };

  const callFunction = async (action: string, extra: Record<string, any> = {}) => {
    const { data: { session } } = await supabase.auth.getSession();
    const { data, error } = await supabase.functions.invoke('admin-management', {
      body: { action, ...extra },
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    if (error) throw new Error(error.message);
    if (!data?.success) throw new Error(data?.error || 'Action failed');
    return data;
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.full_name.trim() || !addForm.email.trim() || !addForm.temp_password.trim()) {
      showMessage('error', 'Please fill in all fields.'); return;
    }
    if (addForm.temp_password !== addForm.confirm_password) {
      showMessage('error', 'Passwords do not match.'); return;
    }
    if (addForm.temp_password.length < 8) {
      showMessage('error', 'Password must be at least 8 characters.'); return;
    }
    setAdding(true);
    try {
      await callFunction('create_admin', {
        email: addForm.email,
        full_name: addForm.full_name,
        temp_password: addForm.temp_password,
      });
      showMessage('success', `${addForm.full_name} has been added. They can now log in with the password you set.`);
      setAddForm({ full_name: '', email: '', temp_password: '', confirm_password: '' });
      fetchAdmins();
    } catch (err: any) {
      showMessage('error', err.message || 'Failed to add admin');
    } finally {
      setAdding(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetModal) return;
    if (resetPassword !== resetConfirm) { showMessage('error', 'Passwords do not match.'); return; }
    if (resetPassword.length < 8) { showMessage('error', 'Password must be at least 8 characters.'); return; }
    setResetting(true);
    try {
      await callFunction('reset_password', { email: resetModal.email, new_password: resetPassword });
      showMessage('success', `Password reset for ${resetModal.name}. They will be prompted to change it on next login.`);
      setResetModal(null);
      setResetPassword('');
      setResetConfirm('');
    } catch (err: any) {
      showMessage('error', err.message || 'Failed to reset password');
    } finally {
      setResetting(false);
    }
  };

  const handleToggle = async (id: string, email: string, currentStatus: boolean, name: string) => {
    setActionLoading(id + '-toggle');
    const { error } = await supabase.from('approved_admins').update({ is_active: !currentStatus }).eq('id', id);
    if (!error) {
      showMessage('success', `${name} has been ${!currentStatus ? 'activated' : 'deactivated'}.`);
      fetchAdmins();
    }
    setActionLoading(null);
  };

  const handleDelete = async (id: string, email: string, name: string) => {
    if (!confirm(`Remove ${name} completely? They will lose all access and this cannot be undone.`)) return;
    setActionLoading(id + '-delete');
    try {
      await callFunction('delete_admin', { email });
      showMessage('success', `${name} has been removed from the system.`);
      fetchAdmins();
    } catch (err: any) {
      // Fallback: remove from table only
      await supabase.from('approved_admins').delete().eq('id', id);
      showMessage('success', `${name} has been removed.`);
      fetchAdmins();
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return (
    <div className="text-gray-400 py-12 text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Manage <span className="text-orange-500">Admins</span></h2>
        <p className="text-gray-400 text-sm">Add admins, set their passwords, and manage access. Only you can do this.</p>
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-lg text-sm border ${message.type === 'success' ? 'bg-green-500 bg-opacity-10 border-green-500 text-green-400' : 'bg-red-500 bg-opacity-10 border-red-500 text-red-400'}`}>
          {message.text}
        </div>
      )}

      {/* Add admin */}
      <div className="bg-gray-800 rounded-lg p-6 border border-orange-500">
        <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
          <UserPlus size={20} className="text-orange-500" /> Add New Admin
        </h3>
        <p className="text-gray-400 text-sm mb-4">You set their initial password. They'll be prompted to change it on first login.</p>
        <form onSubmit={handleAddAdmin} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" value={addForm.full_name} onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })}
                  className="w-full pl-9 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="John Doe" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="email" value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  className="w-full pl-9 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="admin@example.com" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Initial Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type={showAddPassword ? 'text' : 'password'} value={addForm.temp_password} onChange={(e) => setAddForm({ ...addForm, temp_password: e.target.value })}
                  className="w-full pl-9 pr-10 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Min 8 characters" />
                <button type="button" onClick={() => setShowAddPassword(!showAddPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                  {showAddPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="password" value={addForm.confirm_password} onChange={(e) => setAddForm({ ...addForm, confirm_password: e.target.value })}
                  className="w-full pl-9 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Confirm password" />
              </div>
            </div>
          </div>
          <button type="submit" disabled={adding}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center gap-2">
            {adding ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Adding...</> : <><UserPlus size={18} />Add Admin</>}
          </button>
        </form>
      </div>

      {/* Admin list */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Admin Accounts ({admins.length})</h3>
          <button onClick={fetchAdmins} className="text-gray-400 hover:text-white transition-colors" title="Refresh">
            <RefreshCw size={18} />
          </button>
        </div>

        {admins.length === 0 ? (
          <p className="text-gray-400">No admins added yet.</p>
        ) : (
          <div className="space-y-3">
            {admins.map(admin => {
              const isDeleting = actionLoading === admin.id + '-delete';
              const isToggling = actionLoading === admin.id + '-toggle';

              return (
                <div key={admin.id} className="bg-gray-900 rounded-lg p-4 border border-gray-700 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-orange-500 bg-opacity-20 rounded-full flex items-center justify-center text-orange-400 font-bold flex-shrink-0">
                      {(admin.full_name || admin.email).charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-semibold">{admin.full_name || '—'}</p>
                      <p className="text-gray-400 text-sm truncate">{admin.email}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold mt-1 inline-block ${admin.is_active ? 'bg-green-500 bg-opacity-20 text-green-400' : 'bg-red-500 bg-opacity-20 text-red-400'}`}>
                        {admin.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Toggle */}
                    <button onClick={() => handleToggle(admin.id, admin.email, admin.is_active, admin.full_name || admin.email)}
                      disabled={!!actionLoading}
                      className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${admin.is_active ? 'bg-yellow-500 bg-opacity-20 hover:bg-opacity-40 text-yellow-400' : 'bg-green-500 bg-opacity-20 hover:bg-opacity-40 text-green-400'}`}
                      title={admin.is_active ? 'Deactivate' : 'Activate'}>
                      {isToggling ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : admin.is_active ? <XCircle size={18} /> : <CheckCircle size={18} />}
                    </button>

                    {/* Reset password */}
                    <button
                      onClick={() => { setResetModal({ email: admin.email, name: admin.full_name || admin.email }); setResetPassword(''); setResetConfirm(''); }}
                      disabled={!!actionLoading}
                      className="p-2 rounded-lg bg-blue-500 bg-opacity-20 hover:bg-opacity-40 text-blue-400 transition-colors disabled:opacity-50"
                      title="Reset password">
                      <KeyRound size={18} />
                    </button>

                    {/* Delete */}
                    <button onClick={() => handleDelete(admin.id, admin.email, admin.full_name || admin.email)}
                      disabled={!!actionLoading}
                      className="p-2 rounded-lg bg-red-500 bg-opacity-20 hover:bg-opacity-40 text-red-400 transition-colors disabled:opacity-50"
                      title="Remove admin">
                      {isDeleting ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Trash2 size={18} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reset password modal */}
      {resetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-xl border border-orange-500 p-8 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-1">Reset Password</h3>
            <p className="text-gray-400 text-sm mb-6">Set a new password for <span className="text-white font-semibold">{resetModal.name}</span>. They will be prompted to change it on their next login.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type={showResetPassword ? 'text' : 'password'} value={resetPassword} onChange={(e) => setResetPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Min 8 characters" autoFocus />
                  <button type="button" onClick={() => setShowResetPassword(!showResetPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                    {showResetPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="password" value={resetConfirm} onChange={(e) => setResetConfirm(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Confirm new password" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={handleResetPassword} disabled={resetting}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {resetting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Resetting...</> : <><KeyRound size={18} />Reset Password</>}
              </button>
              <button onClick={() => setResetModal(null)} className="px-6 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

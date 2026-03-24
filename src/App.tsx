import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainApp from './MainApp';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminSetup from './pages/AdminSetup';
import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/admin/*" element={<AdminRoute />} />
        <Route path="/*" element={<MainApp />} />
      </Routes>
    </Router>
  );
}

function AdminRoute() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [adminUser, setAdminUser] = useState<{ email: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setIsAuthenticated(true);
        fetchAdminProfile(data.session.user.id, data.session.user.email || '');
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setIsAuthenticated(true);
        fetchAdminProfile(session.user.id, session.user.email || '');
      } else {
        setIsAuthenticated(false);
        setAdminUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchAdminProfile = async (userId: string, email: string) => {
    const { data } = await supabase
      .from('admin_users')
      .select('full_name, email')
      .eq('id', userId)
      .maybeSingle();

    setAdminUser({
      email: email,
      name: data?.full_name || email.split('@')[0],
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // Force full page reload to clear all state and session
    window.location.href = '/admin';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (showSetup) {
      return <AdminSetup onSetupComplete={() => setShowSetup(false)} />;
    }
    return (
      <div>
        <AdminLogin onLoginSuccess={() => setIsAuthenticated(true)} />
        <div className="fixed bottom-4 right-4">
          <button
            onClick={() => setShowSetup(true)}
            className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm border border-orange-500 shadow-lg"
          >
            Create Admin Account
          </button>
        </div>
      </div>
    );
  }

  return <AdminDashboard onLogout={handleLogout} adminUser={adminUser} />;
}

export default App;

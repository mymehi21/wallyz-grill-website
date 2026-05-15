import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import MainApp from './MainApp';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import RestaurantDashboard from './pages/RestaurantDashboard';
import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/admin/*" element={<AdminRoute />} />
        <Route path="*" element={<MainApp />} />
      </Routes>
    </Router>
  );
}

function AdminRoute() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState<{ email: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const [restaurantAccount, setRestaurantAccount] = useState<{
    id: string; username: string; location_id: string; location_name: string;
  } | null>(() => {
    try {
      const saved = sessionStorage.getItem('wallyz_restaurant_session');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setIsAuthenticated(true);
        fetchAdminProfile(data.session.user.id, data.session.user.email || '');
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setIsAuthenticated(true);
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          fetchAdminProfile(session.user.id, session.user.email || '');
        }
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
    setAdminUser({ email, name: data?.full_name || email.split('@')[0] });
  };

  const handleAdminLogout = async () => {
    await supabase.auth.signOut();
    window.location.hash = '#/admin';
  };

  const handleRestaurantLogin = (account: { id: string; username: string; location_id: string; location_name: string }) => {
    sessionStorage.setItem('wallyz_restaurant_session', JSON.stringify(account));
    setRestaurantAccount(account);
  };

  const handleRestaurantLogout = () => {
    sessionStorage.removeItem('wallyz_restaurant_session');
    setRestaurantAccount(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
      </div>
    );
  }

  if (restaurantAccount) {
    return <RestaurantDashboard account={restaurantAccount} onLogout={handleRestaurantLogout} />;
  }

  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={() => setIsAuthenticated(true)} onRestaurantLogin={handleRestaurantLogin} />;
  }

  return <AdminDashboard onLogout={handleAdminLogout} adminUser={adminUser} />;
}

export default App;

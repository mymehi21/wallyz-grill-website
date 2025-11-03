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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data } = await supabase.auth.getSession();
    setIsAuthenticated(!!data.session);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
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
            Setup Admin Account
          </button>
        </div>
      </div>
    );
  }

  return <AdminDashboard onLogout={handleLogout} />;
}

export default App;

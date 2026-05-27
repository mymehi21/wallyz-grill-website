import { useState, useEffect } from 'react';
import { LocationProvider } from './contexts/LocationContext';
import { CartProvider } from './contexts/CartContext';

import Navigation from './components/Navigation';
import Hero from './components/Hero';
import About from './components/About';
import Contact from './components/Contact';
import Footer from './components/Footer';

import MenuPage from './pages/MenuPage';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import OrderFailed from './pages/OrderFailed';
import Catering from './pages/Catering';
import Reviews from './pages/Reviews';
import Careers from './pages/Careers';
import TestData from './pages/TestData';
import RestaurantLogin from './pages/RestaurantLogin';
import RestaurantDashboard from './pages/RestaurantDashboard';

// Check if we're on the restaurant portal path
const isRestaurantPortal = () => {
  return window.location.pathname.includes('/restaurant') ||
    window.location.hash === '#restaurant' ||
    new URLSearchParams(window.location.search).get('portal') === 'restaurant';
};

export default function MainApp() {
  const [restaurantAccount, setRestaurantAccount] = useState<any>(null);
  const [showRestaurantPortal, setShowRestaurantPortal] = useState(isRestaurantPortal);

  const [currentPage, setCurrentPage] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('order_success') === 'true') return 'order-success';
    if (params.get('order_failed') === 'true') return 'order-failed';
    return 'home';
  });

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Restaurant Portal ──────────────────────────────────────────────
  if (showRestaurantPortal) {
    if (!restaurantAccount) {
      return <RestaurantLogin onLogin={setRestaurantAccount} />;
    }
    return (
      <RestaurantDashboard
        account={restaurantAccount}
        onLogout={() => { setRestaurantAccount(null); }}
      />
    );
  }

  return (
    <LocationProvider>
      <CartProvider>
        <div className="min-h-screen">
          <Navigation currentPage={currentPage} onNavigate={handleNavigate} />
          <main>
            {currentPage === 'home' && <Hero onNavigate={handleNavigate} />}
            {currentPage === 'about' && <About />}
            {currentPage === 'menu' && <MenuPage onNavigate={handleNavigate} />}
            {currentPage === 'cart' && <Cart onNavigate={handleNavigate} />}
            {currentPage === 'checkout' && <Checkout onNavigate={handleNavigate} />}
            {currentPage === 'order-success' && <OrderSuccess onNavigate={handleNavigate} />}
            {currentPage === 'order-failed' && <OrderFailed onNavigate={handleNavigate} />}
            {currentPage === 'catering' && <Catering />}
            {currentPage === 'reviews' && <Reviews />}
            {currentPage === 'careers' && <Careers />}
            {currentPage === 'contact' && <Contact />}
            {currentPage === 'test' && <TestData />}
          </main>
          <Footer currentPage={currentPage} />
        </div>
      </CartProvider>
    </LocationProvider>
  );
}

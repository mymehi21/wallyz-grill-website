import { useState } from 'react';
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
import Catering from './pages/Catering';
import Reviews from './pages/Reviews';
import Careers from './pages/Careers';
import TestData from './pages/TestData';

export default function MainApp() {
  const [currentPage, setCurrentPage] = useState('home');

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

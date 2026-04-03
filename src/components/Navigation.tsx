import { Menu, X, ShoppingCart } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useLocation } from '../contexts/LocationContext';
import { useCart } from '../contexts/CartContext';
import Logo from './Logo';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function Navigation({ currentPage, onNavigate }: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { selectedLocation, locations, setSelectedLocation } = useLocation();
  const { cart } = useCart();
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const rotatingWords = [
    'Authentic Flavors',
    'Fresh Daily',
    'Made with Love',
    'Detroit Style',
    'Quality Ingredients'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % rotatingWords.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleNavigate = (page: string) => {
    onNavigate(page);
    setIsMenuOpen(false);
  };

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About' },
    { id: 'menu', label: 'Menu' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'careers', label: 'Careers' },
    { id: 'contact', label: 'Contact' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <button
            onClick={() => handleNavigate('home')}
            className="flex items-center gap-3 cursor-pointer group hover:scale-105 transition-transform"
          >
            <Logo size={48} />
            <span className="text-2xl font-bold">
              <span className="text-orange-500">WALLYZ</span> <span className="text-white">GRILL</span>
            </span>
          </button>

          <div className="absolute left-1/2 transform -translate-x-1/2 hidden md:block overflow-hidden h-8">
            <div className="text-orange-500 font-semibold text-lg whitespace-nowrap">
              {rotatingWords.map((word, index) => (
                <div
                  key={word}
                  className={`transition-all duration-700 ease-in-out ${
                    index === currentWordIndex
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 absolute -translate-y-4'
                  }`}
                >
                  {word}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Cart Button */}
            {totalItems > 0 && (
              <button
                onClick={() => handleNavigate('cart')}
                className="relative text-white hover:text-orange-500 transition-colors"
              >
                <ShoppingCart size={28} />
                <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                  {totalItems}
                </span>
              </button>
            )}

            {/* Hamburger Button */}
            <button
              className="text-white"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar Menu */}
      <div
        className={`fixed inset-y-0 right-0 w-64 bg-gray-900 border-l border-orange-500 transform transition-transform duration-300 ease-in-out ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold">
              <span className="text-orange-500">MENU</span>
            </h2>
            <button onClick={() => setIsMenuOpen(false)}>
              <X size={24} />
            </button>
          </div>

          <nav className="space-y-2">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  currentPage === item.id
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-orange-500'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

        </div>
      </div>

      {/* Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[-1]"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </header>
  );
}

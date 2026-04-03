import { Menu, X, Phone } from 'lucide-react';
import { useState } from 'react';
import Logo from './Logo';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMenuOpen(false);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-3">
            <Logo size={48} />
            <div className="text-2xl font-bold">
              <span className="text-orange-500">WALLY'Z</span> GRILL
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-8">
            <button onClick={() => scrollToSection('home')} className="hover:text-orange-500 transition-colors">
              Home
            </button>
            <button onClick={() => scrollToSection('about')} className="hover:text-orange-500 transition-colors">
              About
            </button>
            <button onClick={() => scrollToSection('menu')} className="hover:text-orange-500 transition-colors">
              Menu
            </button>
            <button onClick={() => scrollToSection('order')} className="hover:text-orange-500 transition-colors">
              Order
            </button>
            <button onClick={() => scrollToSection('contact')} className="hover:text-orange-500 transition-colors">
              Contact
            </button>
            <a href="tel:2489939330" className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-lg transition-colors">
              <Phone size={18} />
              <span>(248) 993-9330</span>
            </a>
          </nav>

          <button
            className="md:hidden text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-black border-t border-gray-800">
          <nav className="container mx-auto px-4 py-4 flex flex-col space-y-4">
            <button onClick={() => scrollToSection('home')} className="text-left hover:text-orange-500 transition-colors py-2">
              Home
            </button>
            <button onClick={() => scrollToSection('about')} className="text-left hover:text-orange-500 transition-colors py-2">
              About
            </button>
            <button onClick={() => scrollToSection('menu')} className="text-left hover:text-orange-500 transition-colors py-2">
              Menu
            </button>
            <button onClick={() => scrollToSection('order')} className="text-left hover:text-orange-500 transition-colors py-2">
              Order
            </button>
            <button onClick={() => scrollToSection('contact')} className="text-left hover:text-orange-500 transition-colors py-2">
              Contact
            </button>
            <a href="tel:2489939330" className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-lg transition-colors w-fit">
              <Phone size={18} />
              <span>(248) 993-9330</span>
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}

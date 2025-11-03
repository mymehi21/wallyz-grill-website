import { Phone, Mail, MapPin, Instagram } from 'lucide-react';
import { useLocation } from '../contexts/LocationContext';

export default function Footer({ currentPage = 'home' }: { currentPage?: string }) {
  const { selectedLocation } = useLocation();
  const isContactPage = currentPage === 'contact';
  return (
    <footer className="bg-black text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-2xl font-bold mb-4">
              <span className="text-orange-500">WALLYZ</span> GRILL
            </h3>
            <p className="text-gray-400 mb-4">
              Fresh, delicious food made with love. Serving the community with quality meals for pickup and catering.
            </p>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4 text-orange-500">{isContactPage ? 'Contact Info' : 'Location'}</h4>
            <div className="space-y-3">
              {isContactPage && (
                <>
                  <a href={`tel:${selectedLocation.phone.replace(/[^0-9]/g, '')}`} className="flex items-center space-x-3 text-gray-300 hover:text-orange-500 transition-colors">
                    <Phone size={18} />
                    <span>{selectedLocation.phone}</span>
                  </a>
                  <a href="mailto:wallyzgrill@gmail.com" className="flex items-center space-x-3 text-gray-300 hover:text-orange-500 transition-colors">
                    <Mail size={18} />
                    <span>wallyzgrill@gmail.com</span>
                  </a>
                </>
              )}
              <a
                href={selectedLocation.directions}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start space-x-3 text-gray-300 hover:text-orange-500 transition-colors cursor-pointer"
              >
                <MapPin size={18} className="mt-1 flex-shrink-0" />
                <span>{selectedLocation.address}</span>
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4 text-orange-500">Follow Us</h4>
            <div className="space-y-3">
              <a
                href="https://instagram.com/Wallyzgrill"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-3 text-gray-300 hover:text-orange-500 transition-colors"
              >
                <Instagram size={18} />
                <span>@Wallyzgrill</span>
              </a>
              <a
                href="https://tiktok.com/@Wallyzgrill"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-3 text-gray-300 hover:text-orange-500 transition-colors"
              >
                <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
                <span>@Wallyzgrill</span>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} Wallyz Grill. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

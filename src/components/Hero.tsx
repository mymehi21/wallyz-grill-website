import { ChefHat, Truck, MapPin } from 'lucide-react';
import { useLocation } from '../contexts/LocationContext';
import Logo from './Logo';

interface HeroProps {
  onNavigate: (page: string) => void;
}

export default function Hero({ onNavigate }: HeroProps) {
  const { selectedLocation, locations, setSelectedLocation } = useLocation();

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black text-white pt-20">
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center opacity-30"
        style={{
          backgroundImage: 'url(https://images.pexels.com/photos/1639562/pexels-photo-1639562.jpeg?auto=compress&cs=tinysrgb&w=1920)'
        }}
      ></div>
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-40"
      >
        <source src="https://videos.pexels.com/video-files/3298843/3298843-uhd_2560_1440_30fps.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-gray-900/30 to-black/40"></div>

      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-8 animate-float">
            <Logo size={160} />
          </div>

          <p className="text-xl md:text-2xl text-gray-300 mb-8 animate-fadeInUp" style={{ animationDelay: '0.2s', opacity: 0 }}>
            Authentic Flavors, Made Fresh Daily
          </p>

          <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto animate-fadeInUp" style={{ animationDelay: '0.4s', opacity: 0 }}>
            Experience the perfect blend of quality ingredients and culinary passion. Available for pickup and catering to make your events memorable.
          </p>

          {/* Location Selector */}
          <div className="bg-black bg-opacity-50 backdrop-blur-sm rounded-lg border border-orange-500 p-4 mb-12 max-w-md mx-auto">
            <div className="flex items-center gap-3 mb-3">
              <MapPin className="text-orange-500 flex-shrink-0" size={20} />
              <h3 className="text-lg font-semibold">Store Location</h3>
            </div>

            <select
              value={selectedLocation.id}
              onChange={(e) => {
                const location = locations.find(loc => loc.id === e.target.value);
                if (location) setSelectedLocation(location);
              }}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 mb-2"
            >
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}{loc.comingSoon ? ' (Coming Soon)' : ''}
                </option>
              ))}
            </select>

            <p className="text-sm text-gray-400">{selectedLocation.address}</p>
            {!selectedLocation.comingSoon && (
              <a
                href={selectedLocation.directions}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-orange-500 hover:text-orange-400 inline-block mt-1"
              >
                Get Directions →
              </a>
            )}
          </div>

          {selectedLocation.comingSoon ? (
            <div className="bg-yellow-500 bg-opacity-20 backdrop-blur-sm border-2 border-yellow-500 rounded-lg p-6 max-w-2xl mx-auto">
              <p className="text-yellow-400 text-lg font-semibold">
                🎉 This location is coming soon! Stay tuned for updates.
              </p>
              <p className="text-gray-300 mt-2">
                In the meantime, please select our Oak Park location to place orders.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <button
                onClick={() => onNavigate('menu')}
                className="bg-black bg-opacity-50 backdrop-blur-sm p-6 rounded-lg border-2 border-orange-500 hover:bg-orange-500 hover:bg-opacity-20 transition-all transform hover:scale-105 cursor-pointer animate-fadeInLeft"
                style={{ animationDelay: '0.6s', opacity: 0 }}
              >
                <Truck className="text-orange-500 mb-3 mx-auto animate-pulse-slow" size={32} />
                <h3 className="text-xl font-semibold mb-2">Pickup Orders</h3>
                <p className="text-gray-400">Quick and convenient pickup service available</p>
              </button>
              <button
                onClick={() => onNavigate('catering')}
                className="bg-black bg-opacity-50 backdrop-blur-sm p-6 rounded-lg border-2 border-orange-500 hover:bg-orange-500 hover:bg-opacity-20 transition-all transform hover:scale-105 cursor-pointer animate-fadeInRight"
                style={{ animationDelay: '0.6s', opacity: 0 }}
              >
                <ChefHat className="text-orange-500 mb-3 mx-auto animate-pulse-slow" size={32} />
                <h3 className="text-xl font-semibold mb-2">Catering Services</h3>
                <p className="text-gray-400">Perfect for events, parties, and gatherings</p>
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

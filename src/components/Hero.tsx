import { MapPin } from 'lucide-react';
import { useLocation } from '../contexts/LocationContext';
import Logo from './Logo';
import { useCart } from '../contexts/CartContext';

interface HeroProps {
  onNavigate: (page: string) => void;
}

export default function Hero({ onNavigate }: HeroProps) {
  const { selectedLocation, locations, setSelectedLocation } = useLocation();
  const { setLocationId } = useCart();

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center text-white pt-20 overflow-hidden">
      {/* Video background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ filter: 'brightness(0.35) saturate(1.1)' }}
      >
        <source src="/background.mov" type="video/mp4" />
        <source src="/background.mov" type="video/quicktime" />
      </video>

      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />

      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">

          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Logo size={180} className="drop-shadow-2xl" />
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-3 tracking-tight drop-shadow-lg">
            WALLYZ <span className="text-orange-500">GRILL</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-200 mb-8 font-light tracking-wide">
            Authentic Flavors, Made Fresh Daily
          </p>

          <p className="text-lg text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
            Experience the perfect blend of quality ingredients and culinary passion.
            Available for pickup and catering to make your events memorable.
          </p>

          {/* Location Selector */}
          <div className="bg-black/60 backdrop-blur-md rounded-xl border border-orange-500/60 p-5 mb-12 max-w-md mx-auto shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <MapPin className="text-orange-500 flex-shrink-0" size={20} />
              <h3 className="text-lg font-semibold">Choose Your Location</h3>
            </div>
            <select
              value={selectedLocation.id}
              onChange={(e) => {
                const location = locations.find(loc => loc.id === e.target.value);
                if (location) { setSelectedLocation(location); setLocationId(location.id); }
              }}
              className="w-full bg-gray-900/80 border border-orange-500/50 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => onNavigate('menu')}
              className="bg-orange-500 hover:bg-orange-600 text-white px-10 py-4 rounded-xl text-lg font-bold transition-all duration-200 shadow-lg hover:shadow-orange-500/30 hover:scale-105 active:scale-95"
            >
              Order Now
            </button>
            <button
              onClick={() => onNavigate('catering')}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 hover:border-orange-500/60 text-white px-10 py-4 rounded-xl text-lg font-bold transition-all duration-200"
            >
              Catering & Party Trays
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

import { MapPin } from 'lucide-react';
import { useLocation } from '../contexts/LocationContext';

export default function LocationGate() {
  const { locations, setSelectedLocation } = useLocation();

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-md">
        <div className="bg-black/80 backdrop-blur-md rounded-2xl border-2 border-orange-500 p-8 shadow-2xl">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="bg-orange-500/20 rounded-full p-4 mb-4">
              <MapPin className="text-orange-500" size={40} />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Welcome to Wally'z Grill</h1>
            <p className="text-gray-300 text-sm">
              Please select a location to begin your order
            </p>
          </div>

          <div className="space-y-3">
            {locations.map(loc => (
              <button
                key={loc.id}
                onClick={() => setSelectedLocation(loc)}
                className="w-full bg-gray-900/80 hover:bg-orange-500 border-2 border-orange-500/50 hover:border-orange-500 text-white rounded-xl p-4 transition-all duration-200 text-left group"
              >
                <div className="flex items-center gap-3">
                  <MapPin className="text-orange-500 group-hover:text-white flex-shrink-0" size={24} />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base">{loc.name}</h3>
                    <p className="text-xs text-gray-300 group-hover:text-orange-100 mt-1 truncate">{loc.address}</p>
                    <p className="text-xs text-gray-400 group-hover:text-orange-50 mt-0.5">{loc.phone}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            You can change your location anytime from the menu
          </p>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { ShoppingCart, MapPin, UtensilsCrossed, Clock } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useLocation } from '../contexts/LocationContext';
import { supabase, MenuItem, MenuCategory } from '../lib/supabase';
import MenuItemCustomizer, { Customization } from '../components/MenuItemCustomizer';
import { fetchHoursForLocation, isRestaurantOpen, formatHour, BusinessHour } from '../utils/hoursUtils';

interface MenuPageProps {
  onNavigate: (page: string, itemIdToCustomize?: string) => void;
  customizeItemId?: string | null;
  onCustomizeConsumed?: () => void;
}

export default function MenuPage({ onNavigate, customizeItemId, onCustomizeConsumed }: MenuPageProps) {
  const { cart, addToCart } = useCart();
  const { selectedLocation, locations, setSelectedLocation } = useLocation();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  // Auto-open customizer when navigated with a specific item ID (from DiscountBanner)
  useEffect(() => {
    if (!customizeItemId || menuItems.length === 0) return;
    const found = menuItems.find(i => i.id === customizeItemId);
    if (found) {
      setSelectedItem(found);
      onCustomizeConsumed?.();
    }
  }, [customizeItemId, menuItems, onCustomizeConsumed]);
  const [hours, setHours] = useState<BusinessHour[]>([]);
  const [isOpen, setIsOpen] = useState(true);
  const [closedMessage, setClosedMessage] = useState('');

  useEffect(() => {
    fetchMenuData();
  }, []);

  useEffect(() => {
    fetchHoursForLocation(selectedLocation.id, supabase).then(h => {
      setHours(h);
      const { open, message } = isRestaurantOpen(h);
      setIsOpen(open);
      setClosedMessage(message);
    });
  }, [selectedLocation.id]);

  const fetchMenuData = async () => {
    try {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('is_active', true)
        .neq('name', 'Party Trays')
        .order('display_order');

      const { data: itemsData, error: itemsError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('is_available', true)
        .order('display_order');

      if (categoriesError) throw categoriesError;
      if (itemsError) throw itemsError;

      const filteredCategories = categoriesData || [];
      const filteredItems = (itemsData || []).filter(item => {
        const category = filteredCategories.find(cat => cat.id === item.category_id);
        return category !== undefined;
      });

      setCategories(filteredCategories);
      setMenuItems(filteredItems);
    } catch (error) {
      console.error('Error fetching menu:', error);
    } finally {
      setLoading(false);
    }
  };

  const getItemsByCategory = (categoryId: string) => {
    return menuItems.filter(item => item.category_id === categoryId);
  };

  const handleAddToCart = (item: MenuItem, quantity: number, customizations: Customization) => {
    const proteinCost = customizations.addedProteins.reduce((sum, p) => sum + p.price, 0);
    const totalPrice = item.price + proteinCost;

    addToCart({
      id: `${item.id}-${Date.now()}`,
      name: item.name,
      price: totalPrice,
      quantity: quantity,
      customizations: {
        remove: customizations.removedIngredients,
        add: customizations.addedProteins.map(p => p.name),
      },
    });

    setSelectedItem(null);
  };

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  if (loading) {
    return (
      <section className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white py-20 pt-28 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading menu...</p>
        </div>
      </section>
    );
  }

  return (
    <section id="menu" className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white py-20 pt-28">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Location Selector */}
          <div className="bg-gray-800 rounded-lg border border-orange-500 p-4 mb-8">
            <div className="flex items-center gap-3 mb-3">
              <MapPin className="text-orange-500 flex-shrink-0" size={20} />
              <h3 className="text-lg font-semibold">Pickup Location</h3>
            </div>

            <select
              value={selectedLocation.id}
              onChange={(e) => {
                const location = locations.find(loc => loc.id === e.target.value);
                if (location) setSelectedLocation(location);
              }}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 mb-2"
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

          {selectedLocation.comingSoon && (
            <div className="bg-yellow-500 bg-opacity-20 backdrop-blur-sm border-2 border-yellow-500 rounded-lg p-6 mb-8">
              <p className="text-yellow-400 text-lg font-semibold">
                🎉 This location is coming soon!
              </p>
              <p className="text-gray-300 mt-2">
                Please select our Oak Park location to place pickup orders.
              </p>
            </div>
          )}

          {/* Hours banner */}
          {hours.length > 0 && (
            <div className={`rounded-lg p-4 mb-8 border ${isOpen ? 'bg-green-500 bg-opacity-10 border-green-500' : 'bg-red-500 bg-opacity-10 border-red-500'}`}>
              <div className="flex items-center gap-3 mb-3">
                <Clock className={isOpen ? 'text-green-400' : 'text-red-400'} size={20} />
                <span className={`font-semibold text-lg ${isOpen ? 'text-green-400' : 'text-red-400'}`}>
                  {isOpen ? '🟢 We\'re Open Now' : '🔴 Currently Closed'}
                </span>
              </div>
              {!isOpen && <p className="text-gray-300 text-sm mb-3">{closedMessage}</p>}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {hours.map(h => (
                  <div key={h.day} className="text-xs">
                    <span className="text-gray-400 font-semibold">{h.day.slice(0, 3)}: </span>
                    {h.closed
                      ? <span className="text-red-400">Closed</span>
                      : <span className="text-gray-300">{formatHour(h.open)} – {formatHour(h.close)}</span>
                    }
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mb-12">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Our <span className="text-orange-500">Menu</span>
              </h1>
              <p className="text-gray-400 text-lg">Add items to your cart for pickup</p>
            </div>

            <button
              onClick={() => onNavigate('cart')}
              className="relative bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              <ShoppingCart size={24} />
              Cart
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>

          {categories.length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-12 text-center border border-gray-700">
              <UtensilsCrossed className="text-orange-500 mx-auto mb-4" size={64} />
              <h3 className="text-2xl font-semibold mb-4">Menu Coming Soon</h3>
              <p className="text-gray-400">
                We're preparing our delicious menu for you. Check back soon!
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {categories.map(category => {
                const items = getItemsByCategory(category.id);
                if (items.length === 0) return null;

                return (
                  <div key={category.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <h2 className="text-2xl font-bold mb-2 text-orange-500">{category.name}</h2>
                    {category.description && (
                      <p className="text-gray-400 mb-4 text-sm">{category.description}</p>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {items.map(item => (
                        <div
                          key={item.id}
                          className={`bg-gray-900 rounded-lg p-4 transition-all ${
                            selectedLocation.comingSoon
                              ? 'opacity-50 cursor-not-allowed'
                              : 'hover:border hover:border-orange-500 cursor-pointer'
                          }`}
                          onClick={() => !selectedLocation.comingSoon && setSelectedItem(item)}
                        >
                          <div className="flex gap-4 items-start">
                            {item.image_url && (
                              <img
                                src={item.image_url}
                                alt={item.name}
                                className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                              />
                            )}
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-white">{item.name}</h3>
                              {item.description && (
                                <p className="text-sm text-gray-400 mt-1 line-clamp-2">{item.description}</p>
                              )}
                              <p className="text-orange-500 font-bold text-lg mt-2">
                                ${item.price.toFixed(2)}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedItem(item);
                            }}
                            className="w-full mt-3 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg font-semibold transition-colors text-sm"
                          >
                            Customize & Add
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {selectedItem && (
            <MenuItemCustomizer
              item={selectedItem}
              onAddToCart={handleAddToCart}
              onClose={() => setSelectedItem(null)}
            />
          )}
        </div>
      </div>
    </section>
  );
}

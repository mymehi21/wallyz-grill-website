import { useState, useEffect } from 'react';
import { useLocation } from '../contexts/LocationContext';
import { supabase } from '../lib/supabase';

interface CateringTray {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
}

interface CateringDiscountBannerProps {
  onNavigate: (page: string) => void;
}

export default function CateringDiscountBanner({ onNavigate }: CateringDiscountBannerProps) {
  const { selectedLocation } = useLocation();
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [trays, setTrays] = useState<CateringTray[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [trayDetails, setTrayDetails] = useState<Record<string, CateringTray[]>>({});

  useEffect(() => {
    const fetchDiscounts = async () => {
      const { data } = await supabase
        .from('discounts')
        .select('*')
        .eq('is_active', true)
        .eq('category', 'party_trays')
        .in('location_id', ['all', selectedLocation.id]);
      setDiscounts(data || []);
    };
    fetchDiscounts();
    const interval = setInterval(fetchDiscounts, 30000);
    return () => clearInterval(interval);
  }, [selectedLocation.id]);

  // Load tray details for item-scope discounts when expanded
  useEffect(() => {
    if (!expanded) return;
    const d = discounts.find(x => x.id === expanded);
    if (!d || d.scope !== 'item' || !d.item_ids || d.item_ids.length === 0) return;
    if (trayDetails[expanded]) return;

    const fetchTrayDetails = async () => {
      const { data } = await supabase
        .from('menu_items')
        .select('id, name, description, price, image_url')
        .in('id', d.item_ids);
      setTrayDetails(prev => ({ ...prev, [expanded]: data || [] }));
    };
    fetchTrayDetails();
  }, [expanded, discounts]);

  // For store-scope discounts, also need to know what trays exist
  useEffect(() => {
    const fetchAllTrays = async () => {
      const { data: cat } = await supabase
        .from('menu_categories')
        .select('id')
        .eq('name', 'Party Trays')
        .maybeSingle();
      if (!cat) return;
      const { data: items } = await supabase
        .from('menu_items')
        .select('id, name, description, price, image_url')
        .eq('category_id', cat.id)
        .eq('is_available', true)
        .order('display_order');
      setTrays(items || []);
    };
    fetchAllTrays();
  }, []);

  if (discounts.length === 0) return null;

  const formatDiscount = (d: any) => {
    if (d.type === 'percentage') return `${d.value}% off`;
    if (d.type === 'fixed') return `$${d.value} off`;
    if (d.type === 'bogo') return 'Buy 1 Get 1 Free';
    return '';
  };

  const goToCatering = () => {
    onNavigate('catering');
    setExpanded(null);
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-sm">
      {discounts.map(d => {
        const isOpen = expanded === d.id;
        const itemsForThis = d.scope === 'item' ? (trayDetails[d.id] || []) : trays;
        return (
          <div key={d.id} className="mb-2 bg-gradient-to-r from-orange-600 to-red-600 rounded-lg shadow-2xl text-white overflow-hidden">
            <button
              onClick={() => setExpanded(isOpen ? null : d.id)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-black/10 transition-colors"
            >
              <div className="text-left">
                <div className="text-xs uppercase tracking-wider opacity-80">🍽️ Catering Special</div>
                <div className="font-bold text-base">{d.name}</div>
                <div className="text-sm">{formatDiscount(d)}</div>
                {d.min_subtotal > 0 && (
                  <div className="text-xs opacity-80">Min order ${d.min_subtotal}</div>
                )}
              </div>
              <div className="text-2xl ml-2">{isOpen ? '▲' : '▼'}</div>
            </button>
            {isOpen && (
              <div className="bg-white text-gray-900 p-3 max-h-80 overflow-y-auto">
                {itemsForThis.length === 0 ? (
                  <div className="text-sm text-gray-500 py-4 text-center">Loading trays...</div>
                ) : (
                  <>
                    <div className="text-xs text-gray-600 mb-2">Tap a tray to order it on the catering page:</div>
                    {itemsForThis.map(tray => (
                      <button
                        key={tray.id}
                        onClick={goToCatering}
                        className="w-full flex items-center gap-2 p-2 hover:bg-orange-50 rounded transition-colors text-left mb-1"
                      >
                        {tray.image_url && (
                          <img src={tray.image_url} alt={tray.name} className="w-12 h-12 object-cover rounded flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm truncate">{tray.name}</div>
                          <div className="text-xs text-orange-600 font-bold">${tray.price.toFixed(2)}</div>
                        </div>
                        <div className="text-orange-500 text-xs font-semibold flex-shrink-0">Order →</div>
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

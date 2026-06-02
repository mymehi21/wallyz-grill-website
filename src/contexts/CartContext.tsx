import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from './LocationContext';
import { supabase } from '../lib/supabase';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  customizations?: { add?: string[]; remove?: string[] };
}

export interface AppliedDiscount {
  id: string;
  name: string;
  type: 'percentage' | 'fixed' | 'bogo';
  value: number;
  scope: 'store' | 'item';
  item_ids: string[];
  min_subtotal?: number;
  category?: 'regular' | 'party_trays';
  savings: number;
}

// Note: regular cart never contains party trays (those go through the Catering page flow)

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  discountedTotal: number;
  appliedDiscounts: AppliedDiscount[];
  totalSavings: number;
  locationId: string;
  activeDiscounts: any[];
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { selectedLocation } = useLocation();
  const locationId = selectedLocation.id;
  const [cart, setCart] = useState<CartItem[]>([]);
  const [allDiscounts, setAllDiscounts] = useState<any[]>([]);

  useEffect(() => {
    const fetchDiscounts = async () => {
      const { data, error } = await supabase
        .from('discounts')
        .select('*')
        .eq('is_active', true);
      if (error) console.error('Discount fetch error:', error);
      else setAllDiscounts(data || []);
    };
    fetchDiscounts();

    // Refresh every 30 seconds so new discounts apply without page reload
    const interval = setInterval(fetchDiscounts, 30000);
    return () => clearInterval(interval);
  }, []);

  const addToCart = (item: CartItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id &&
        JSON.stringify(c.customizations) === JSON.stringify(item.customizations));
      if (existing) {
        return prev.map(c => c.id === item.id &&
          JSON.stringify(c.customizations) === JSON.stringify(item.customizations)
          ? { ...c, quantity: c.quantity + item.quantity } : c);
      }
      return [...prev, item];
    });
  };

  const removeFromCart = (itemId: string) => setCart(prev => prev.filter(i => i.id !== itemId));

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) { removeFromCart(itemId); return; }
    setCart(prev => prev.map(i => i.id === itemId ? { ...i, quantity } : i));
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((t, i) => t + i.price * i.quantity, 0);

  // Filter discounts for current location
  const activeDiscounts = allDiscounts.filter(d =>
    d.location_id === 'all' || d.location_id === locationId
  );

  const computeDiscounts = () => {
    const applied: AppliedDiscount[] = [];
    let totalSavings = 0;

    for (const d of activeDiscounts) {
      // Regular cart only holds non-tray items, so party_trays category discounts never apply here
      const discountCategory = d.category || 'regular';
      if (discountCategory === 'party_trays') continue;
      const scopedCart = cart;
      const scopedSubtotal = scopedCart.reduce((t, i) => t + i.price * i.quantity, 0);

      // Respect minimum spend threshold (against the scoped subtotal, not the whole cart)
      const minSub = Number(d.min_subtotal) || 0;
      if (minSub > 0 && scopedSubtotal < minSub) continue;
      if (scopedSubtotal <= 0) continue;

      let savings = 0;

      if (d.scope === 'store') {
        if (d.type === 'percentage') {
          savings = scopedSubtotal * (d.value / 100);
        } else if (d.type === 'fixed') {
          savings = Math.min(d.value, scopedSubtotal);
        } else if (d.type === 'bogo') {
          const prices = scopedCart.flatMap(item =>
            Array(item.quantity).fill(item.price)
          ).sort((a, b) => b - a);
          for (let i = 1; i < prices.length; i += 2) {
            savings += prices[i];
          }
        }
      } else if (d.scope === 'item') {
        const affectedItems = scopedCart.filter(item => (d.item_ids || []).includes(item.id.split('-').slice(0, 5).join('-')));
        for (const item of affectedItems) {
          if (d.type === 'percentage') {
            savings += item.price * item.quantity * (d.value / 100);
          } else if (d.type === 'fixed') {
            savings += Math.min(d.value * item.quantity, item.price * item.quantity);
          } else if (d.type === 'bogo') {
            const freeCount = Math.floor(item.quantity / 2);
            savings += item.price * freeCount;
          }
        }
      }

      savings = Math.round(savings * 100) / 100;
      if (savings > 0) {
        applied.push({ ...d, savings });
        totalSavings += savings;
      }
    }

    return { appliedDiscounts: applied, totalSavings: Math.round(totalSavings * 100) / 100 };
  };

  const { appliedDiscounts, totalSavings } = computeDiscounts();
  const discountedTotal = Math.max(0, Math.round((cartTotal - totalSavings) * 100) / 100);

  return (
    <CartContext.Provider value={{
      cart, addToCart, removeFromCart, updateQuantity, clearCart,
      cartTotal, discountedTotal, appliedDiscounts, totalSavings,
      locationId, activeDiscounts,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}

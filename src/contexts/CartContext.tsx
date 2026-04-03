import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  customizations?: {
    add?: string[];
    remove?: string[];
  };
}

export interface AppliedDiscount {
  id: string;
  name: string;
  type: 'percentage' | 'fixed' | 'bogo';
  value: number;
  scope: 'store' | 'item';
  item_ids: string[];
  savings: number;
}

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
  setLocationId: (id: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [locationId, setLocationId] = useState('location1');

  useEffect(() => {
    const fetchDiscounts = async () => {
      const { data } = await supabase
        .from('discounts')
        .select('*')
        .eq('is_active', true);
      setDiscounts(data || []);
    };
    fetchDiscounts();
  }, []);

  const addToCart = (item: CartItem) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem =>
        cartItem.id === item.id &&
        JSON.stringify(cartItem.customizations) === JSON.stringify(item.customizations)
      );
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.id === item.id &&
          JSON.stringify(cartItem.customizations) === JSON.stringify(item.customizations)
            ? { ...cartItem, quantity: cartItem.quantity + item.quantity }
            : cartItem
        );
      }
      return [...prevCart, item];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) { removeFromCart(itemId); return; }
    setCart(prevCart => prevCart.map(item => item.id === itemId ? { ...item, quantity } : item));
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  const computeDiscounts = (): { appliedDiscounts: AppliedDiscount[]; totalSavings: number } => {
    const appliedDiscounts: AppliedDiscount[] = [];
    let totalSavings = 0;

    // Filter active discounts for current location
    const activeDiscounts = discounts.filter(d =>
      d.location_id === 'all' || d.location_id === locationId
    );

    for (const d of activeDiscounts) {
      let savings = 0;

      if (d.scope === 'store') {
        if (d.type === 'percentage') {
          savings = cartTotal * (d.value / 100);
        } else if (d.type === 'fixed') {
          savings = Math.min(d.value, cartTotal);
        } else if (d.type === 'bogo') {
          // BOGO: for every 2 items, the cheapest one is free
          const allPrices = cart.flatMap(item =>
            Array(item.quantity).fill(item.price)
          ).sort((a, b) => a - b); // sort ascending (cheapest first)
          // Every 2nd item (0, 2, 4...) is free
          for (let i = 0; i < allPrices.length; i += 2) {
            savings += allPrices[i];
          }
        }
      } else if (d.scope === 'item') {
        const affectedItems = cart.filter(item => d.item_ids.includes(item.id));
        for (const item of affectedItems) {
          const itemTotal = item.price * item.quantity;
          if (d.type === 'percentage') {
            savings += itemTotal * (d.value / 100);
          } else if (d.type === 'fixed') {
            savings += Math.min(d.value * item.quantity, itemTotal);
          } else if (d.type === 'bogo') {
            // BOGO on specific item: buy 1 get 1 free
            const freeCount = Math.floor(item.quantity / 2);
            savings += item.price * freeCount;
          }
        }
      }

      if (savings > 0) {
        appliedDiscounts.push({ ...d, savings: Math.round(savings * 100) / 100 });
        totalSavings += savings;
      }
    }

    return { appliedDiscounts, totalSavings: Math.round(totalSavings * 100) / 100 };
  };

  const { appliedDiscounts, totalSavings } = computeDiscounts();
  const discountedTotal = Math.max(0, Math.round((cartTotal - totalSavings) * 100) / 100);

  return (
    <CartContext.Provider value={{
      cart, addToCart, removeFromCart, updateQuantity, clearCart,
      cartTotal, discountedTotal, appliedDiscounts, totalSavings,
      locationId, setLocationId,
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

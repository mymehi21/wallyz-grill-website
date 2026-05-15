import { useCart } from '../contexts/CartContext';
import { supabase } from '../lib/supabase';
import { Tag, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useEffect } from 'react';

interface MenuItem {
  id: string;
  name: string;
  price: number;
}

export default function DiscountBanner() {
  const { activeDiscounts } = useCart();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [menuItems, setMenuItems] = useState<Record<string, MenuItem>>({});

  const visible = activeDiscounts.filter(d => !dismissed.has(d.id));

  // Fetch menu items referenced by any item-scope discount, once
  useEffect(() => {
    const itemIds = new Set<string>();
    activeDiscounts.forEach(d => {
      if (d.scope === 'item' && Array.isArray(d.item_ids)) {
        d.item_ids.forEach((id: string) => itemIds.add(id));
      }
    });
    if (itemIds.size === 0) return;

    supabase.from('menu_items')
      .select('id, name, price')
      .in('id', Array.from(itemIds))
      .then(({ data }) => {
        if (!data) return;
        const map: Record<string, MenuItem> = {};
        data.forEach(item => { map[item.id] = item; });
        setMenuItems(map);
      });
  }, [activeDiscounts]);

  if (visible.length === 0) return null;

  const formatDiscount = (d: any) => {
    if (d.type === 'percentage') return `${d.value}% OFF`;
    if (d.type === 'fixed') return `$${d.value} OFF`;
    if (d.type === 'bogo') return 'BUY 1 GET 1 FREE';
    return '';
  };

  const formatScope = (d: any) => {
    if (d.scope === 'store') return 'on your entire order';
    return 'on selected items — tap to see';
  };

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="fixed left-4 bottom-24 z-40 flex flex-col gap-2 max-w-xs">
      {visible.map(d => {
        const isItemScope = d.scope === 'item';
        const isOpen = expanded.has(d.id);
        const items = isItemScope
          ? (d.item_ids || []).map((id: string) => menuItems[id]).filter(Boolean)
          : [];

        return (
          <div key={d.id}
            className="bg-orange-500 text-white rounded-xl shadow-2xl border border-orange-400 overflow-hidden"
            style={{ animation: 'slideIn 0.4s ease-out' }}>
            <style>{`
              @keyframes slideIn {
                from { transform: translateX(-100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
              }
            `}</style>
            <div
              className={`p-4 flex items-start gap-3 ${isItemScope ? 'cursor-pointer hover:bg-orange-600 transition-colors' : ''}`}
              onClick={() => isItemScope && toggleExpand(d.id)}
            >
              <div className="bg-white/20 rounded-lg p-2 flex-shrink-0">
                <Tag size={18} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-lg leading-tight">{formatDiscount(d)}</p>
                <p className="text-orange-100 text-sm font-semibold">{d.name}</p>
                <p className="text-orange-200 text-xs mt-0.5 flex items-center gap-1">
                  {formatScope(d)}
                  {isItemScope && (isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                </p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setDismissed(prev => new Set([...prev, d.id])); }}
                className="text-orange-200 hover:text-white flex-shrink-0 mt-0.5">
                <X size={16} />
              </button>
            </div>

            {isItemScope && isOpen && (
              <div className="bg-orange-600/40 border-t border-orange-400 px-4 py-3 space-y-1.5 max-h-60 overflow-y-auto">
                {items.length === 0 ? (
                  <p className="text-orange-100 text-xs italic">Loading items...</p>
                ) : items.map((item: MenuItem) => (
                  <div key={item.id} className="flex justify-between items-center text-sm">
                    <span className="text-white">{item.name}</span>
                    <span className="text-orange-100 font-semibold">${item.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

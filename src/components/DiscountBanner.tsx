import { useCart } from '../contexts/CartContext';
import { Tag, X } from 'lucide-react';
import { useState } from 'react';

export default function DiscountBanner() {
  const { activeDiscounts } = useCart();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = activeDiscounts.filter(d => !dismissed.has(d.id));
  if (visible.length === 0) return null;

  const formatDiscount = (d: any) => {
    if (d.type === 'percentage') return `${d.value}% OFF`;
    if (d.type === 'fixed') return `$${d.value} OFF`;
    if (d.type === 'bogo') return 'BUY 1 GET 1 FREE';
    return '';
  };

  const formatScope = (d: any) => {
    if (d.scope === 'store') return 'on your entire order';
    return 'on selected items';
  };

  return (
    <div className="fixed left-4 bottom-24 z-40 flex flex-col gap-2 max-w-xs">
      {visible.map(d => (
        <div key={d.id}
          className="bg-orange-500 text-white rounded-xl shadow-2xl p-4 flex items-start gap-3 animate-slideIn border border-orange-400"
          style={{ animation: 'slideIn 0.4s ease-out' }}>
          <style>{`
            @keyframes slideIn {
              from { transform: translateX(-100%); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
          `}</style>
          <div className="bg-white/20 rounded-lg p-2 flex-shrink-0">
            <Tag size={18} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-lg leading-tight">{formatDiscount(d)}</p>
            <p className="text-orange-100 text-sm font-semibold">{d.name}</p>
            <p className="text-orange-200 text-xs mt-0.5">{formatScope(d)} · Applied automatically</p>
          </div>
          <button onClick={() => setDismissed(prev => new Set([...prev, d.id]))}
            className="text-orange-200 hover:text-white flex-shrink-0 mt-0.5">
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}

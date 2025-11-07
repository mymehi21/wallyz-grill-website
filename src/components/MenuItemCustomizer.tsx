import { useState } from 'react';
import { Plus, Minus, X } from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  base_ingredients: string[];
  protein_type: string | null;
  allow_protein_additions: boolean;
  image_url?: string | null;
  customization_options: {
    protein_additions?: Array<{ name: string; price: number }>;
  };
}

interface MenuItemCustomizerProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem, quantity: number, customizations: Customization) => void;
  onClose: () => void;
}

export interface Customization {
  removedIngredients: string[];
  addedProteins: Array<{ name: string; price: number }>;
}

export default function MenuItemCustomizer({ item, onAddToCart, onClose }: MenuItemCustomizerProps) {
  const [quantity, setQuantity] = useState(1);
  const [removedIngredients, setRemovedIngredients] = useState<string[]>([]);
  const [addedProteins, setAddedProteins] = useState<Array<{ name: string; price: number }>>([]);
  const [showFullImage, setShowFullImage] = useState(false);

  const toggleIngredient = (ingredient: string) => {
    setRemovedIngredients(prev =>
      prev.includes(ingredient)
        ? prev.filter(i => i !== ingredient)
        : [...prev, ingredient]
    );
  };

  const toggleProtein = (protein: { name: string; price: number }) => {
    setAddedProteins(prev => {
      const exists = prev.find(p => p.name === protein.name);
      if (exists) {
        return prev.filter(p => p.name !== protein.name);
      }
      return [...prev, protein];
    });
  };

  const calculateTotal = () => {
    const basePrice = item.price * quantity;
    const proteinPrice = addedProteins.reduce((sum, p) => sum + p.price, 0) * quantity;
    return basePrice + proteinPrice;
  };

  const handleSubmit = () => {
    onAddToCart(item, quantity, { removedIngredients, addedProteins });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-orange-500">
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-4 flex justify-between items-start z-10">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white">{item.name}</h2>
            <p className="text-gray-400 text-sm mt-1">{item.description}</p>
            <p className="text-orange-500 font-bold text-xl mt-2">${item.price.toFixed(2)}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 flex-shrink-0"
          >
            <X size={24} />
          </button>
        </div>

        {item.image_url && (
          <div className="px-6 pt-6">
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full max-h-80 object-contain rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setShowFullImage(true)}
              title="Click to enlarge"
            />
          </div>
        )}

        {showFullImage && item.image_url && (
          <div
            className="fixed inset-0 bg-black bg-opacity-95 z-[100] flex items-center justify-center p-4"
            onClick={() => setShowFullImage(false)}
          >
            <button
              onClick={() => setShowFullImage(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 bg-black bg-opacity-50 rounded-full"
            >
              <X size={32} />
            </button>
            <img
              src={item.image_url}
              alt={item.name}
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        <div className="p-6 space-y-6">
          {item.base_ingredients && item.base_ingredients.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">
                Remove Ingredients (Optional)
              </h3>
              <p className="text-sm text-gray-400 mb-3">
                Select any ingredients you'd like to remove
              </p>
              <div className="space-y-2">
                {item.base_ingredients.map(ingredient => (
                  <label
                    key={ingredient}
                    className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg hover:bg-gray-750 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={removedIngredients.includes(ingredient)}
                      onChange={() => toggleIngredient(ingredient)}
                      className="w-5 h-5 rounded border-gray-600 text-orange-500 focus:ring-orange-500"
                    />
                    <span className="text-white">{ingredient}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {item.allow_protein_additions && item.customization_options?.protein_additions && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">
                Add Extra Protein
              </h3>
              <p className="text-sm text-gray-400 mb-3">
                Add additional proteins to your order (extra charge applies)
              </p>
              <div className="space-y-2">
                {item.customization_options.protein_additions.map(protein => (
                  <label
                    key={protein.name}
                    className="flex items-center justify-between gap-3 p-3 bg-gray-800 rounded-lg hover:bg-gray-750 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={addedProteins.some(p => p.name === protein.name)}
                        onChange={() => toggleProtein(protein)}
                        className="w-5 h-5 rounded border-gray-600 text-orange-500 focus:ring-orange-500"
                      />
                      <span className="text-white">{protein.name}</span>
                    </div>
                    <span className="text-orange-500 font-semibold">
                      +${protein.price.toFixed(2)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Quantity</h3>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-lg transition-colors"
              >
                <Minus size={24} />
              </button>
              <span className="text-2xl font-bold text-white w-12 text-center">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-lg transition-colors"
              >
                <Plus size={24} />
              </button>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-900 border-t border-gray-700 p-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg text-gray-400">Total:</span>
            <span className="text-2xl font-bold text-orange-500">
              ${calculateTotal().toFixed(2)}
            </span>
          </div>
          <button
            onClick={handleSubmit}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-lg font-semibold text-lg transition-colors"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

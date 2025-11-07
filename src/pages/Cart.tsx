import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';
import { useCart } from '../contexts/CartContext';

interface CartProps {
  onNavigate: (page: string) => void;
}

export default function Cart({ onNavigate }: CartProps) {
  const { cart, removeFromCart, updateQuantity, cartTotal } = useCart();

  if (cart.length === 0) {
    return (
      <section id="cart" className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white py-20 pt-28">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <ShoppingCart size={64} className="text-gray-600 mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-4">Your Cart is Empty</h1>
            <p className="text-gray-400 mb-8">Add some delicious items from our menu</p>
            <button
              onClick={() => onNavigate('menu')}
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              View Menu
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="cart" className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white py-20 pt-28">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">
            Your <span className="text-orange-500">Cart</span>
          </h1>

          <div className="space-y-4 mb-8">
            {cart.map((item) => (
              <div key={item.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">{item.name}</h3>
                    <p className="text-orange-500 font-bold mt-1">${item.price.toFixed(2)} each</p>

                    {item.customizations && (item.customizations.add?.length || item.customizations.remove?.length) > 0 && (
                      <div className="mt-2 text-sm text-gray-400">
                        {item.customizations.add && item.customizations.add.length > 0 && (
                          <p>Add: {item.customizations.add.join(', ')}</p>
                        )}
                        {item.customizations.remove && item.customizations.remove.length > 0 && (
                          <p>Remove: {item.customizations.remove.join(', ')}</p>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors"
                    >
                      <Minus size={18} />
                    </button>
                    <span className="text-lg font-bold w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-lg transition-colors"
                    >
                      <Plus size={18} />
                    </button>
                  </div>

                  <p className="text-xl font-bold">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-orange-500 mb-8">
            <div className="flex justify-between items-center text-2xl font-bold">
              <span>Total:</span>
              <span className="text-orange-500">${cartTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => onNavigate('menu')}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-colors"
            >
              Add More Items
            </button>
            <button
              onClick={() => onNavigate('checkout')}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold transition-colors"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

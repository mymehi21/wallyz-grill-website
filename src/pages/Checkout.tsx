import { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { useLocation } from '../contexts/LocationContext';
import { supabase } from '../lib/supabase';

interface CheckoutProps {
  onNavigate: (page: string) => void;
}

export default function Checkout({ onNavigate }: CheckoutProps) {
  const { cart, cartTotal, clearCart } = useCart();
  const { selectedLocation } = useLocation();
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    pickup_time: '',
    special_instructions: '',
  });

  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const validateForm = () => {
    const newErrors: Record<string, boolean> = {};

    if (!formData.customer_name.trim()) newErrors.customer_name = true;
    if (!formData.customer_email.trim()) newErrors.customer_email = true;
    if (!formData.customer_phone.trim()) newErrors.customer_phone = true;

    // Validate pickup time only if provided - must not be in the past
    if (formData.pickup_time.trim()) {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const selectedDateTime = new Date(`${today}T${formData.pickup_time}`);

      if (selectedDateTime < now) {
        newErrors.pickup_time = true;
        alert('Pickup time cannot be in the past.');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;
    if (cart.length === 0) {
      alert('Your cart is empty');
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.from('pickup_orders').insert([
        {
          ...formData,
          location_id: selectedLocation.id,
          order_items: cart,
          total_amount: cartTotal,
        },
      ]);

      if (error) throw error;

      alert('Order submitted successfully! We will contact you to confirm.');
      clearCart();
      onNavigate('home');
    } catch (error) {
      console.error('Error submitting order:', error);
      alert('Failed to submit order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <section id="checkout" className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white py-20 pt-28">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4">Your Cart is Empty</h1>
            <p className="text-gray-400 mb-8">Add items to your cart before checking out</p>
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
    <section id="checkout" className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white py-20 pt-28">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">
            Checkout <span className="text-orange-500">Information</span>
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6">
                <h2 className="text-2xl font-bold mb-6">Your Information</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Full Name <span className="text-orange-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.customer_name}
                      onChange={(e) => {
                        setFormData({ ...formData, customer_name: e.target.value });
                        setErrors({ ...errors, customer_name: false });
                      }}
                      className={`w-full px-4 py-3 bg-gray-900 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                        errors.customer_name ? 'border-red-500' : 'border-gray-700'
                      }`}
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Email <span className="text-orange-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.customer_email}
                      onChange={(e) => {
                        setFormData({ ...formData, customer_email: e.target.value });
                        setErrors({ ...errors, customer_email: false });
                      }}
                      className={`w-full px-4 py-3 bg-gray-900 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                        errors.customer_email ? 'border-red-500' : 'border-gray-700'
                      }`}
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Phone Number <span className="text-orange-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.customer_phone}
                      onChange={(e) => {
                        setFormData({ ...formData, customer_phone: e.target.value });
                        setErrors({ ...errors, customer_phone: false });
                      }}
                      className={`w-full px-4 py-3 bg-gray-900 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                        errors.customer_phone ? 'border-red-500' : 'border-gray-700'
                      }`}
                      placeholder="(248) 123-4567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Pickup Time (Optional)
                    </label>
                    <input
                      type="time"
                      value={formData.pickup_time}
                      onChange={(e) => {
                        setFormData({ ...formData, pickup_time: e.target.value });
                        setErrors({ ...errors, pickup_time: false });
                      }}
                      className={`w-full px-4 py-3 bg-gray-900 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                        errors.pickup_time ? 'border-red-500' : 'border-gray-700'
                      }`}
                    />
                    <p className="text-xs text-gray-400 mt-1">Leave blank for ASAP pickup, or specify a time (cannot be in the past)</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Special Instructions
                    </label>
                    <textarea
                      value={formData.special_instructions}
                      onChange={(e) => setFormData({ ...formData, special_instructions: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Any special requests..."
                    />
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => onNavigate('cart')}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-colors"
                    >
                      Back to Cart
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
                    >
                      {submitting ? 'Submitting...' : 'Place Order'}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-gray-800 rounded-lg p-6 border border-orange-500 sticky top-24">
                <h3 className="text-xl font-bold mb-4">Order Summary</h3>

                <div className="space-y-3 mb-6">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.name}</span>
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-700 pt-4 mb-4">
                  <div className="flex justify-between text-xl font-bold">
                    <span>Total:</span>
                    <span className="text-orange-500">${cartTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="bg-gray-900 rounded-lg p-4 text-sm text-gray-400">
                  <p className="mb-2"><strong className="text-white">Pickup Location:</strong></p>
                  <p>{selectedLocation.name}</p>
                  <p>{selectedLocation.address}</p>
                  <p className="mt-2">{selectedLocation.phone}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

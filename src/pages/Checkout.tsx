import { useState, useEffect } from 'react';
import { useCart } from '../contexts/CartContext';
import { useLocation } from '../contexts/LocationContext';
import { supabase } from '../lib/supabase';
import { CreditCard, ShoppingBag, Clock } from 'lucide-react';
import { fetchHoursForLocation, isRestaurantOpen, BusinessHour } from '../utils/hoursUtils';

interface CheckoutProps {
  onNavigate: (page: string) => void;
}

export default function Checkout({ onNavigate }: CheckoutProps) {
  const { cart, cartTotal, discountedTotal, appliedDiscounts, totalSavings } = useCart();
  const { selectedLocation } = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<'info' | 'payment'>('info');
  const [savedOrderId, setSavedOrderId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [hours, setHours] = useState<BusinessHour[]>([]);
  const [closedMessage, setClosedMessage] = useState('');

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    pickup_time: '',
    special_instructions: '',
  });

  const [errors, setErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchHoursForLocation(selectedLocation.id, supabase).then(h => {
      setHours(h);
      const { open, message } = isRestaurantOpen(h);
      if (!open) setClosedMessage(message);
    });
  }, [selectedLocation.id]);

  const validateForm = () => {
    const newErrors: Record<string, boolean> = {};
    if (!formData.customer_name.trim()) newErrors.customer_name = true;
    if (!formData.customer_email.trim()) newErrors.customer_email = true;
    if (!formData.customer_phone.trim()) newErrors.customer_phone = true;
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

  // Step 1: Save order as pending_payment — no Clover interaction yet
  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { open, message } = isRestaurantOpen(hours);
    if (!open) {
      alert(message || 'The restaurant is currently closed. Please try again during business hours.');
      return;
    }

    if (!validateForm()) return;
    if (cart.length === 0) { alert('Your cart is empty'); return; }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.from('pickup_orders').insert([{
        ...formData,
        location_id: selectedLocation.id,
        order_items: cart,
        total_amount: discountedTotal,
        status: 'pending_payment',
      }]).select().single();

      if (error) throw error;
      setSavedOrderId(data.id);
      setStep('payment');
    } catch (err) {
      console.error('Error saving order:', err);
      alert('Failed to save order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Step 2: Create Clover hosted checkout session and redirect customer to pay
  const handlePayWithClover = async () => {
    if (!savedOrderId) return;
    setSubmitting(true);
    setPaymentError(null);

    try {
      const { data, error } = await supabase.functions.invoke('create-clover-order', {
        body: {
          location_id: selectedLocation.id,
          customer_name: formData.customer_name,
          customer_email: formData.customer_email,
          customer_phone: formData.customer_phone,
          pickup_time: formData.pickup_time || 'ASAP',
          special_instructions: formData.special_instructions,
          cart,
          total_amount: discountedTotal,
          order_db_id: savedOrderId,
          origin: window.location.origin,
        },
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || 'Failed to create checkout session');

      if (data?.checkoutUrl) {
        // Redirect customer to Clover's secure payment page
        window.location.href = data.checkoutUrl;
        return;
      }

      // If no checkout URL returned (e.g. localhost testing), show error
      throw new Error('No payment URL returned. Please try again.');

    } catch (err: any) {
      console.error('Payment error:', err);
      setPaymentError(err.message || 'Failed to start payment. Please try again.');
      // Do NOT mark order as confirmed — leave as pending_payment
    } finally {
      setSubmitting(false);
    }
  };

  if (cart.length === 0 && step === 'info') {
    return (
      <section className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white py-20 pt-28">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <ShoppingBag size={64} className="text-gray-600 mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-4">Your Cart is Empty</h1>
            <p className="text-gray-400 mb-8">Add items to your cart before checking out</p>
            <button onClick={() => onNavigate('menu')} className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
              View Menu
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (closedMessage && step === 'info') {
    return (
      <section className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white py-20 pt-28">
        <div className="container mx-auto px-4">
          <div className="max-w-lg mx-auto text-center">
            <Clock size={80} className="text-orange-500 mx-auto mb-6" />
            <h1 className="text-4xl font-bold mb-4">We're Currently Closed</h1>
            <p className="text-gray-300 text-lg mb-8">{closedMessage}</p>
            <button onClick={() => onNavigate('menu')} className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
              Back to Menu
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white py-20 pt-28">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${step === 'info' ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'}`}>
              <span>{step === 'info' ? '1' : '✓'}</span> Your Info
            </div>
            <div className="flex-1 h-px bg-gray-700"></div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${step === 'payment' ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-400'}`}>
              <span>2</span> Payment
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {step === 'info' && (
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <h2 className="text-2xl font-bold mb-6">Your Information</h2>
                  <form onSubmit={handleInfoSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Full Name <span className="text-orange-500">*</span></label>
                      <input type="text" value={formData.customer_name}
                        onChange={(e) => { setFormData({ ...formData, customer_name: e.target.value }); setErrors({ ...errors, customer_name: false }); }}
                        className={`w-full px-4 py-3 bg-gray-900 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 ${errors.customer_name ? 'border-red-500' : 'border-gray-700'}`}
                        placeholder="John Doe" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Email <span className="text-orange-500">*</span></label>
                      <input type="email" value={formData.customer_email}
                        onChange={(e) => { setFormData({ ...formData, customer_email: e.target.value }); setErrors({ ...errors, customer_email: false }); }}
                        className={`w-full px-4 py-3 bg-gray-900 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 ${errors.customer_email ? 'border-red-500' : 'border-gray-700'}`}
                        placeholder="john@example.com" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Phone Number <span className="text-orange-500">*</span></label>
                      <input type="tel" value={formData.customer_phone}
                        onChange={(e) => { setFormData({ ...formData, customer_phone: e.target.value }); setErrors({ ...errors, customer_phone: false }); }}
                        className={`w-full px-4 py-3 bg-gray-900 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 ${errors.customer_phone ? 'border-red-500' : 'border-gray-700'}`}
                        placeholder="(248) 123-4567" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Pickup Time (Optional)</label>
                      <input type="time" value={formData.pickup_time}
                        onChange={(e) => { setFormData({ ...formData, pickup_time: e.target.value }); setErrors({ ...errors, pickup_time: false }); }}
                        className={`w-full px-4 py-3 bg-gray-900 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 ${errors.pickup_time ? 'border-red-500' : 'border-gray-700'}`} />
                      <p className="text-xs text-gray-400 mt-1">Leave blank for ASAP pickup</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Special Instructions</label>
                      <textarea value={formData.special_instructions}
                        onChange={(e) => setFormData({ ...formData, special_instructions: e.target.value })}
                        rows={3} className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Any special requests..." />
                    </div>
                    <div className="flex gap-4">
                      <button type="button" onClick={() => onNavigate('cart')} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-colors">
                        Back to Cart
                      </button>
                      <button type="submit" disabled={submitting} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50">
                        {submitting ? 'Saving...' : 'Continue to Payment →'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {step === 'payment' && (
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <h2 className="text-2xl font-bold mb-2">Payment</h2>
                  <p className="text-gray-400 mb-6">
                    You will be redirected to Clover's secure payment page. After payment, your order will be sent directly to the restaurant.
                  </p>

                  <div className="bg-gray-900 rounded-lg p-4 mb-6 border border-gray-700">
                    <p className="text-sm text-gray-400 mb-2">Order for:</p>
                    <p className="text-white font-semibold">{formData.customer_name}</p>
                    <p className="text-gray-400 text-sm">{formData.customer_email}</p>
                    <p className="text-gray-400 text-sm">{formData.customer_phone}</p>
                    {formData.pickup_time && <p className="text-orange-400 text-sm mt-1">Pickup: {formData.pickup_time}</p>}
                    {formData.special_instructions && <p className="text-gray-400 text-sm mt-1">Notes: {formData.special_instructions}</p>}
                  </div>

                  <div className="bg-orange-500 bg-opacity-10 border border-orange-500 rounded-lg p-4 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-semibold text-lg">Total Due:</span>
                      <span className="text-orange-500 font-bold text-2xl">${discountedTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  {paymentError && (
                    <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-400 rounded-lg p-4 mb-6 text-sm">
                      {paymentError}
                    </div>
                  )}

                  <button
                    onClick={handlePayWithClover}
                    disabled={submitting}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-lg font-bold text-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    <CreditCard size={24} />
                    {submitting ? 'Redirecting to payment...' : `Pay $${discountedTotal.toFixed(2)} Securely`}
                  </button>

                  <p className="text-center text-gray-500 text-sm mt-3">🔒 Secured by Clover Payments</p>

                  <button onClick={() => setStep('info')} className="w-full mt-4 text-gray-400 hover:text-white text-sm transition-colors py-2">
                    ← Back to Edit Info
                  </button>
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-gray-800 rounded-lg p-6 border border-orange-500 sticky top-24">
                <h3 className="text-xl font-bold mb-4">Order Summary</h3>
                <div className="space-y-3 mb-6">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-300">{item.quantity}x {item.name}</span>
                      <span className="text-white">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-700 pt-4 mb-4">
                  <div className="flex justify-between text-xl font-bold">
                    <span>Total:</span>
                    <span className="text-orange-500">${discountedTotal.toFixed(2)}</span>
                  </div>
                </div>
                <div className="bg-gray-900 rounded-lg p-4 text-sm text-gray-400">
                  <p className="mb-1"><strong className="text-white">Pickup Location:</strong></p>
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

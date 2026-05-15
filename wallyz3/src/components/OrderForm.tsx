import { useState, useEffect } from 'react';
import { supabase, Location } from '../lib/supabase';
import { MapPin, Clock, User, Mail, Phone, MessageSquare, ShoppingBag, Users, CheckCircle, AlertCircle } from 'lucide-react';

export default function OrderForm() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    location_id: '',
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    order_type: 'pickup' as 'pickup' | 'catering',
    pickup_date: '',
    pickup_time: '',
    special_instructions: '',
  });

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      setLocations(data || []);
      if (data && data.length > 0) {
        setFormData(prev => ({ ...prev, location_id: data[0].id }));
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess(false);

    try {
      const pickupDateTime = new Date(`${formData.pickup_date}T${formData.pickup_time}`);

      const orderData = {
        location_id: formData.location_id,
        customer_name: formData.customer_name,
        customer_email: formData.customer_email,
        customer_phone: formData.customer_phone,
        order_type: formData.order_type,
        pickup_time: pickupDateTime.toISOString(),
        special_instructions: formData.special_instructions || null,
        total_amount: 0,
        status: 'pending',
      };

      const { data, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (error) throw error;

      setSuccess(true);
      setFormData({
        location_id: locations[0]?.id || '',
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        order_type: 'pickup',
        pickup_date: '',
        pickup_time: '',
        special_instructions: '',
      });

      setTimeout(() => setSuccess(false), 5000);
    } catch (error: any) {
      console.error('Error submitting order:', error);
      setError(error.message || 'Failed to submit order. Please try again or call us directly.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <section id="order" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="order" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Place Your <span className="text-orange-500">Order</span>
            </h2>
            <div className="w-24 h-1 bg-orange-500 mx-auto mb-6"></div>
            <p className="text-xl text-gray-600">
              Fill out the form below and we'll get your order ready
            </p>
          </div>

          {success && (
            <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-6 flex items-start space-x-3">
              <CheckCircle className="text-green-500 flex-shrink-0 mt-1" size={24} />
              <div>
                <h3 className="font-semibold text-green-800 mb-1">Order Received!</h3>
                <p className="text-green-700">
                  Thank you for your order. We'll contact you shortly to confirm the details and provide payment information.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-6 flex items-start space-x-3">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-1" size={24} />
              <div>
                <h3 className="font-semibold text-red-800 mb-1">Error</h3>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg shadow-xl p-8 space-y-6">
            <div>
              <label className="flex items-center space-x-2 text-gray-700 font-semibold mb-2">
                <MapPin size={20} className="text-orange-500" />
                <span>Select Location</span>
              </label>
              <select
                name="location_id"
                value={formData.location_id}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                {locations.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.name} - {location.address}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center space-x-2 text-gray-700 font-semibold mb-2">
                <ShoppingBag size={20} className="text-orange-500" />
                <span>Order Type</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, order_type: 'pickup' }))}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.order_type === 'pickup'
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-300 hover:border-orange-300'
                  }`}
                >
                  <ShoppingBag className="mx-auto mb-2 text-orange-500" size={24} />
                  <span className="font-semibold">Pickup</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, order_type: 'catering' }))}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.order_type === 'catering'
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-300 hover:border-orange-300'
                  }`}
                >
                  <Users className="mx-auto mb-2 text-orange-500" size={24} />
                  <span className="font-semibold">Catering</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center space-x-2 text-gray-700 font-semibold mb-2">
                  <User size={20} className="text-orange-500" />
                  <span>Your Name</span>
                </label>
                <input
                  type="text"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="flex items-center space-x-2 text-gray-700 font-semibold mb-2">
                  <Phone size={20} className="text-orange-500" />
                  <span>Phone Number</span>
                </label>
                <input
                  type="tel"
                  name="customer_phone"
                  value={formData.customer_phone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="(248) 123-4567"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center space-x-2 text-gray-700 font-semibold mb-2">
                <Mail size={20} className="text-orange-500" />
                <span>Email Address</span>
              </label>
              <input
                type="email"
                name="customer_email"
                value={formData.customer_email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="john@example.com"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center space-x-2 text-gray-700 font-semibold mb-2">
                  <Clock size={20} className="text-orange-500" />
                  <span>Pickup Date</span>
                </label>
                <input
                  type="date"
                  name="pickup_date"
                  value={formData.pickup_date}
                  onChange={handleChange}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="flex items-center space-x-2 text-gray-700 font-semibold mb-2">
                  <Clock size={20} className="text-orange-500" />
                  <span>Pickup Time</span>
                </label>
                <input
                  type="time"
                  name="pickup_time"
                  value={formData.pickup_time}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center space-x-2 text-gray-700 font-semibold mb-2">
                <MessageSquare size={20} className="text-orange-500" />
                <span>Special Instructions or Menu Items</span>
              </label>
              <textarea
                name="special_instructions"
                value={formData.special_instructions}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Please list the items you'd like to order and any special requests..."
              />
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                <strong>Note:</strong> After submitting your order, we'll call you to confirm the details, discuss your menu selections, and provide payment information.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-lg font-semibold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Order Request'}
            </button>

            <p className="text-center text-gray-600">
              Prefer to order by phone?{' '}
              <a href="tel:2489939330" className="text-orange-500 hover:text-orange-600 font-semibold">
                Call us at (248) 993-9330
              </a>
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}

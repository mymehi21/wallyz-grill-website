import { XCircle } from 'lucide-react';
import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface OrderFailedProps {
  onNavigate: (page: string) => void;
}

export default function OrderFailed({ onNavigate }: OrderFailedProps) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('order_id');

    // Clean up URL
    window.history.replaceState({}, '', window.location.pathname);

    // Mark order as payment_failed in DB
    if (orderId) {
      supabase.from('pickup_orders')
        .update({ status: 'payment_failed' })
        .eq('id', orderId)
        .then(() => console.log('Order marked as payment_failed'));
    }
  }, []);

  return (
    <section className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white py-20 pt-28">
      <div className="container mx-auto px-4">
        <div className="max-w-lg mx-auto text-center">
          <XCircle size={80} className="text-red-500 mx-auto mb-6" />
          <h1 className="text-4xl font-bold mb-4">Payment Failed</h1>
          <p className="text-gray-300 mb-4">
            Your payment was not completed. You have not been charged.
          </p>
          <p className="text-gray-400 mb-8">
            Please try again or contact us at the restaurant if you need help.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => onNavigate('checkout')}
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => onNavigate('home')}
              className="bg-gray-700 hover:bg-gray-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

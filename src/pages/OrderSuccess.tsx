import { useState, useEffect } from 'react';
import { CheckCircle, Loader, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCart } from '../contexts/CartContext';

interface OrderSuccessProps {
  onNavigate: (page: string) => void;
}

type VerifyStatus = 'verifying' | 'paid' | 'paid_clover_sync_failed' | 'unverifiable' | 'failed';

export default function OrderSuccess({ onNavigate }: OrderSuccessProps) {
  const { clearCart } = useCart();
  const [status, setStatus] = useState<VerifyStatus>('verifying');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('order_id');

    // Clean URL immediately
    window.history.replaceState({}, '', window.location.pathname);

    if (!id) {
      // No order ID in redirect — should not happen in normal flow
      setStatus('failed');
      return;
    }

    supabase.functions.invoke('verify-payment', {
      body: { order_id: id },
    }).then(({ data, error }) => {
      if (error || !data?.success) {
        console.error('Payment verification failed:', error || data?.error);

        // Distinguish between unverifiable and outright failure
        if (data?.action === 'contact_restaurant') {
          setStatus('unverifiable');
        } else {
          setStatus('failed');
        }
      } else {
        // Payment verified — clear cart
        clearCart();

        if (data.cloverSyncFailed || data.status === 'paid_clover_sync_failed') {
          setStatus('paid_clover_sync_failed');
        } else {
          setStatus('paid');
        }
      }
    });
  }, []);

  if (status === 'verifying') {
    return (
      <section className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader size={60} className="text-orange-500 mx-auto mb-6 animate-spin" />
          <h1 className="text-3xl font-bold mb-3">Confirming your order...</h1>
          <p className="text-gray-400">Please wait — do not close this page.</p>
        </div>
      </section>
    );
  }

  if (status === 'paid') {
    return (
      <section className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white py-20 pt-28">
        <div className="container mx-auto px-4">
          <div className="max-w-lg mx-auto text-center">
            <CheckCircle size={80} className="text-green-500 mx-auto mb-6" />
            <h1 className="text-4xl font-bold mb-4">Order Confirmed! 🎉</h1>
            <p className="text-gray-300 text-lg mb-4">
              Your payment was successful and your order has been sent to the restaurant.
            </p>
            <p className="text-gray-400 mb-8">
              Check your email for a confirmation with your order details.
            </p>
            <button
              onClick={() => onNavigate('home')}
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (status === 'paid_clover_sync_failed') {
    return (
      <section className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white py-20 pt-28">
        <div className="container mx-auto px-4">
          <div className="max-w-lg mx-auto text-center">
            <AlertTriangle size={80} className="text-yellow-500 mx-auto mb-6" />
            <h1 className="text-4xl font-bold mb-4">Payment Received</h1>
            <p className="text-gray-300 text-lg mb-4">
              Your payment was successful, but there was a technical issue sending the order to the restaurant's system.
            </p>
            <p className="text-gray-400 mb-4">
              Your order has been recorded. Please call the restaurant to confirm they received it.
            </p>
            <div className="bg-gray-800 rounded-lg p-4 mb-8 text-sm text-gray-300">
              <p className="font-semibold text-white mb-1">Oak Park:</p>
              <p>(248) 993-9330</p>
              <p className="font-semibold text-white mt-3 mb-1">Redford:</p>
              <p>(313) 800-1954</p>
            </div>
            <button
              onClick={() => onNavigate('home')}
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (status === 'unverifiable') {
    return (
      <section className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white py-20 pt-28">
        <div className="container mx-auto px-4">
          <div className="max-w-lg mx-auto text-center">
            <AlertTriangle size={80} className="text-yellow-500 mx-auto mb-6" />
            <h1 className="text-4xl font-bold mb-4">Payment Status Unknown</h1>
            <p className="text-gray-300 mb-4">
              We could not verify your payment status with Clover. If you were charged, please contact the restaurant with your order details.
            </p>
            <div className="bg-gray-800 rounded-lg p-4 mb-8 text-sm text-gray-300">
              <p className="font-semibold text-white mb-1">Oak Park:</p>
              <p>(248) 993-9330</p>
              <p className="font-semibold text-white mt-3 mb-1">Redford:</p>
              <p>(313) 800-1954</p>
            </div>
            <button
              onClick={() => onNavigate('home')}
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </section>
    );
  }

  // status === 'failed'
  return (
    <section className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white py-20 pt-28">
      <div className="container mx-auto px-4">
        <div className="max-w-lg mx-auto text-center">
          <div className="text-6xl mb-6">❌</div>
          <h1 className="text-4xl font-bold mb-4">Payment Not Completed</h1>
          <p className="text-gray-300 mb-8">
            Your payment was not verified. You have not been charged. Please try ordering again.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => onNavigate('menu')}
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

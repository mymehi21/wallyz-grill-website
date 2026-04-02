import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLocation } from '../contexts/LocationContext';
import { verifyEmail } from '../utils/emailVerification';

export default function Reviews() {
  const { selectedLocation } = useLocation();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    rating: 5,
    review_text: '',
  });

  const [errors, setErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchReviews();
  }, [selectedLocation]);

  const fetchReviews = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('customer_reviews')
      .select('*')
      .eq('location_id', selectedLocation.id)
      .order('created_at', { ascending: false });

    if (data) setReviews(data);
    setLoading(false);
  };

  const validateForm = async () => {
    const newErrors: Record<string, boolean> = {};

    if (!formData.customer_name.trim()) newErrors.customer_name = true;
    if (!formData.customer_email.trim()) {
      newErrors.customer_email = true;
    } else {
      const emailCheck = await verifyEmail(formData.customer_email);
      if (!emailCheck.valid) {
        newErrors.customer_email = true;
        alert(`Email verification failed: ${emailCheck.message}`);
      }
    }
    if (!formData.review_text.trim()) newErrors.review_text = true;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!(await validateForm())) return;

    setSubmitting(true);

    try {
      const { error } = await supabase.from('customer_reviews').insert([
        {
          ...formData,
          location_id: selectedLocation.id,
        },
      ]);

      if (error) throw error;

      setFormData({
        customer_name: '',
        customer_email: '',
        rating: 5,
        review_text: '',
      });
      setShowForm(false);
      await fetchReviews();
      alert('Thank you for your review! Your review has been posted.');
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="reviews" className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white py-20 pt-28">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Customer <span className="text-orange-500">Reviews</span>
            </h1>
            <p className="text-gray-400 text-lg">See what our customers are saying</p>
          </div>

          {!showForm && (
            <div className="text-center mb-12">
              <button
                onClick={() => setShowForm(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                Leave a Review
              </button>
            </div>
          )}

          {showForm && (
            <div className="bg-gray-800 rounded-lg p-8 mb-12 border border-orange-500">
              <h2 className="text-2xl font-bold mb-6">Share Your Experience</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Your Name <span className="text-orange-500">*</span>
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
                    Rating <span className="text-orange-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormData({ ...formData, rating: star })}
                        className="focus:outline-none"
                      >
                        <Star
                          size={32}
                          className={`${
                            star <= formData.rating
                              ? 'text-orange-500 fill-orange-500'
                              : 'text-gray-600'
                          } transition-colors`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Your Review <span className="text-orange-500">*</span>
                  </label>
                  <textarea
                    value={formData.review_text}
                    onChange={(e) => {
                      setFormData({ ...formData, review_text: e.target.value });
                      setErrors({ ...errors, review_text: false });
                    }}
                    rows={5}
                    className={`w-full px-4 py-3 bg-gray-900 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      errors.review_text ? 'border-red-500' : 'border-gray-700'
                    }`}
                    placeholder="Tell us about your experience..."
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-6">
            {loading ? (
              <div className="text-center text-gray-400 py-12">Loading reviews...</div>
            ) : reviews.length === 0 ? (
              <div className="text-center text-gray-400 py-12">
                <p>No reviews yet. Be the first to share your experience!</p>
              </div>
            ) : (
              reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-orange-500 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-white">{review.customer_name}</h3>
                      <div className="flex items-center gap-1 mt-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={18}
                            className={
                              i < review.rating
                                ? 'text-orange-500 fill-orange-500'
                                : 'text-gray-600'
                            }
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-sm text-gray-400">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-300">{review.review_text}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

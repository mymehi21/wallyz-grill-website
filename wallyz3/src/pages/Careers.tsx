import { useState } from 'react';
import { Briefcase } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Careers() {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    applicant_name: '',
    applicant_email: '',
    applicant_phone: '',
    position_applied: '',
    experience: '',
    availability: '',
    additional_info: '',
  });

  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const positions = [
    'Cook',
    'Kitchen Staff',
    'Cashier',
    'Delivery Driver',
    'Manager',
    'Other',
  ];

  const validateForm = () => {
    const newErrors: Record<string, boolean> = {};

    if (!formData.applicant_name.trim()) newErrors.applicant_name = true;
    if (!formData.applicant_email.trim()) newErrors.applicant_email = true;
    if (!formData.applicant_phone.trim()) newErrors.applicant_phone = true;
    if (!formData.position_applied) newErrors.position_applied = true;
    if (!formData.experience.trim()) newErrors.experience = true;
    if (!formData.availability.trim()) newErrors.availability = true;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const { error } = await supabase.from('job_applications').insert([formData]);

      if (error) throw error;

      alert('Application submitted successfully! We will contact you soon.');
      setFormData({
        applicant_name: '',
        applicant_email: '',
        applicant_phone: '',
        position_applied: '',
        experience: '',
        availability: '',
        additional_info: '',
      });
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="careers" className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white py-20 pt-28">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-full mb-4">
              <Briefcase size={32} />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Join Our <span className="text-orange-500">Team</span>
            </h1>
            <p className="text-gray-400 text-lg">
              We're always looking for passionate individuals to join the Wallyz Grill family
            </p>
          </div>

          <div className="bg-gray-800 rounded-lg p-8 border border-orange-500">
            <h2 className="text-2xl font-bold mb-6">Job Application</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Full Name <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.applicant_name}
                    onChange={(e) => {
                      setFormData({ ...formData, applicant_name: e.target.value });
                      setErrors({ ...errors, applicant_name: false });
                    }}
                    className={`w-full px-4 py-3 bg-gray-900 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      errors.applicant_name ? 'border-red-500' : 'border-gray-700'
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
                    value={formData.applicant_email}
                    onChange={(e) => {
                      setFormData({ ...formData, applicant_email: e.target.value });
                      setErrors({ ...errors, applicant_email: false });
                    }}
                    className={`w-full px-4 py-3 bg-gray-900 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      errors.applicant_email ? 'border-red-500' : 'border-gray-700'
                    }`}
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Phone Number <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.applicant_phone}
                    onChange={(e) => {
                      setFormData({ ...formData, applicant_phone: e.target.value });
                      setErrors({ ...errors, applicant_phone: false });
                    }}
                    className={`w-full px-4 py-3 bg-gray-900 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      errors.applicant_phone ? 'border-red-500' : 'border-gray-700'
                    }`}
                    placeholder="(248) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Position <span className="text-orange-500">*</span>
                  </label>
                  <select
                    value={formData.position_applied}
                    onChange={(e) => {
                      setFormData({ ...formData, position_applied: e.target.value });
                      setErrors({ ...errors, position_applied: false });
                    }}
                    className={`w-full px-4 py-3 bg-gray-900 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      errors.position_applied ? 'border-red-500' : 'border-gray-700'
                    }`}
                  >
                    <option value="">Select a position</option>
                    {positions.map((position) => (
                      <option key={position} value={position}>
                        {position}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Work Experience <span className="text-orange-500">*</span>
                </label>
                <textarea
                  value={formData.experience}
                  onChange={(e) => {
                    setFormData({ ...formData, experience: e.target.value });
                    setErrors({ ...errors, experience: false });
                  }}
                  rows={4}
                  className={`w-full px-4 py-3 bg-gray-900 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    errors.experience ? 'border-red-500' : 'border-gray-700'
                  }`}
                  placeholder="Tell us about your previous work experience..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Availability <span className="text-orange-500">*</span>
                </label>
                <textarea
                  value={formData.availability}
                  onChange={(e) => {
                    setFormData({ ...formData, availability: e.target.value });
                    setErrors({ ...errors, availability: false });
                  }}
                  rows={3}
                  className={`w-full px-4 py-3 bg-gray-900 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    errors.availability ? 'border-red-500' : 'border-gray-700'
                  }`}
                  placeholder="e.g., Monday-Friday 9am-5pm, weekends available, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Additional Information
                </label>
                <textarea
                  value={formData.additional_info}
                  onChange={(e) => setFormData({ ...formData, additional_info: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Cover letter, additional qualifications, etc."
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-lg font-semibold text-lg transition-colors disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

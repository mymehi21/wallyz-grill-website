import { MapPin, Phone, Mail, Clock, Instagram } from 'lucide-react';
import { useLocation } from '../contexts/LocationContext';

export default function Contact() {
  const { selectedLocation } = useLocation();
  return (
    <section id="contact" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Get In <span className="text-orange-500">Touch</span>
            </h2>
            <div className="w-24 h-1 bg-orange-500 mx-auto mb-6"></div>
            <p className="text-xl text-gray-600">
              We'd love to hear from you! Reach out for orders, catering inquiries, or questions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h3 className="text-2xl font-bold mb-6 text-gray-800">Contact Information</h3>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-orange-500 p-3 rounded-lg flex-shrink-0">
                    <Phone className="text-white" size={24} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">Phone</h4>
                    <a href={`tel:${selectedLocation.phone.replace(/[^0-9]/g, '')}`} className="text-orange-500 hover:text-orange-600">
                      {selectedLocation.phone}
                    </a>
                    <p className="text-sm text-gray-600 mt-1">Call us for orders and inquiries</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-orange-500 p-3 rounded-lg flex-shrink-0">
                    <Mail className="text-white" size={24} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">Email</h4>
                    <a href="mailto:wallyzgrill@gmail.com" className="text-orange-500 hover:text-orange-600">
                      wallyzgrill@gmail.com
                    </a>
                    <p className="text-sm text-gray-600 mt-1">Send us your questions</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-orange-500 p-3 rounded-lg flex-shrink-0">
                    <MapPin className="text-white" size={24} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">Location</h4>
                    <p className="text-gray-600">{selectedLocation.address}</p>
                    <a
                      href={selectedLocation.directions}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-500 hover:text-orange-600 text-sm mt-1 inline-block"
                    >
                      Get Directions →
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-orange-500 p-3 rounded-lg flex-shrink-0">
                    <Clock className="text-white" size={24} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">Hours</h4>
                    <p className="text-gray-600">Call for current hours</p>
                    <p className="text-sm text-gray-500 mt-1">Hours may vary</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8">
              <h3 className="text-2xl font-bold mb-6 text-gray-800">Follow Us</h3>
              <p className="text-gray-600 mb-6">
                Stay updated with our latest menu items, special offers, and events by following us on social media!
              </p>

              <div className="space-y-4">
                <a
                  href="https://instagram.com/Wallyzgrill"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-4 p-4 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all group"
                >
                  <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 p-3 rounded-lg">
                    <Instagram className="text-white" size={24} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 group-hover:text-orange-500">Instagram</h4>
                    <p className="text-sm text-gray-600">@Wallyzgrill</p>
                  </div>
                </a>

                <a
                  href="https://tiktok.com/@Wallyzgrill"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-4 p-4 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all group"
                >
                  <div className="bg-black p-3 rounded-lg">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 group-hover:text-orange-500">TikTok</h4>
                    <p className="text-sm text-gray-600">@Wallyzgrill</p>
                  </div>
                </a>
              </div>

              <div className="mt-8 p-6 bg-orange-50 rounded-lg border border-orange-200">
                <h4 className="font-semibold text-gray-800 mb-2">Share Your Experience</h4>
                <p className="text-sm text-gray-600">
                  Tag us in your photos and use #WallyzGrill to be featured on our page!
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg shadow-xl p-8 md:p-12 text-white text-center">
            <h3 className="text-3xl font-bold mb-4">Visit Us Today!</h3>
            <p className="text-lg max-w-2xl mx-auto">
              We look forward to serving you! Call ahead for orders or visit us directly at our location for the freshest, most delicious meals.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

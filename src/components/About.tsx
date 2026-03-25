import { Heart, Users, Award, Clock, MapPin } from 'lucide-react';
 import { useLocation } from '../contexts/LocationContext';

export default function About() {
  const { selectedLocation, locations, setSelectedLocation } = useLocation();
  return (
    <section id="about" className="py-20 bg-gradient-to-br from-black via-gray-900 to-black text-white">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              About <span className="text-orange-500">Wallyz Grill</span>
            </h2>
            <div className="w-24 h-1 bg-orange-500 mx-auto mb-6"></div>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              We're passionate about serving delicious, quality food that brings people together. From quick pickups to full catering services, we're here to make every meal special.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <div className="relative h-96 rounded-lg overflow-hidden shadow-xl">
              <img
                src="https://images.pexels.com/photos/1565982/pexels-photo-1565982.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Delicious food"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col justify-center space-y-6">
              <div className="flex items-start space-x-4 transition-all hover:transform hover:translate-x-2 duration-300">
                <div className="bg-orange-500 p-3 rounded-lg flex-shrink-0 animate-pulse-slow">
                  <Heart className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-white">Made with Love</h3>
                  <p className="text-gray-300">Every dish is prepared with care using fresh, quality ingredients to ensure the best taste in every bite.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 transition-all hover:transform hover:translate-x-2 duration-300">
                <div className="bg-orange-500 p-3 rounded-lg flex-shrink-0 animate-pulse-slow" style={{ animationDelay: '0.5s' }}>
                  <Users className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-white">Catering Excellence</h3>
                  <p className="text-gray-300">From intimate gatherings to large events, we provide full catering services to make your occasion memorable.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 transition-all hover:transform hover:translate-x-2 duration-300">
                <div className="bg-orange-500 p-3 rounded-lg flex-shrink-0 animate-pulse-slow" style={{ animationDelay: '1s' }}>
                  <Clock className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-white">Quick Pickup</h3>
                  <p className="text-gray-300">Order ahead for convenient pickup. Your food will be hot, fresh, and ready when you arrive.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 transition-all hover:transform hover:translate-x-2 duration-300">
                <div className="bg-orange-500 p-3 rounded-lg flex-shrink-0 animate-pulse-slow" style={{ animationDelay: '1.5s' }}>
                  <Award className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-white">Quality Guaranteed</h3>
                  <p className="text-gray-300">We take pride in every meal we serve and stand behind the quality of our food.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-8 md:p-12 text-white text-center shadow-xl border border-orange-400">
            <h3 className="text-3xl font-bold mb-4">Our Mission</h3>
            <p className="text-lg max-w-2xl mx-auto">
              At Wallyz Grill, we believe great food brings people together. Whether you're picking up a quick meal or planning a special event, we're committed to delivering exceptional quality and service every time. Order online for pickup or catering - it's fast, easy, and convenient!
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

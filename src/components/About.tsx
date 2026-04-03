import { Heart, Award, Clock, MapPin, Flame, Users } from 'lucide-react';
import Logo from './Logo';

export default function About() {
  return (
    <section id="about" className="py-20 bg-black text-white">
      {/* Hero banner */}
      <div className="relative h-64 md:h-80 mb-16 overflow-hidden">
        <img
          src="https://images.pexels.com/photos/2097090/pexels-photo-2097090.jpeg?auto=compress&cs=tinysrgb&w=1600"
          alt="Wallyz Grill food"
          className="w-full h-full object-cover"
          style={{ filter: 'brightness(0.4)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80" />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Logo size={90} className="mb-3 drop-shadow-2xl" />
          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight">
            WALLYZ <span className="text-orange-500">GRILL</span>
          </h2>
          <p className="text-gray-300 text-lg mt-2 font-light">Our Story</p>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">

          {/* Story section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20 items-center">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl h-96">
              <img
                src="https://images.pexels.com/photos/3616956/pexels-photo-3616956.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Fresh pickup food"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-4 left-4">
                <span className="bg-orange-500 text-white text-sm font-bold px-3 py-1 rounded-full">Since 2023</span>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-3xl font-bold mb-4">
                  Passion on Every <span className="text-orange-500">Plate</span>
                </h3>
                <div className="w-16 h-1 bg-orange-500 mb-6" />
              </div>
              <p className="text-gray-300 text-lg leading-relaxed">
                At Wallyz Grill, we believe great food starts with great ingredients. Every dish is crafted with care, using fresh produce and time-honored recipes that bring authentic flavors to your table.
              </p>
              <p className="text-gray-400 leading-relaxed">
                From our humble beginnings to two thriving locations in Oak Park and Redford, Michigan, our commitment to quality and community has never wavered. We're more than a restaurant — we're part of your family.
              </p>
              <div className="flex gap-6 pt-2">
                <div className="text-center">
                  <p className="text-3xl font-black text-orange-500">2+</p>
                  <p className="text-gray-400 text-sm">Locations</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-black text-orange-500">5K+</p>
                  <p className="text-gray-400 text-sm">Happy Customers</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-black text-orange-500">100%</p>
                  <p className="text-gray-400 text-sm">Fresh Daily</p>
                </div>
              </div>
            </div>
          </div>

          {/* Values */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-20">
            {[
              { icon: Flame, title: 'Fresh Ingredients', desc: 'We source the freshest ingredients every day. No shortcuts, no compromises.' },
              { icon: Heart, title: 'Made with Love', desc: "Every dish is prepared with the same care we'd give our own family." },
              { icon: Award, title: 'Quality First', desc: 'Flavors that keep our customers coming back for more, every single time.' },
              { icon: Users, title: 'Community Driven', desc: 'Proud to serve the Oak Park and Redford communities since 2023.' },
              { icon: Clock, title: 'Always Fresh', desc: 'Open daily with fresh prep every morning. Never reheated leftovers.' },
              { icon: MapPin, title: 'Pickup Only', desc: 'Order online, pick up fresh. Fast, easy, and always ready on time.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-orange-500/50 transition-colors group">
                <div className="bg-orange-500/10 group-hover:bg-orange-500/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors">
                  <Icon className="text-orange-500" size={24} />
                </div>
                <h4 className="font-bold text-white mb-2">{title}</h4>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* Both locations - always shown */}
          <div className="text-center mb-10">
            <h3 className="text-3xl font-bold mb-2">Find <span className="text-orange-500">Us</span></h3>
            <div className="w-16 h-1 bg-orange-500 mx-auto mb-8" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { name: 'Oak Park', address: '25000 Greenfield Rd', city: 'Oak Park, MI 48237', phone: '(248) 993-9330' },
              { name: 'Redford', address: '25575 5 Mile Rd', city: 'Redford, MI 48239', phone: '(313) 800-1954' },
            ].map(loc => (
              <div key={loc.name} className="bg-gray-900 rounded-2xl p-6 border border-gray-800 hover:border-orange-500/50 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-orange-500 w-10 h-10 rounded-lg flex items-center justify-center">
                    <MapPin size={20} className="text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-white">Wallyz Grill — {loc.name}</h4>
                </div>
                <p className="text-gray-300">{loc.address}</p>
                <p className="text-gray-400 mb-3">{loc.city}</p>
                <p className="text-orange-400 font-semibold">{loc.phone}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

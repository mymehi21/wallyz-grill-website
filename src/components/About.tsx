import { Award, Clock, MapPin, Flame, Truck } from 'lucide-react';
import Logo from './Logo';

export default function About() {
  return (
    <section id="about" className="py-20 bg-black text-white">

      {/* Hero — big logo, no photo */}
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <Logo size={180} className="mb-8 drop-shadow-2xl" />
        <h2 className="text-5xl md:text-7xl font-black tracking-tight mb-3">
          WALLYZ <span className="text-orange-500">GRILL</span>
        </h2>
        <div className="w-24 h-1 bg-orange-500 mx-auto mb-6" />
        <p className="text-gray-400 text-lg font-light max-w-xl">
          Authentic Flavors, Made Fresh Daily — Since 2023
        </p>
      </div>

      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">

          {/* Origin story */}
          <div className="bg-gray-900 rounded-2xl p-8 md:p-12 mb-16 border border-gray-800">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-orange-500/20 p-3 rounded-xl">
                <Truck className="text-orange-500" size={28} />
              </div>
              <h3 className="text-2xl font-bold text-white">How It All Started</h3>
            </div>
            <div className="space-y-4 text-gray-300 text-lg leading-relaxed">
              <p>
                Wallyz Grill was born in <span className="text-orange-400 font-semibold">2023</span> out of a passion for authentic, flame-grilled food. What started as a <span className="text-orange-400 font-semibold">food truck</span> — rolling through the streets of Metro Detroit — quickly became something much bigger.
              </p>
              <p>
                The food truck was where we proved ourselves. Day after day, we served our community fresh, bold flavors that kept people coming back. The lines grew, the word spread, and it became clear: Wallyz Grill was ready for a permanent home.
              </p>
              <p>
                Today we proudly operate two brick-and-mortar locations — <span className="text-orange-400 font-semibold">Oak Park</span> and <span className="text-orange-400 font-semibold">Redford</span>, Michigan — serving the same quality food that started it all, now available for pickup and catering.
              </p>
              <p>
                From a food truck dream to a growing restaurant family — this is just the beginning.
              </p>
            </div>
          </div>

          {/* Values */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-16">
            {[
              { icon: Flame, title: 'Fresh Every Day', desc: 'Every dish is made fresh daily. No shortcuts, no reheated food — ever.' },
              { icon: Award, title: 'Quality First', desc: 'From our food truck days to today, quality has never been a compromise.' },
              { icon: Truck, title: 'Started in a Food Truck', desc: 'Humble beginnings, big flavors. Our food truck roots are part of who we are.' },
              { icon: Clock, title: 'Pickup Only', desc: 'Order online, pick up fresh and fast. Always ready on time.' },
              { icon: MapPin, title: 'Oak Park', desc: '25000 Greenfield Rd, Oak Park, MI 48237\n(248) 993-9330' },
              { icon: MapPin, title: 'Redford', desc: '25575 5 Mile Rd, Redford, MI 48239\n(313) 800-1954' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-orange-500/50 transition-colors group">
                <div className="bg-orange-500/10 group-hover:bg-orange-500/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors">
                  <Icon className="text-orange-500" size={24} />
                </div>
                <h4 className="font-bold text-white mb-2">{title}</h4>
                <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">{desc}</p>
              </div>
            ))}
          </div>

          {/* Both locations */}
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

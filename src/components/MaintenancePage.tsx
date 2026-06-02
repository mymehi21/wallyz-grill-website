import { Wrench } from 'lucide-react';

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-gray-900 border-2 border-orange-500 rounded-2xl p-8 shadow-2xl">
          <div className="flex justify-center mb-6">
            <div className="bg-orange-500/20 rounded-full p-5">
              <Wrench className="text-orange-500" size={48} />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-white mb-3">
            Website Under Construction
          </h1>

          <p className="text-gray-300 text-base mb-6">
            We're making some improvements to serve you better. Please visit us later!
          </p>

          <div className="border-t border-gray-700 pt-6 space-y-2 text-sm text-gray-400">
            <p className="font-semibold text-white">Wally'z Grill</p>
            <p>Oak Park: <a href="tel:2489939330" className="text-orange-500 hover:underline">(248) 993-9330</a></p>
            <p>Redford: <a href="tel:3138001954" className="text-orange-500 hover:underline">(313) 800-1954</a></p>
          </div>

          <p className="mt-6 text-xs text-gray-500">
            Thank you for your patience! 🙏
          </p>
        </div>
      </div>
    </div>
  );
}

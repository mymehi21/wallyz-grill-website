import { useEffect, useState } from 'react';
import { supabase, MenuItem, MenuCategory } from '../lib/supabase';
import { UtensilsCrossed, AlertCircle } from 'lucide-react';

export default function Menu() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMenuData();
  }, []);

  const fetchMenuData = async () => {
    try {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      const { data: itemsData, error: itemsError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('is_available', true)
        .order('display_order');

      if (categoriesError) throw categoriesError;
      if (itemsError) throw itemsError;

      setCategories(categoriesData || []);
      setMenuItems(itemsData || []);
    } catch (error) {
      console.error('Error fetching menu:', error);
    } finally {
      setLoading(false);
    }
  };

  const getItemsByCategory = (categoryId: string) => {
    return menuItems.filter(item => item.category_id === categoryId);
  };

  if (loading) {
    return (
      <section id="menu" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading menu...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="menu" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 animate-fadeInUp">
              Our <span className="animate-shimmer">Menu</span>
            </h2>
            <div className="w-24 h-1 bg-orange-500 mx-auto mb-6 animate-fadeInUp" style={{ animationDelay: '0.2s', opacity: 0 }}></div>
            <p className="text-xl text-gray-600 animate-fadeInUp" style={{ animationDelay: '0.4s', opacity: 0 }}>
              Explore our delicious selection of fresh, made-to-order dishes
            </p>
          </div>

          {categories.length === 0 && menuItems.length === 0 ? (
            <div className="bg-white rounded-lg shadow-lg p-12 text-center">
              <UtensilsCrossed className="text-orange-500 mx-auto mb-4" size={64} />
              <h3 className="text-2xl font-semibold mb-4">Menu Coming Soon</h3>
              <p className="text-gray-600 mb-6">
                We're preparing our delicious menu for you. Check back soon or give us a call to learn about our current offerings!
              </p>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 max-w-md mx-auto">
                <AlertCircle className="text-orange-500 mx-auto mb-3" size={32} />
                <p className="text-gray-700 mb-4">
                  <strong>Want to add menu items?</strong>
                </p>
                <p className="text-sm text-gray-600">
                  Menu items can be added through the database. Contact your developer to add categories and items to display here.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-12">
              {categories.map(category => {
                const items = getItemsByCategory(category.id);
                if (items.length === 0) return null;

                return (
                  <div key={category.id} className="bg-white rounded-lg shadow-lg p-8">
                    <h3 className="text-3xl font-bold mb-2 text-gray-800">{category.name}</h3>
                    {category.description && (
                      <p className="text-gray-600 mb-6">{category.description}</p>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {items.map(item => (
                        <div key={item.id} className="flex gap-4 items-start p-4 hover:bg-gray-50 rounded-lg transition-colors">
                          {item.image_url && (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                            />
                          )}
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-800 mb-1">{item.name}</h4>
                            {item.description && (
                              <p className="text-sm text-gray-600">{item.description}</p>
                            )}
                          </div>
                          <div className="ml-4 flex-shrink-0">
                            <span className="text-lg font-bold text-orange-500">
                              ${item.price.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-12 text-center bg-white rounded-lg shadow-lg p-8">
            <p className="text-gray-600 mb-4">
              Have questions about our menu or dietary accommodations?
            </p>
            <a
              href="tel:2489939330"
              className="inline-block bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Give Us a Call
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

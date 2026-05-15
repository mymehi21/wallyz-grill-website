import { useState, useEffect } from 'react';
import { ChefHat, Truck, Plus, Minus, ShoppingBag, Trash2, Edit, X } from 'lucide-react';
import { supabase, MenuItem } from '../lib/supabase';
import { useLocation } from '../contexts/LocationContext';
import { useCart } from '../contexts/CartContext';
import { verifyEmail } from '../utils/emailVerification';

interface PartyTray {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string | null;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  customizations?: string;
}

export default function Catering() {
  const { selectedLocation } = useLocation();
  const { cart } = useCart();
  const [selectedService, setSelectedService] = useState<'menu' | 'truck' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [partyTrays, setPartyTrays] = useState<PartyTray[]>([]);
  const [selectedTray, setSelectedTray] = useState<string | null>(null);
  const [trayQuantities, setTrayQuantities] = useState<Record<string, number>>({});
  const [showRegularMenu, setShowRegularMenu] = useState(false);
  const [regularMenuItems, setRegularMenuItems] = useState<MenuItem[]>([]);
  const [menuCategories, setMenuCategories] = useState<any[]>([]);
  const [regularCart, setRegularCart] = useState<CartItem[]>([]);
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [customizationText, setCustomizationText] = useState('');
  const [showFullImage, setShowFullImage] = useState(false);

  const [menuOrderData, setMenuOrderData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    event_date: '',
    event_time: '',
    guest_count: '',
    special_instructions: '',
  });

  useEffect(() => {
    if (selectedService === 'menu') {
      fetchPartyTrays();
    }
  }, [selectedService]);

  const fetchPartyTrays = async () => {
    try {
      const { data: categoryData } = await supabase
        .from('menu_categories')
        .select('id')
        .eq('name', 'Party Trays')
        .maybeSingle();

      if (categoryData) {
        const { data: items } = await supabase
          .from('menu_items')
          .select('*')
          .eq('category_id', categoryData.id)
          .eq('is_available', true)
          .order('display_order');

        if (items) {
          const trays = items.map(item => ({
            id: item.id,
            name: item.name,
            description: item.description || '',
            price: item.price,
            image_url: item.image_url
          }));
          setPartyTrays(trays);
        }
      }
    } catch (error) {
      console.error('Error fetching party trays:', error);
    }
  };

  const fetchRegularMenu = async () => {
    try {
      const { data: categories } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('is_active', true)
        .neq('name', 'Party Trays')
        .order('display_order');

      const { data: items } = await supabase
        .from('menu_items')
        .select('*')
        .eq('is_available', true)
        .order('display_order');

      if (categories && items) {
        const filteredItems = items.filter(item => {
          const category = categories.find(cat => cat.id === item.category_id);
          return category !== undefined;
        });
        setMenuCategories(categories);
        setRegularMenuItems(filteredItems);
      }
    } catch (error) {
      console.error('Error fetching regular menu:', error);
    }
  };

  const updateTrayQuantity = (trayId: string, delta: number) => {
    setTrayQuantities(prev => {
      const current = prev[trayId] || 0;
      const newQty = Math.max(0, current + delta);
      return { ...prev, [trayId]: newQty };
    });
  };

  const getTotalTrayQuantity = () => {
    return Object.values(trayQuantities).reduce((sum, qty) => sum + qty, 0);
  };

  const getSelectedTraysText = () => {
    const selected = partyTrays
      .filter(tray => (trayQuantities[tray.id] || 0) > 0)
      .map(tray => `${tray.name} x${trayQuantities[tray.id]}`)
      .join(', ');
    return selected || 'None selected';
  };

  const addToRegularCart = (item: MenuItem, customizations?: string) => {
    setRegularCart(prev => {
      const existingIndex = prev.findIndex(
        cartItem => cartItem.id === item.id && cartItem.customizations === customizations
      );

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex].quantity += 1;
        return updated;
      }

      return [...prev, {
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        customizations
      }];
    });
  };

  const updateCartItemQuantity = (index: number, delta: number) => {
    setRegularCart(prev => {
      const updated = [...prev];
      updated[index].quantity = Math.max(0, updated[index].quantity + delta);
      return updated.filter(item => item.quantity > 0);
    });
  };

  const removeCartItem = (index: number) => {
    setRegularCart(prev => prev.filter((_, i) => i !== index));
  };

  const getTotalRegularQuantity = () => {
    return regularCart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const calculateTotalAmount = () => {
    const trayTotal = partyTrays.reduce((sum, tray) => {
      const qty = trayQuantities[tray.id] || 0;
      return sum + (tray.price * qty);
    }, 0);

    const menuTotal = regularCart.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    return trayTotal + menuTotal;
  };

  const [truckData, setTruckData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    event_date: '',
    event_time: '',
    event_location: '',
    guest_count: '',
    special_instructions: '',
  });

  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const getMinimumDateForPartyTrays = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMinimumDateForFoodTruck = () => {
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
    return twoDaysFromNow.toISOString().split('T')[0];
  };

  const validateMenuOrder = async () => {
    const newErrors: Record<string, boolean> = {};

    if (getTotalTrayQuantity() === 0) {
      alert('Please select at least one catering tray.');
      return false;
    }

    if (!menuOrderData.customer_name.trim()) newErrors.customer_name = true;
    if (!menuOrderData.customer_email.trim()) {
      newErrors.customer_email = true;
    } else {
      const emailCheck = await verifyEmail(menuOrderData.customer_email);
      if (!emailCheck.valid) {
        newErrors.customer_email = true;
        alert(`Email verification failed: ${emailCheck.message}`);
      }
    }
    if (!menuOrderData.customer_phone.trim()) newErrors.customer_phone = true;
    if (!menuOrderData.event_date) newErrors.event_date = true;
    if (!menuOrderData.event_time.trim()) newErrors.event_time = true;

    const selectedDateTime = new Date(`${menuOrderData.event_date}T${menuOrderData.event_time || '00:00'}`);
    const minDateTime = new Date();
    minDateTime.setHours(minDateTime.getHours() + 2);

    if (selectedDateTime < minDateTime) {
      newErrors.event_date = true;
      alert('Pickup time must be at least 2 hours from now.');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateTruckRequest = async () => {
    const newErrors: Record<string, boolean> = {};

    if (!truckData.customer_name.trim()) newErrors.customer_name = true;
    if (!truckData.customer_email.trim()) {
      newErrors.customer_email = true;
    } else {
      const emailCheck = await verifyEmail(truckData.customer_email);
      if (!emailCheck.valid) {
        newErrors.customer_email = true;
        alert(`Email verification failed: ${emailCheck.message}`);
      }
    }
    if (!truckData.customer_phone.trim()) newErrors.customer_phone = true;
    if (!truckData.event_date) newErrors.event_date = true;
    if (!truckData.event_time.trim()) newErrors.event_time = true;
    if (!truckData.event_location.trim()) newErrors.event_location = true;
    if (!truckData.guest_count || parseInt(truckData.guest_count) <= 0) newErrors.guest_count = true;

    const selectedDateTime = new Date(`${truckData.event_date}T${truckData.event_time || '00:00'}`);
    const minDateTime = new Date();
    minDateTime.setHours(minDateTime.getHours() + 48);

    if (selectedDateTime < minDateTime) {
      newErrors.event_date = true;
      alert('Event must be scheduled exactly 48 hours (2 days) or more from now.');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleMenuOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!(await validateMenuOrder())) return;

    setSubmitting(true);

    try {
      const orderItems = [];

      partyTrays.forEach(tray => {
        const qty = trayQuantities[tray.id] || 0;
        if (qty > 0) {
          orderItems.push({
            name: tray.name,
            quantity: qty,
            price: tray.price,
            item_type: 'party_tray'
          });
        }
      });

      regularCart.forEach(cartItem => {
        orderItems.push({
          name: cartItem.name,
          quantity: cartItem.quantity,
          price: cartItem.price,
          item_type: 'menu_item',
          customizations: cartItem.customizations
        });
      });

      const totalAmount = calculateTotalAmount();
      const trayDetails = getSelectedTraysText();
      const specialInstructions = `Order Details:\nParty Trays: ${trayDetails}\nAdditional Menu Items: ${getTotalRegularQuantity()} items\nTotal: $${totalAmount.toFixed(2)}${menuOrderData.special_instructions ? '\n\nSpecial Instructions: ' + menuOrderData.special_instructions : ''}`;

      const { error } = await supabase.from('catering_menu_orders').insert([
        {
          ...menuOrderData,
          location_id: selectedLocation.id,
          guest_count: menuOrderData.guest_count ? parseInt(menuOrderData.guest_count) : null,
          special_instructions: specialInstructions,
          order_items: orderItems,
          total_amount: totalAmount,
        },
      ]);

      if (error) throw error;

      alert(`Catering order submitted successfully!\n\nOrder Total: $${totalAmount.toFixed(2)}\n\nThank you! We will contact you shortly at ${menuOrderData.customer_email} or ${menuOrderData.customer_phone} to arrange payment and confirm delivery details for your event on ${menuOrderData.event_date}.`);
      setMenuOrderData({
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        event_date: '',
        event_time: '',
        guest_count: '',
        special_instructions: '',
      });
      setTrayQuantities({});
      setRegularCart([]);
      setSelectedService(null);
    } catch (error) {
      console.error('Error submitting catering order:', error);
      alert('Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTruckRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!(await validateTruckRequest())) return;

    setSubmitting(true);

    try {
      const { error } = await supabase.from('food_truck_requests').insert([
        {
          ...truckData,
          guest_count: parseInt(truckData.guest_count),
        },
      ]);

      if (error) throw error;

      // Send notification email to restaurant owner
      try {
        await supabase.functions.invoke('send-order-confirmation', {
          body: {
            type: 'catering_truck',
            customer_name: truckData.customer_name,
            customer_email: truckData.customer_email,
            customer_phone: truckData.customer_phone,
            event_date: truckData.event_date,
            event_time: truckData.event_time,
            event_location: truckData.event_location,
            guest_count: truckData.guest_count,
            special_instructions: truckData.special_instructions,
          }
        });
      } catch (emailErr) {
        console.error('Email notification failed:', emailErr);
      }

      alert('Food truck request submitted! We will contact you via email to discuss details.');
      setTruckData({
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        event_date: '',
        event_time: '',
        event_location: '',
        guest_count: '',
        special_instructions: '',
      });
      setSelectedService(null);
    } catch (error) {
      console.error('Error submitting food truck request:', error);
      alert('Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!selectedService) {
    return (
      <section id="catering" className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white py-20 pt-28">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Catering <span className="text-orange-500">Services</span>
              </h1>
              <p className="text-gray-400 text-lg">
                Choose the perfect catering option for your event
              </p>
            </div>

            {selectedLocation.comingSoon && (
              <div className="bg-yellow-500 bg-opacity-20 backdrop-blur-sm border-2 border-yellow-500 rounded-lg p-6 mb-8">
                <p className="text-yellow-400 text-lg font-semibold">
                  🎉 This location is coming soon!
                </p>
                <p className="text-gray-300 mt-2">
                  Please select our Oak Park location to request catering services.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <button
                onClick={() => !selectedLocation.comingSoon && setSelectedService('menu')}
                disabled={selectedLocation.comingSoon}
                className={`bg-gray-800 border-2 border-orange-500 rounded-lg p-8 transition-all ${
                  selectedLocation.comingSoon
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-gray-700 transform hover:scale-105'
                }`}
              >
                <ChefHat className="text-orange-500 mb-4 mx-auto" size={64} />
                <h2 className="text-2xl font-bold mb-4">Catering Trays</h2>
                <p className="text-gray-400">
                  Order from our catering menu for your event. Perfect for parties, meetings, and gatherings.
                </p>
              </button>

              <button
                onClick={() => !selectedLocation.comingSoon && setSelectedService('truck')}
                disabled={selectedLocation.comingSoon}
                className={`bg-gray-800 border-2 border-orange-500 rounded-lg p-8 transition-all ${
                  selectedLocation.comingSoon
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-gray-700 transform hover:scale-105'
                }`}
              >
                <Truck className="text-orange-500 mb-4 mx-auto" size={64} />
                <h2 className="text-2xl font-bold mb-4">Food Truck Service</h2>
                <p className="text-gray-400">
                  Bring our food truck to your event. Great for outdoor events, festivals, and large gatherings.
                </p>
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (selectedService === 'menu') {
    return (
      <section id="catering" className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white py-20 pt-28">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <button
              onClick={() => setSelectedService(null)}
              className="text-orange-500 hover:text-orange-400 mb-6"
            >
              ← Back to Catering Options
            </button>

            <div className="text-center mb-8">
              <ChefHat className="text-orange-500 mb-4 mx-auto" size={64} />
              <h1 className="text-4xl font-bold mb-4">Catering Trays Order</h1>
              <p className="text-gray-400">Fill out the form and we'll contact you with menu options</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-8 border-2 border-orange-500 mb-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-3xl font-bold text-white mb-2">Select Catering Trays</h3>
                  <p className="text-gray-400">Choose at least one tray for your event</p>
                </div>
                {getTotalTrayQuantity() > 0 && (
                  <div className="bg-orange-500 px-4 py-2 rounded-lg">
                    <p className="text-white font-bold text-lg">{getTotalTrayQuantity()} Tray{getTotalTrayQuantity() > 1 ? 's' : ''}</p>
                  </div>
                )}
              </div>

              <div className="space-y-4 mb-6">
                {partyTrays.map(tray => (
                  <div key={tray.id} className="bg-gray-900 rounded-lg p-6 border-2 border-gray-700 hover:border-orange-500 transition-all">
                    <div className="flex gap-6 items-start mb-4">
                      {tray.image_url && (
                        <img
                          src={tray.image_url}
                          alt={tray.name}
                          className="w-32 h-32 object-cover rounded-lg flex-shrink-0"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="text-2xl font-bold text-orange-500 mb-2">{tray.name}</h4>
                        <p className="text-gray-400 mb-3">{tray.description}</p>
                        <p className="text-white font-bold text-2xl">${tray.price.toFixed(2)}</p>
                      </div>

                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => updateTrayQuantity(tray.id, -1)}
                          className="bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-lg transition-colors"
                        >
                          <Minus size={24} />
                        </button>
                        <span className="text-3xl font-bold text-white w-16 text-center">
                          {trayQuantities[tray.id] || 0}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateTrayQuantity(tray.id, 1)}
                          className="bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-lg transition-colors"
                        >
                          <Plus size={24} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {getTotalTrayQuantity() === 0 && (
                <div className="bg-red-900 bg-opacity-30 border border-red-500 rounded-lg p-4 mb-4">
                  <p className="text-red-400 text-center font-semibold">
                    Please select at least one catering tray to continue
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  if (getTotalTrayQuantity() === 0) {
                    alert('Please select at least one catering tray before adding menu items.');
                    return;
                  }
                  setShowRegularMenu(true);
                  fetchRegularMenu();
                }}
                className={`w-full py-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                  getTotalTrayQuantity() === 0
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
                disabled={getTotalTrayQuantity() === 0}
              >
                <ShoppingBag size={20} />
                Add Items from Regular Menu (Optional)
                {getTotalRegularQuantity() > 0 && (
                  <span className="bg-orange-500 px-2 py-1 rounded-full text-sm">
                    {getTotalRegularQuantity()}
                  </span>
                )}
              </button>
              {getTotalTrayQuantity() === 0 && (
                <p className="text-sm text-gray-400 text-center mt-2">
                  Select a catering tray first to add menu items
                </p>
              )}
            </div>

            {(getTotalTrayQuantity() > 0 || getTotalRegularQuantity() > 0) && (
              <div className="bg-gray-800 rounded-lg p-6 border-2 border-orange-500 mb-8">
                <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-orange-500">
                  <h3 className="text-2xl font-bold text-white">Order Summary</h3>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Total</p>
                    <p className="text-3xl font-bold text-orange-500">${calculateTotalAmount().toFixed(2)}</p>
                  </div>
                </div>

                {getTotalTrayQuantity() > 0 && (
                  <div className="mb-4">
                    <h4 className="text-lg font-semibold text-orange-500 mb-2">Catering Trays</h4>
                    {partyTrays.map(tray => {
                      const qty = trayQuantities[tray.id] || 0;
                      if (qty === 0) return null;
                      return (
                        <div key={tray.id} className="flex justify-between text-white py-2 border-b border-gray-700">
                          <span>{tray.name} x{qty}</span>
                          <span className="font-bold">${(tray.price * qty).toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {getTotalRegularQuantity() > 0 && (
                  <div className="mb-4">
                    <h4 className="text-lg font-semibold text-orange-500 mb-2">Additional Items</h4>
                    {regularCart.map((cartItem, index) => (
                      <div key={index} className="bg-gray-900 rounded-lg p-3 mb-2">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <p className="text-white font-semibold">{cartItem.name}</p>
                            {cartItem.customizations && (
                              <p className="text-sm text-gray-400 mt-1">
                                Customizations: {cartItem.customizations}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => removeCartItem(index)}
                            className="text-red-500 hover:text-red-400 ml-2"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateCartItemQuantity(index, -1)}
                              className="bg-gray-700 hover:bg-gray-600 text-white p-1 rounded"
                            >
                              <Minus size={16} />
                            </button>
                            <span className="text-white font-bold w-8 text-center">
                              {cartItem.quantity}
                            </span>
                            <button
                              onClick={() => updateCartItemQuantity(index, 1)}
                              className="bg-orange-500 hover:bg-orange-600 text-white p-1 rounded"
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                          <span className="text-white font-bold">
                            ${(cartItem.price * cartItem.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {customizingItem && (
              <div className="fixed inset-0 bg-black bg-opacity-90 z-[60] flex items-center justify-center p-4">
                <div className="bg-gray-900 rounded-lg max-w-lg w-full p-6">
                  {customizingItem.image_url && (
                    <img
                      src={customizingItem.image_url}
                      alt={customizingItem.name}
                      className="w-full max-h-64 object-contain rounded-lg mb-4 cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setShowFullImage(true)}
                      title="Click to enlarge"
                    />
                  )}
                  <h2 className="text-2xl font-bold text-white mb-4">
                    Customize: {customizingItem.name}
                  </h2>
                  <p className="text-gray-400 mb-4">
                    Add any special instructions or modifications for this item
                  </p>
                  <textarea
                    value={customizationText}
                    onChange={(e) => setCustomizationText(e.target.value)}
                    placeholder="e.g., No onions, extra sauce, well done, etc."
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 mb-4"
                    rows={4}
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        addToRegularCart(customizingItem, customizationText || undefined);
                        setCustomizingItem(null);
                        setCustomizationText('');
                      }}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold"
                    >
                      Add to Cart
                    </button>
                    <button
                      onClick={() => {
                        setCustomizingItem(null);
                        setCustomizationText('');
                      }}
                      className="px-6 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showFullImage && customizingItem?.image_url && (
              <div
                className="fixed inset-0 bg-black bg-opacity-95 z-[100] flex items-center justify-center p-4"
                onClick={() => setShowFullImage(false)}
              >
                <button
                  onClick={() => setShowFullImage(false)}
                  className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 bg-black bg-opacity-50 rounded-full"
                >
                  <X size={32} />
                </button>
                <img
                  src={customizingItem.image_url}
                  alt={customizingItem.name}
                  className="max-w-full max-h-full object-contain rounded-lg"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}

            {showRegularMenu && (
              <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
                <div className="bg-gray-900 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="sticky top-0 bg-gray-900 p-6 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-3xl font-bold text-white">Add Items from Menu</h2>
                    <button
                      onClick={() => setShowRegularMenu(false)}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold"
                    >
                      Done{getTotalRegularQuantity() > 0 && ` (${getTotalRegularQuantity()} items)`}
                    </button>
                  </div>

                  <div className="p-6 space-y-6">
                    {menuCategories.map(category => {
                      const categoryItems = regularMenuItems.filter(item => item.category_id === category.id);
                      if (categoryItems.length === 0) return null;

                      return (
                        <div key={category.id} className="bg-gray-800 rounded-lg p-6">
                          <h3 className="text-2xl font-bold text-orange-500 mb-4">{category.name}</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {categoryItems.map(item => (
                              <div key={item.id} className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                                <div className="flex gap-4 items-start mb-3">
                                  {item.image_url && (
                                    <img
                                      src={item.image_url}
                                      alt={item.name}
                                      className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                                    />
                                  )}
                                  <div className="flex-1">
                                    <h4 className="text-lg font-semibold text-white">{item.name}</h4>
                                    {item.description && (
                                      <p className="text-sm text-gray-400 mt-1">{item.description}</p>
                                    )}
                                    <p className="text-orange-500 font-bold text-xl mt-2">${item.price.toFixed(2)}</p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    setCustomizingItem(item);
                                    setCustomizationText('');
                                  }}
                                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg font-semibold mb-2"
                                >
                                  Add to Cart & Customize
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            <div className="bg-gray-800 rounded-lg p-8 border border-orange-500">
              <form onSubmit={handleMenuOrderSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Full Name <span className="text-orange-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={menuOrderData.customer_name}
                      onChange={(e) => {
                        setMenuOrderData({ ...menuOrderData, customer_name: e.target.value });
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
                      value={menuOrderData.customer_email}
                      onChange={(e) => {
                        setMenuOrderData({ ...menuOrderData, customer_email: e.target.value });
                        setErrors({ ...errors, customer_email: false });
                      }}
                      className={`w-full px-4 py-3 bg-gray-900 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                        errors.customer_email ? 'border-red-500' : 'border-gray-700'
                      }`}
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Phone Number <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={menuOrderData.customer_phone}
                    onChange={(e) => {
                      setMenuOrderData({ ...menuOrderData, customer_phone: e.target.value });
                      setErrors({ ...errors, customer_phone: false });
                    }}
                    className={`w-full px-4 py-3 bg-gray-900 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      errors.customer_phone ? 'border-red-500' : 'border-gray-700'
                    }`}
                    placeholder="(248) 123-4567"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Event Date <span className="text-orange-500">*</span>
                    </label>
                    <input
                      type="date"
                      min={getMinimumDateForPartyTrays()}
                      value={menuOrderData.event_date}
                      onChange={(e) => {
                        setMenuOrderData({ ...menuOrderData, event_date: e.target.value });
                        setErrors({ ...errors, event_date: false });
                      }}
                      className={`w-full px-4 py-3 bg-gray-900 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                        errors.event_date ? 'border-red-500' : 'border-gray-700'
                      }`}
                    />
                    <p className="text-xs text-gray-400 mt-1">Must be at least 2 hours in advance</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Event Time <span className="text-orange-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={menuOrderData.event_time}
                      onChange={(e) => {
                        setMenuOrderData({ ...menuOrderData, event_time: e.target.value });
                        setErrors({ ...errors, event_time: false });
                      }}
                      className={`w-full px-4 py-3 bg-gray-900 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                        errors.event_time ? 'border-red-500' : 'border-gray-700'
                      }`}
                    />
                  </div>
                </div>


                <div>
                  <label className="block text-sm font-medium mb-2">
                    Special Instructions
                  </label>
                  <textarea
                    value={menuOrderData.special_instructions}
                    onChange={(e) => setMenuOrderData({ ...menuOrderData, special_instructions: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Dietary restrictions, preferences, etc."
                  />
                </div>

                <div className="bg-orange-50 border-2 border-orange-500 rounded-lg p-6 mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold text-gray-900">Order Total</h3>
                    <p className="text-3xl font-bold text-orange-500">${calculateTotalAmount().toFixed(2)}</p>
                  </div>
                  <p className="text-sm text-gray-700 mb-4">
                    By submitting this order, you agree to be contacted by our team to arrange payment and finalize delivery details.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting || getTotalTrayQuantity() === 0}
                  className={`w-full py-4 rounded-lg font-semibold text-lg transition-colors ${
                    getTotalTrayQuantity() === 0
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50'
                  }`}
                >
                  {submitting ? 'Submitting Order...' : getTotalTrayQuantity() === 0 ? 'Select Catering Trays to Continue' : `Submit Order ($${calculateTotalAmount().toFixed(2)})`}
                </button>
                <p className="text-sm text-gray-400 text-center mt-3">
                  We'll contact you to arrange payment and confirm your order details
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="catering" className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white py-20 pt-28">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => setSelectedService(null)}
            className="text-orange-500 hover:text-orange-400 mb-6"
          >
            ← Back to Catering Options
          </button>

          <div className="text-center mb-8">
            <Truck className="text-orange-500 mb-4 mx-auto" size={64} />
            <h1 className="text-4xl font-bold mb-4">Food Truck Service Request</h1>
            <p className="text-gray-400">We'll contact you via email to discuss details</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-8 border border-orange-500">
            <form onSubmit={handleTruckRequestSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Full Name <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={truckData.customer_name}
                    onChange={(e) => {
                      setTruckData({ ...truckData, customer_name: e.target.value });
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
                    value={truckData.customer_email}
                    onChange={(e) => {
                      setTruckData({ ...truckData, customer_email: e.target.value });
                      setErrors({ ...errors, customer_email: false });
                    }}
                    className={`w-full px-4 py-3 bg-gray-900 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      errors.customer_email ? 'border-red-500' : 'border-gray-700'
                    }`}
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Phone Number <span className="text-orange-500">*</span>
                </label>
                <input
                  type="tel"
                  value={truckData.customer_phone}
                  onChange={(e) => {
                    setTruckData({ ...truckData, customer_phone: e.target.value });
                    setErrors({ ...errors, customer_phone: false });
                  }}
                  className={`w-full px-4 py-3 bg-gray-900 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    errors.customer_phone ? 'border-red-500' : 'border-gray-700'
                  }`}
                  placeholder="(248) 123-4567"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Event Date <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="date"
                    min={getMinimumDateForFoodTruck()}
                    value={truckData.event_date}
                    onChange={(e) => {
                      setTruckData({ ...truckData, event_date: e.target.value });
                      setErrors({ ...errors, event_date: false });
                    }}
                    className={`w-full px-4 py-3 bg-gray-900 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      errors.event_date ? 'border-red-500' : 'border-gray-700'
                    }`}
                  />
                  <p className="text-xs text-gray-400 mt-1">Must be at least 48 hours in advance</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Event Time <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={truckData.event_time}
                    onChange={(e) => {
                      setTruckData({ ...truckData, event_time: e.target.value });
                      setErrors({ ...errors, event_time: false });
                    }}
                    className={`w-full px-4 py-3 bg-gray-900 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      errors.event_time ? 'border-red-500' : 'border-gray-700'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Event Location <span className="text-orange-500">*</span>
                </label>
                <input
                  type="text"
                  value={truckData.event_location}
                  onChange={(e) => {
                    setTruckData({ ...truckData, event_location: e.target.value });
                    setErrors({ ...errors, event_location: false });
                  }}
                  className={`w-full px-4 py-3 bg-gray-900 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    errors.event_location ? 'border-red-500' : 'border-gray-700'
                  }`}
                  placeholder="123 Main St, City, State"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Number of Guests <span className="text-orange-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={truckData.guest_count}
                  onChange={(e) => {
                    setTruckData({ ...truckData, guest_count: e.target.value });
                    setErrors({ ...errors, guest_count: false });
                  }}
                  className={`w-full px-4 py-3 bg-gray-900 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    errors.guest_count ? 'border-red-500' : 'border-gray-700'
                  }`}
                  placeholder="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Special Instructions
                </label>
                <textarea
                  value={truckData.special_instructions}
                  onChange={(e) => setTruckData({ ...truckData, special_instructions: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Event details, setup requirements, etc."
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-lg font-semibold text-lg transition-colors disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Food Truck Request'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

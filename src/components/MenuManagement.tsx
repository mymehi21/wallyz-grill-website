import { useState, useEffect } from 'react';
import { Plus, Save, X, Eye, EyeOff, Edit2, Trash2, Upload, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ConfirmDialog from './ConfirmDialog';

interface MenuCategory {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
}

interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: string;
  image_url: string | null;
  is_available: boolean;
  display_order: number;
}

interface CateringMenuItem {
  id: string;
  name: string;
  description: string | null;
  price: string;
  serves: number;
  image_url: string | null;
  is_available: boolean;
  display_order: number;
}

interface MenuManagementProps {
  onUpdate?: () => void;
}

export default function MenuManagement({ onUpdate }: MenuManagementProps) {
  const [menuType, setMenuType] = useState<'pickup' | 'catering'>('pickup');
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cateringItems, setCateringItems] = useState<CateringMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  useEffect(() => {
    fetchData();
  }, [menuType]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (menuType === 'pickup') {
        const { data: partyTraysCategory } = await supabase
          .from('menu_categories')
          .select('id')
          .eq('name', 'Party Trays')
          .maybeSingle();

        const [categoriesRes, itemsRes] = await Promise.all([
          supabase.from('menu_categories').select('*').neq('name', 'Party Trays').order('display_order'),
          supabase.from('menu_items').select('*').is('deleted_at', null).neq('category_id', partyTraysCategory?.id || '').order('display_order')
        ]);
        if (categoriesRes.data) setCategories(categoriesRes.data);
        if (itemsRes.data) setMenuItems(itemsRes.data);
      } else if (menuType === 'catering') {
        const { data: partyTraysCategory } = await supabase
          .from('menu_categories')
          .select('id')
          .eq('name', 'Party Trays')
          .maybeSingle();

        if (partyTraysCategory) {
          const { data: items } = await supabase
            .from('menu_items')
            .select('*')
            .eq('category_id', partyTraysCategory.id)
            .is('deleted_at', null)
            .order('display_order');

          if (items) {
            const cateringFormatted = items.map(item => ({
              id: item.id,
              name: item.name,
              description: item.description,
              price: item.price.toString(),
              serves: 10,
              image_url: item.image_url,
              is_available: item.is_available,
              display_order: item.display_order
            }));
            setCateringItems(cateringFormatted);
          }
        }
      } else {
        const [categoriesRes, deletedRes] = await Promise.all([
          supabase.from('menu_categories').select('*').order('display_order'),
          supabase.from('menu_items').select('*').not('deleted_at', 'is', null).order('deleted_at', { ascending: false })
        ]);
        if (categoriesRes.data) setCategories(categoriesRes.data);
        if (deletedRes.data) setDeletedItems(deletedRes.data);
      }
    } catch (error) {
      console.error('Error fetching menu data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPickupItem = async () => {
    const newItem = {
      category_id: categories[0]?.id || '',
      name: 'New Item',
      description: '',
      price: '0.00',
      image_url: '',
      is_available: true,
      display_order: menuItems.length
    };

    try {
      const { data, error } = await supabase
        .from('menu_items')
        .insert([newItem])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        const newId = data.id;
        await fetchData();
        onUpdate?.();
        // Set editingId AFTER fetchData so the item exists in state
        setEditingId(newId);
        setTimeout(() => {
          const element = document.getElementById(`item-${newId}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 200);
      }
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Failed to add item');
    }
  };

  const handleAddCateringItem = async () => {
    const { data: partyTraysCategory } = await supabase
      .from('menu_categories')
      .select('id')
      .eq('name', 'Party Trays')
      .maybeSingle();

    if (!partyTraysCategory) {
      alert('Party Trays category not found');
      return;
    }

    const newItem = {
      category_id: partyTraysCategory.id,
      name: 'New Catering Tray',
      description: '',
      price: '0.00',
      image_url: '',
      is_available: true,
      display_order: cateringItems.length
    };

    try {
      const { data, error } = await supabase
        .from('menu_items')
        .insert([newItem])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        const newId = data.id;
        await fetchData();
        onUpdate?.();
        setEditingId(newId);
        setTimeout(() => {
          const element = document.getElementById(`item-${newId}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 200);
      }
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Failed to add item');
    }
  };

  const handleUpdatePickupItem = async (item: MenuItem) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({
          name: item.name,
          description: item.description,
          price: parseFloat(item.price),
          image_url: item.image_url,
          is_available: item.is_available,
          category_id: item.category_id,
          display_order: item.display_order
        })
        .eq('id', item.id);

      if (error) throw error;
      onUpdate?.();
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Failed to update item');
    }
  };

  const handleUpdateCateringItem = async (item: CateringMenuItem) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({
          name: item.name,
          description: item.description,
          price: parseFloat(item.price),
          image_url: item.image_url,
          is_available: item.is_available,
          display_order: item.display_order
        })
        .eq('id', item.id);

      if (error) throw error;
      onUpdate?.();
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Failed to update item');
    }
  };

  const handleDeletePickupItem = (item: MenuItem) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Menu Item',
      message: `Are you sure you want to delete "${item.name}"? You can restore it from the Deleted Items tab.`,
      variant: 'warning',
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('menu_items')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', item.id);

          if (error) throw error;
          await fetchData();
          onUpdate?.();
        } catch (error) {
          console.error('Error deleting item:', error);
          alert('Failed to delete item');
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      }
    });
  };

  const handleDeleteCateringItem = (item: CateringMenuItem) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Party Tray',
      message: `Are you sure you want to delete "${item.name}"? You can restore it from the Deleted Items tab.`,
      variant: 'warning',
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('menu_items')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', item.id);

          if (error) throw error;
          await fetchData();
          onUpdate?.();
        } catch (error) {
          console.error('Error deleting item:', error);
          alert('Failed to delete item');
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      }
    });
  };

  const handleRestoreItem = (item: MenuItem) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Restore Menu Item',
      message: `Are you sure you want to restore "${item.name}"?`,
      variant: 'info',
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('menu_items')
            .update({ deleted_at: null })
            .eq('id', item.id);

          if (error) throw error;
          await fetchData();
          onUpdate?.();
        } catch (error) {
          console.error('Error restoring item:', error);
          alert('Failed to restore item');
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      }
    });
  };

  const handlePermanentDelete = (item: MenuItem) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Permanently Delete Item',
      message: `Are you sure you want to PERMANENTLY delete "${item.name}"? This action CANNOT be undone!`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('menu_items')
            .delete()
            .eq('id', item.id);

          if (error) throw error;
          await fetchData();
          onUpdate?.();
        } catch (error) {
          console.error('Error permanently deleting item:', error);
          alert('Failed to permanently delete item');
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      }
    });
  };

  const handleTogglePickupAvailability = async (item: MenuItem) => {
    const updated = { ...item, is_available: !item.is_available };
    await handleUpdatePickupItem(updated);
    await fetchData();
  };

  const handleToggleCateringAvailability = async (item: CateringMenuItem) => {
    const updated = { ...item, is_available: !item.is_available };
    await handleUpdateCateringItem(updated);
    await fetchData();
  };

  const handleImageUpload = async (itemId: string, file: File, isPickup: boolean) => {
    try {
      setUploadingImage(itemId);

      const fileExt = file.name.split('.').pop();
      const fileName = `${itemId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('menu-images')
        .getPublicUrl(filePath);

      if (isPickup) {
        const item = menuItems.find(i => i.id === itemId);
        if (item) {
          await handleUpdatePickupItem({ ...item, image_url: publicUrl });
        }
      } else {
        const item = cateringItems.find(i => i.id === itemId);
        if (item) {
          await handleUpdateCateringItem({ ...item, image_url: publicUrl });
        }
      }

      await fetchData();
      alert('Image uploaded successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setUploadingImage(null);
    }
  };

  const handleDeleteImage = async (itemId: string, imageUrl: string | null, isPickup: boolean) => {
    if (!imageUrl) return;

    try {
      const fileName = imageUrl.split('/').pop();
      if (fileName) {
        await supabase.storage
          .from('menu-images')
          .remove([fileName]);
      }

      if (isPickup) {
        const item = menuItems.find(i => i.id === itemId);
        if (item) {
          await handleUpdatePickupItem({ ...item, image_url: null });
        }
      } else {
        const item = cateringItems.find(i => i.id === itemId);
        if (item) {
          await handleUpdateCateringItem({ ...item, image_url: null });
        }
      }

      await fetchData();
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Failed to delete image');
    }
  };

  const filteredPickupItems = selectedCategory === 'all'
    ? menuItems
    : menuItems.filter(item => item.category_id === selectedCategory);

  if (loading) {
    return <div className="text-center py-8 text-gray-900">Loading menu...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Menu Management</h2>
          <p className="text-gray-600 mt-1">Click edit to modify items</p>
        </div>
        <button
          onClick={menuType === 'pickup' ? handleAddPickupItem : handleAddCateringItem}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Item
        </button>
      </div>

      <div className="flex gap-4 bg-gray-100 p-2 rounded-lg">
        <button
          onClick={() => setMenuType('pickup')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
            menuType === 'pickup'
              ? 'bg-white text-orange-600 shadow'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Pickup Menu
        </button>
        <button
          onClick={() => setMenuType('catering')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
            menuType === 'catering'
              ? 'bg-white text-orange-600 shadow'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Catering Trays
        </button>
      </div>

      {menuType === 'pickup' && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedCategory === 'all'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Items
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedCategory === category.id
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {menuType === 'pickup' ? (
          filteredPickupItems.map((item) => (
            <div
              key={item.id}
              id={`item-${item.id}`}
              className={`bg-white p-6 rounded-lg shadow transition-all ${
                !item.is_available ? 'opacity-60' : ''
              } ${
                editingId === item.id ? 'ring-4 ring-orange-500 ring-opacity-50' : ''
              }`}
            >
              {editingId === item.id ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => {
                          const updated = menuItems.map(i =>
                            i.id === item.id ? { ...i, name: e.target.value } : i
                          );
                          setMenuItems(updated);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select
                        value={item.category_id}
                        onChange={(e) => {
                          const updated = menuItems.map(i =>
                            i.id === item.id ? { ...i, category_id: e.target.value } : i
                          );
                          setMenuItems(updated);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
                      >
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.price}
                        onChange={(e) => {
                          const updated = menuItems.map(i =>
                            i.id === item.id ? { ...i, price: e.target.value } : i
                          );
                          setMenuItems(updated);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                      <input
                        type="number"
                        value={item.display_order}
                        onChange={(e) => {
                          const updated = menuItems.map(i =>
                            i.id === item.id ? { ...i, display_order: parseInt(e.target.value) || 0 } : i
                          );
                          setMenuItems(updated);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={item.description || ''}
                        onChange={(e) => {
                          const updated = menuItems.map(i =>
                            i.id === item.id ? { ...i, description: e.target.value } : i
                          );
                          setMenuItems(updated);
                        }}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                      <div className="space-y-3">
                        {item.image_url && (
                          <div className="relative inline-block">
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-32 h-32 object-cover rounded-lg border-2 border-gray-300"
                            />
                            <button
                              type="button"
                              onClick={() => handleDeleteImage(item.id, item.image_url, true)}
                              className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <input
                            type="file"
                            accept="image/*"
                            id={`upload-${item.id}`}
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleImageUpload(item.id, file, true);
                              }
                            }}
                          />
                          <label
                            htmlFor={`upload-${item.id}`}
                            className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer ${
                              uploadingImage === item.id ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            {uploadingImage === item.id ? (
                              <>
                                <Upload className="w-4 h-4 animate-pulse" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4" />
                                {item.image_url ? 'Change Image' : 'Upload Image'}
                              </>
                            )}
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        handleUpdatePickupItem(item);
                        setEditingId(null);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-start gap-4">
                  <div className="flex gap-4 flex-1">
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-24 h-24 object-cover rounded-lg border-2 border-gray-300"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{item.name}</h3>
                        <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                          ${parseFloat(item.price).toFixed(2)}
                        </span>
                        {!item.is_available && (
                          <span className="px-3 py-1 bg-gray-200 text-gray-600 rounded-full text-sm font-medium">
                            Hidden
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mb-2">{item.description || 'No description'}</p>
                      <p className="text-sm text-gray-500">
                        Category: {categories.find(c => c.id === item.category_id)?.name || 'Unknown'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleTogglePickupAvailability(item)}
                      className={`p-2 rounded-lg transition-colors ${
                        item.is_available
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      title={item.is_available ? 'Hide from menu' : 'Show on menu'}
                    >
                      {item.is_available ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => setEditingId(item.id)}
                      className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeletePickupItem(item)}
                      className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          cateringItems.map((item) => (
            <div
              key={item.id}
              id={`item-${item.id}`}
              className={`bg-white p-6 rounded-lg shadow transition-all ${
                !item.is_available ? 'opacity-60' : ''
              } ${
                editingId === item.id ? 'ring-4 ring-orange-500 ring-opacity-50' : ''
              }`}
            >
              {editingId === item.id ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => {
                          const updated = cateringItems.map(i =>
                            i.id === item.id ? { ...i, name: e.target.value } : i
                          );
                          setCateringItems(updated);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.price}
                        onChange={(e) => {
                          const updated = cateringItems.map(i =>
                            i.id === item.id ? { ...i, price: e.target.value } : i
                          );
                          setCateringItems(updated);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Serves (people)</label>
                      <input
                        type="number"
                        value={item.serves}
                        onChange={(e) => {
                          const updated = cateringItems.map(i =>
                            i.id === item.id ? { ...i, serves: parseInt(e.target.value) || 10 } : i
                          );
                          setCateringItems(updated);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                      <input
                        type="number"
                        value={item.display_order}
                        onChange={(e) => {
                          const updated = cateringItems.map(i =>
                            i.id === item.id ? { ...i, display_order: parseInt(e.target.value) || 0 } : i
                          );
                          setCateringItems(updated);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={item.description || ''}
                        onChange={(e) => {
                          const updated = cateringItems.map(i =>
                            i.id === item.id ? { ...i, description: e.target.value } : i
                          );
                          setCateringItems(updated);
                        }}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                      <div className="space-y-3">
                        {item.image_url && (
                          <div className="relative inline-block">
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-32 h-32 object-cover rounded-lg border-2 border-gray-300"
                            />
                            <button
                              type="button"
                              onClick={() => handleDeleteImage(item.id, item.image_url, false)}
                              className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <input
                            type="file"
                            accept="image/*"
                            id={`upload-catering-${item.id}`}
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleImageUpload(item.id, file, false);
                              }
                            }}
                          />
                          <label
                            htmlFor={`upload-catering-${item.id}`}
                            className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer ${
                              uploadingImage === item.id ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            {uploadingImage === item.id ? (
                              <>
                                <Upload className="w-4 h-4 animate-pulse" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4" />
                                {item.image_url ? 'Change Image' : 'Upload Image'}
                              </>
                            )}
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        handleUpdateCateringItem(item);
                        setEditingId(null);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-start gap-4">
                  <div className="flex gap-4 flex-1">
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-24 h-24 object-cover rounded-lg border-2 border-gray-300"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{item.name}</h3>
                        <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                          ${parseFloat(item.price).toFixed(2)}
                        </span>
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          Serves {item.serves}
                        </span>
                        {!item.is_available && (
                          <span className="px-3 py-1 bg-gray-200 text-gray-600 rounded-full text-sm font-medium">
                            Hidden
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mb-2">{item.description || 'No description'}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleCateringAvailability(item)}
                      className={`p-2 rounded-lg transition-colors ${
                        item.is_available
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      title={item.is_available ? 'Hide from menu' : 'Show on menu'}
                    >
                      {item.is_available ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => setEditingId(item.id)}
                      className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCateringItem(item)}
                      className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {menuType === 'pickup' && filteredPickupItems.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No items found in this category</p>
        </div>
      )}

      {menuType === 'catering' && cateringItems.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No catering trays yet. Click "Add Item" to create your first one.</p>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </div>
  );
}

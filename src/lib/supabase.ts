import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,        // Keep session in localStorage
    autoRefreshToken: true,      // Automatically refresh before expiry
    detectSessionInUrl: true,    // Handle OAuth redirects
    storageKey: 'wallyz-admin-session',
  },
});

export interface Location {
  id: string;
  name: string;
  address: string;
  phone: string;
  is_active: boolean;
  clover_merchant_id: string | null;
  display_order: number;
  created_at: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  display_order: number;
  created_at: string;
  base_ingredients: string[];
  protein_type: string | null;
  allow_protein_additions: boolean;
  customization_options: {
    protein_additions?: Array<{ name: string; price: number }>;
  };
}

export interface Order {
  id?: string;
  location_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  order_type: 'pickup' | 'catering';
  pickup_time: string;
  special_instructions: string | null;
  total_amount: number;
  status?: string;
  clover_order_id?: string | null;
  created_at?: string;
}

export interface OrderItem {
  id?: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  special_requests: string | null;
  removed_ingredients?: string[];
  added_items?: Array<{ name: string; price: number }>;
}

export interface SiteSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  updated_at: string;
}

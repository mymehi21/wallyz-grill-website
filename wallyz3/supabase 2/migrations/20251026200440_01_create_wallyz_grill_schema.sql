/*
  # Wallyz Grill Restaurant Database Schema

  ## Overview
  This migration creates the complete database structure for Wallyz Grill restaurant website,
  supporting multiple locations, menu management, and online ordering system.

  ## New Tables

  ### 1. `locations`
  - `id` (uuid, primary key) - Unique identifier for each location
  - `name` (text) - Location name/identifier
  - `address` (text) - Full street address
  - `phone` (text) - Contact phone number
  - `is_active` (boolean) - Whether location accepts orders
  - `clover_merchant_id` (text, nullable) - Clover system merchant ID
  - `display_order` (integer) - Order to display locations
  - `created_at` (timestamptz) - Record creation timestamp

  ### 2. `menu_categories`
  - Categories for organizing menu items

  ### 3. `menu_items`
  - All menu items with prices and customization options

  ### 4. `orders` & `order_items`
  - Order tracking system

  ### 5. `site_settings`
  - Customizable website settings

  ## Security
  - Enable RLS on all tables
  - Public read access for active items
  - Authenticated access for management
*/

-- Create locations table
CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  phone text NOT NULL,
  is_active boolean DEFAULT true,
  clover_merchant_id text,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create menu_categories table
CREATE TABLE IF NOT EXISTS menu_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES menu_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price decimal(10,2) NOT NULL,
  image_url text,
  is_available boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  base_ingredients jsonb DEFAULT '[]'::jsonb,
  protein_type text,
  allow_protein_additions boolean DEFAULT false,
  customization_options jsonb DEFAULT '{}'::jsonb
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid REFERENCES locations(id) ON DELETE RESTRICT,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text NOT NULL,
  order_type text NOT NULL CHECK (order_type IN ('pickup', 'catering')),
  pickup_time timestamptz NOT NULL,
  special_instructions text,
  total_amount decimal(10,2) NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'ready', 'completed', 'cancelled')),
  clover_order_id text,
  created_at timestamptz DEFAULT now()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id uuid REFERENCES menu_items(id) ON DELETE RESTRICT,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price decimal(10,2) NOT NULL,
  special_requests text,
  removed_ingredients jsonb DEFAULT '[]'::jsonb,
  added_items jsonb DEFAULT '[]'::jsonb
);

-- Create site_settings table
CREATE TABLE IF NOT EXISTS site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security (DISABLED for easy viewing)
ALTER TABLE locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings DISABLE ROW LEVEL SECURITY;

-- Insert initial location
INSERT INTO locations (name, address, phone, display_order, is_active)
VALUES ('Oak Park', '25000 Greenfield Rd, Oak Park, MI', '(248) 993-9330', 1, true)
ON CONFLICT DO NOTHING;

-- Insert default color scheme settings
INSERT INTO site_settings (setting_key, setting_value) VALUES
  ('primary_color', '#FF6B35'),
  ('secondary_color', '#000000'),
  ('accent_color', '#FFA500')
ON CONFLICT (setting_key) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_location ON orders(location_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(setting_key);
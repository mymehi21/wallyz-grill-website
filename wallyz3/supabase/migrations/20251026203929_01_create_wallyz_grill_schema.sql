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
  - RLS enabled on all tables
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

-- Enable Row Level Security
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for locations
DROP POLICY IF EXISTS "Public can view active locations" ON locations;
CREATE POLICY "Public can view active locations"
  ON locations FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Authenticated can view all locations" ON locations;
CREATE POLICY "Authenticated can view all locations"
  ON locations FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for menu_categories
DROP POLICY IF EXISTS "Public can view active categories" ON menu_categories;
CREATE POLICY "Public can view active categories"
  ON menu_categories FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Authenticated can view all categories" ON menu_categories;
CREATE POLICY "Authenticated can view all categories"
  ON menu_categories FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for menu_items
DROP POLICY IF EXISTS "Public can view available menu items" ON menu_items;
CREATE POLICY "Public can view available menu items"
  ON menu_items FOR SELECT
  USING (is_available = true);

DROP POLICY IF EXISTS "Authenticated can view all menu items" ON menu_items;
CREATE POLICY "Authenticated can view all menu items"
  ON menu_items FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for orders
DROP POLICY IF EXISTS "Anyone can create orders" ON orders;
CREATE POLICY "Anyone can create orders"
  ON orders FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can view all orders" ON orders;
CREATE POLICY "Authenticated can view all orders"
  ON orders FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated can update orders" ON orders;
CREATE POLICY "Authenticated can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (true);

-- RLS Policies for order_items
DROP POLICY IF EXISTS "Anyone can create order items" ON order_items;
CREATE POLICY "Anyone can create order items"
  ON order_items FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can view all order items" ON order_items;
CREATE POLICY "Authenticated can view all order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for site_settings
DROP POLICY IF EXISTS "Public can view site settings" ON site_settings;
CREATE POLICY "Public can view site settings"
  ON site_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated can update site settings" ON site_settings;
CREATE POLICY "Authenticated can update site settings"
  ON site_settings FOR UPDATE
  TO authenticated
  USING (true);

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
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_menu_item_id ON order_items(menu_item_id);

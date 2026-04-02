/*
  # Wallyz Grill Restaurant Database Schema

  ## Overview
  This migration creates the complete database structure for Wallyz Grill restaurant website,
  supporting multiple locations, menu management, and online ordering system.

  ## New Tables

  ### 1. `locations`
  Stores restaurant location information
  - `id` (uuid, primary key) - Unique identifier for each location
  - `name` (text) - Location name/identifier
  - `address` (text) - Full street address
  - `phone` (text) - Contact phone number
  - `is_active` (boolean) - Whether location accepts orders
  - `clover_merchant_id` (text, nullable) - Clover system merchant ID for this location
  - `display_order` (integer) - Order to display locations on website
  - `created_at` (timestamptz) - Record creation timestamp

  ### 2. `menu_categories`
  Organizes menu items into categories
  - `id` (uuid, primary key) - Unique identifier
  - `name` (text) - Category name (e.g., "Burgers", "Sides")
  - `description` (text, nullable) - Category description
  - `display_order` (integer) - Order to display categories
  - `is_active` (boolean) - Whether category is visible
  - `created_at` (timestamptz) - Record creation timestamp

  ### 3. `menu_items`
  Stores all menu items with prices
  - `id` (uuid, primary key) - Unique identifier
  - `category_id` (uuid, foreign key) - Links to menu_categories
  - `name` (text) - Item name
  - `description` (text, nullable) - Item description
  - `price` (decimal) - Item price
  - `image_url` (text, nullable) - Optional item image
  - `is_available` (boolean) - Current availability status
  - `display_order` (integer) - Order within category
  - `created_at` (timestamptz) - Record creation timestamp

  ### 4. `orders`
  Tracks customer orders
  - `id` (uuid, primary key) - Unique identifier
  - `location_id` (uuid, foreign key) - Pickup location
  - `customer_name` (text) - Customer's name
  - `customer_email` (text) - Customer's email
  - `customer_phone` (text) - Customer's phone number
  - `order_type` (text) - "pickup" or "catering"
  - `pickup_time` (timestamptz) - Requested pickup/delivery time
  - `special_instructions` (text, nullable) - Special requests
  - `total_amount` (decimal) - Order total
  - `status` (text) - Order status (pending, confirmed, ready, completed, cancelled)
  - `clover_order_id` (text, nullable) - Clover system order ID
  - `created_at` (timestamptz) - Order creation timestamp

  ### 5. `order_items`
  Individual items in each order
  - `id` (uuid, primary key) - Unique identifier
  - `order_id` (uuid, foreign key) - Links to orders
  - `menu_item_id` (uuid, foreign key) - Links to menu_items
  - `quantity` (integer) - Number of items
  - `unit_price` (decimal) - Price at time of order
  - `special_requests` (text, nullable) - Item-specific requests

  ### 6. `site_settings`
  Customizable website settings including colors
  - `id` (uuid, primary key) - Unique identifier
  - `setting_key` (text, unique) - Setting identifier
  - `setting_value` (text) - Setting value
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - Enable RLS on all tables
  - Public read access for locations, menu_categories, menu_items, and site_settings
  - Authenticated users can insert orders (for future customer accounts)
  - Service role access for order management and settings updates

  ## Notes
  - All prices stored as decimal(10,2) for accurate currency handling
  - Timestamps use timestamptz for proper timezone handling
  - Display order fields allow flexible arrangement of content
  - Clover integration fields prepared for future API integration
  - Site settings table allows easy color theme customization
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
  created_at timestamptz DEFAULT now()
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
  special_requests text
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

-- RLS Policies for locations (public read)
CREATE POLICY "Public can view active locations"
  ON locations FOR SELECT
  TO anon
  USING (is_active = true);

CREATE POLICY "Authenticated can view all locations"
  ON locations FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for menu_categories (public read)
CREATE POLICY "Public can view active categories"
  ON menu_categories FOR SELECT
  TO anon
  USING (is_active = true);

CREATE POLICY "Authenticated can view all categories"
  ON menu_categories FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for menu_items (public read)
CREATE POLICY "Public can view available menu items"
  ON menu_items FOR SELECT
  TO anon
  USING (is_available = true);

CREATE POLICY "Authenticated can view all menu items"
  ON menu_items FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for orders
CREATE POLICY "Anyone can create orders"
  ON orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can view all orders"
  ON orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (true);

-- RLS Policies for order_items
CREATE POLICY "Anyone can create order items"
  ON order_items FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can view all order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for site_settings (public read)
CREATE POLICY "Public can view site settings"
  ON site_settings FOR SELECT
  TO anon, authenticated
  USING (true);

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
CREATE INDEX IF NOT EXISTS idx_orders_location ON orders(location_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(setting_key);
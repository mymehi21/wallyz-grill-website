/*
  # Restore Wallyz Grill Database Schema

  ## Overview
  Restoring complete database structure for Wallyz Grill restaurant website.

  ## Tables Created
  - locations, menu_categories, menu_items, orders, order_items, site_settings
  - admin_users, approved_admins, pickup_orders, catering_menu_orders
  - food_truck_requests, job_applications, customer_reviews

  ## Security
  - RLS enabled on all tables with proper policies
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

-- Create admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create pickup orders table
CREATE TABLE IF NOT EXISTS pickup_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id text NOT NULL DEFAULT 'location1',
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text NOT NULL,
  order_items jsonb NOT NULL,
  total_amount decimal(10, 2) NOT NULL,
  pickup_time text NOT NULL,
  special_instructions text DEFAULT '',
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  deleted_by uuid
);

-- Create catering menu orders table
CREATE TABLE IF NOT EXISTS catering_menu_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id text NOT NULL DEFAULT 'location1',
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text NOT NULL,
  event_date date NOT NULL,
  event_time text NOT NULL,
  guest_count integer,
  order_items jsonb NOT NULL,
  total_amount decimal(10, 2) NOT NULL,
  special_instructions text DEFAULT '',
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  deleted_by uuid
);

-- Create food truck requests table
CREATE TABLE IF NOT EXISTS food_truck_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text NOT NULL,
  event_date date NOT NULL,
  event_time text NOT NULL,
  event_location text NOT NULL,
  guest_count integer NOT NULL,
  special_instructions text DEFAULT '',
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  deleted_by uuid
);

-- Create job applications table
CREATE TABLE IF NOT EXISTS job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_name text NOT NULL,
  applicant_email text NOT NULL,
  applicant_phone text NOT NULL,
  position_applied text NOT NULL,
  experience text NOT NULL,
  availability text NOT NULL,
  additional_info text DEFAULT '',
  status text DEFAULT 'new',
  created_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  deleted_by uuid
);

-- Create customer reviews table
CREATE TABLE IF NOT EXISTS customer_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_email text DEFAULT '',
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text NOT NULL,
  location_id text NOT NULL DEFAULT 'location1',
  is_approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  deleted_by uuid
);

-- Create approved admins table
CREATE TABLE IF NOT EXISTS approved_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES admin_users(id) ON DELETE SET NULL
);

-- Enable RLS on all tables
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickup_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE catering_menu_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_truck_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE approved_admins ENABLE ROW LEVEL SECURITY;

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

DROP POLICY IF EXISTS "Authenticated can update menu items" ON menu_items;
CREATE POLICY "Authenticated can update menu items"
  ON menu_items FOR UPDATE
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

-- RLS Policies for admin_users
DROP POLICY IF EXISTS "Admins can read own data" ON admin_users;
CREATE POLICY "Admins can read own data"
  ON admin_users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- RLS Policies for pickup_orders
DROP POLICY IF EXISTS "Anyone can create pickup orders" ON pickup_orders;
CREATE POLICY "Anyone can create pickup orders"
  ON pickup_orders FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated admins can view all pickup orders" ON pickup_orders;
CREATE POLICY "Authenticated admins can view all pickup orders"
  ON pickup_orders FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated admins can update pickup orders" ON pickup_orders;
CREATE POLICY "Authenticated admins can update pickup orders"
  ON pickup_orders FOR UPDATE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated admins can delete pickup orders" ON pickup_orders;
CREATE POLICY "Authenticated admins can delete pickup orders"
  ON pickup_orders FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for catering_menu_orders
DROP POLICY IF EXISTS "Anyone can create catering orders" ON catering_menu_orders;
CREATE POLICY "Anyone can create catering orders"
  ON catering_menu_orders FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated admins can view all catering orders" ON catering_menu_orders;
CREATE POLICY "Authenticated admins can view all catering orders"
  ON catering_menu_orders FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated admins can update catering orders" ON catering_menu_orders;
CREATE POLICY "Authenticated admins can update catering orders"
  ON catering_menu_orders FOR UPDATE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated admins can delete catering orders" ON catering_menu_orders;
CREATE POLICY "Authenticated admins can delete catering orders"
  ON catering_menu_orders FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for food_truck_requests
DROP POLICY IF EXISTS "Anyone can create food truck requests" ON food_truck_requests;
CREATE POLICY "Anyone can create food truck requests"
  ON food_truck_requests FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated admins can view all food truck requests" ON food_truck_requests;
CREATE POLICY "Authenticated admins can view all food truck requests"
  ON food_truck_requests FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated admins can update food truck requests" ON food_truck_requests;
CREATE POLICY "Authenticated admins can update food truck requests"
  ON food_truck_requests FOR UPDATE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated admins can delete food truck requests" ON food_truck_requests;
CREATE POLICY "Authenticated admins can delete food truck requests"
  ON food_truck_requests FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for job_applications
DROP POLICY IF EXISTS "Anyone can submit job applications" ON job_applications;
CREATE POLICY "Anyone can submit job applications"
  ON job_applications FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated admins can view all job applications" ON job_applications;
CREATE POLICY "Authenticated admins can view all job applications"
  ON job_applications FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated admins can update job applications" ON job_applications;
CREATE POLICY "Authenticated admins can update job applications"
  ON job_applications FOR UPDATE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated admins can delete job applications" ON job_applications;
CREATE POLICY "Authenticated admins can delete job applications"
  ON job_applications FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for customer_reviews
DROP POLICY IF EXISTS "Anyone can submit reviews" ON customer_reviews;
CREATE POLICY "Anyone can submit reviews"
  ON customer_reviews FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view approved reviews only" ON customer_reviews;
CREATE POLICY "Public can view approved reviews only"
  ON customer_reviews FOR SELECT
  USING (is_approved = true AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Authenticated admins can view all reviews" ON customer_reviews;
CREATE POLICY "Authenticated admins can view all reviews"
  ON customer_reviews FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated admins can update reviews" ON customer_reviews;
CREATE POLICY "Authenticated admins can update reviews"
  ON customer_reviews FOR UPDATE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated admins can delete reviews" ON customer_reviews;
CREATE POLICY "Authenticated admins can delete reviews"
  ON customer_reviews FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for approved_admins
DROP POLICY IF EXISTS "Anyone can check if email is approved" ON approved_admins;
CREATE POLICY "Anyone can check if email is approved"
  ON approved_admins FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Authenticated admins can add approved admins" ON approved_admins;
CREATE POLICY "Authenticated admins can add approved admins"
  ON approved_admins FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated admins can update approved admins" ON approved_admins;
CREATE POLICY "Authenticated admins can update approved admins"
  ON approved_admins FOR UPDATE
  TO authenticated
  USING (true);

-- Insert initial location
INSERT INTO locations (name, address, phone, display_order, is_active)
VALUES ('Oak Park', '25000 Greenfield Rd, Oak Park, MI', '(248) 993-9330', 1, true);

-- Insert default color scheme settings
INSERT INTO site_settings (setting_key, setting_value) VALUES
  ('primary_color', '#FF6B35'),
  ('secondary_color', '#000000'),
  ('accent_color', '#FFA500');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_menu_item_id ON order_items(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_pickup_orders_created_at ON pickup_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_catering_orders_created_at ON catering_menu_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_food_truck_requests_created_at ON food_truck_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_applications_created_at ON job_applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON customer_reviews(is_approved, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_approved_admins_email ON approved_admins(email) WHERE is_active = true;

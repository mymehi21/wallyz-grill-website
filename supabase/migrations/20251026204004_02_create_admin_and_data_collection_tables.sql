/*
  # Admin and Data Collection System

  ## Overview
  Creates admin authentication, orders, catering requests, job applications, and reviews.

  ## New Tables

  ### 1. `admin_users` - Admin authentication
  ### 2. `pickup_orders` - Pickup order tracking
  ### 3. `catering_menu_orders` - Catering orders
  ### 4. `food_truck_requests` - Food truck event requests
  ### 5. `job_applications` - Employment applications
  ### 6. `customer_reviews` - Customer feedback

  ## Security
  - RLS enabled on all tables
  - Public can create orders, applications, reviews
  - Admins can view and manage all data
*/

-- Create admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read own data" ON admin_users;
CREATE POLICY "Admins can read own data"
  ON admin_users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

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

ALTER TABLE pickup_orders ENABLE ROW LEVEL SECURITY;

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

ALTER TABLE catering_menu_orders ENABLE ROW LEVEL SECURITY;

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

ALTER TABLE food_truck_requests ENABLE ROW LEVEL SECURITY;

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

ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

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

ALTER TABLE customer_reviews ENABLE ROW LEVEL SECURITY;

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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_pickup_orders_created_at ON pickup_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_catering_orders_created_at ON catering_menu_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_food_truck_requests_created_at ON food_truck_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_applications_created_at ON job_applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON customer_reviews(is_approved, created_at DESC);

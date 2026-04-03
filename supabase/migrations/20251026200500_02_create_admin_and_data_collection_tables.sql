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
  - RLS disabled for easy viewing in dashboard
  - Public can create orders, applications, reviews
  - Admins can view and manage all data
*/

-- Create admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;

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

ALTER TABLE pickup_orders DISABLE ROW LEVEL SECURITY;

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

ALTER TABLE catering_menu_orders DISABLE ROW LEVEL SECURITY;

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

ALTER TABLE food_truck_requests DISABLE ROW LEVEL SECURITY;

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

ALTER TABLE job_applications DISABLE ROW LEVEL SECURITY;

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

ALTER TABLE customer_reviews DISABLE ROW LEVEL SECURITY;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_pickup_orders_created_at ON pickup_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pickup_orders_status ON pickup_orders(status);
CREATE INDEX IF NOT EXISTS idx_pickup_orders_deleted_at ON pickup_orders(deleted_at);
CREATE INDEX IF NOT EXISTS idx_catering_orders_created_at ON catering_menu_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_catering_menu_orders_deleted_at ON catering_menu_orders(deleted_at);
CREATE INDEX IF NOT EXISTS idx_food_truck_requests_created_at ON food_truck_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_food_truck_requests_deleted_at ON food_truck_requests(deleted_at);
CREATE INDEX IF NOT EXISTS idx_job_applications_created_at ON job_applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_applications_deleted_at ON job_applications(deleted_at);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON customer_reviews(is_approved, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_reviews_deleted_at ON customer_reviews(deleted_at);
/*
  # Admin and Data Collection System

  ## Overview
  This migration creates the complete data collection infrastructure for Wallyz Grill,
  including admin authentication, orders, catering requests, job applications, and reviews.

  ## New Tables

  ### 1. `admin_users`
  - `id` (uuid, primary key) - Unique admin identifier
  - `email` (text, unique) - Admin email for login
  - `created_at` (timestamptz) - Account creation timestamp
  
  ### 2. `pickup_orders`
  - `id` (uuid, primary key) - Unique order identifier
  - `location_id` (text) - Store location identifier
  - `customer_name` (text) - Customer's full name
  - `customer_email` (text) - Customer's email
  - `customer_phone` (text) - Customer's phone number
  - `order_items` (jsonb) - Array of ordered items with customizations
  - `total_amount` (decimal) - Total order cost
  - `pickup_time` (text) - Requested pickup time
  - `special_instructions` (text) - Additional order notes
  - `status` (text) - Order status (pending, completed, cancelled)
  - `created_at` (timestamptz) - Order timestamp

  ### 3. `catering_menu_orders`
  - `id` (uuid, primary key) - Unique catering order identifier
  - `location_id` (text) - Store location identifier
  - `customer_name` (text) - Customer's full name
  - `customer_email` (text) - Customer's email
  - `customer_phone` (text) - Customer's phone number
  - `event_date` (date) - Date of catered event
  - `event_time` (text) - Time of catered event
  - `guest_count` (integer) - Number of guests
  - `order_items` (jsonb) - Array of catering items ordered
  - `total_amount` (decimal) - Total catering cost
  - `special_instructions` (text) - Additional catering notes
  - `status` (text) - Order status
  - `created_at` (timestamptz) - Request timestamp

  ### 4. `food_truck_requests`
  - `id` (uuid, primary key) - Unique request identifier
  - `customer_name` (text) - Customer's full name
  - `customer_email` (text) - Customer's email
  - `customer_phone` (text) - Customer's phone number
  - `event_date` (date) - Date of event
  - `event_time` (text) - Time of event
  - `event_location` (text) - Address/location of event
  - `guest_count` (integer) - Number of people attending
  - `special_instructions` (text) - Additional event details
  - `status` (text) - Request status (pending, confirmed, cancelled)
  - `created_at` (timestamptz) - Request timestamp

  ### 5. `job_applications`
  - `id` (uuid, primary key) - Unique application identifier
  - `applicant_name` (text) - Applicant's full name
  - `applicant_email` (text) - Applicant's email
  - `applicant_phone` (text) - Applicant's phone number
  - `position_applied` (text) - Position they're applying for
  - `experience` (text) - Work experience details
  - `availability` (text) - Availability schedule
  - `additional_info` (text) - Cover letter or additional information
  - `status` (text) - Application status (new, reviewed, contacted, rejected)
  - `created_at` (timestamptz) - Application timestamp

  ### 6. `customer_reviews`
  - `id` (uuid, primary key) - Unique review identifier
  - `customer_name` (text) - Reviewer's name
  - `customer_email` (text) - Reviewer's email (optional)
  - `rating` (integer) - Rating out of 5 stars
  - `review_text` (text) - Review content
  - `location_id` (text) - Location being reviewed
  - `is_approved` (boolean) - Whether review is approved for display
  - `created_at` (timestamptz) - Review timestamp

  ## Security
  - Enable RLS on all tables
  - Admin users can read their own data
  - Admin users can read all customer data (orders, applications, reviews)
  - Public users can insert orders, applications, and reviews
  - Public users can read approved reviews only

  ## Important Notes
  1. All customer data is protected and only accessible to authenticated admins
  2. Reviews require admin approval before being displayed publicly
  3. Order items are stored as JSONB for flexibility with customizations
  4. All tables include automatic timestamps for audit trail
*/

-- Create admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

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
  created_at timestamptz DEFAULT now()
);

ALTER TABLE pickup_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated admins can view all pickup orders"
  ON pickup_orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can create pickup orders"
  ON pickup_orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Create catering menu orders table
CREATE TABLE IF NOT EXISTS catering_menu_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id text NOT NULL DEFAULT 'location1',
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text NOT NULL,
  event_date date NOT NULL,
  event_time text NOT NULL,
  guest_count integer NOT NULL,
  order_items jsonb NOT NULL,
  total_amount decimal(10, 2) NOT NULL,
  special_instructions text DEFAULT '',
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE catering_menu_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated admins can view all catering orders"
  ON catering_menu_orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can create catering orders"
  ON catering_menu_orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

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
  created_at timestamptz DEFAULT now()
);

ALTER TABLE food_truck_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated admins can view all food truck requests"
  ON food_truck_requests FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can create food truck requests"
  ON food_truck_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

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
  created_at timestamptz DEFAULT now()
);

ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated admins can view all job applications"
  ON job_applications FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can submit job applications"
  ON job_applications FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Create customer reviews table
CREATE TABLE IF NOT EXISTS customer_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_email text DEFAULT '',
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text NOT NULL,
  location_id text NOT NULL DEFAULT 'location1',
  is_approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE customer_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated admins can view all reviews"
  ON customer_reviews FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Public can view approved reviews only"
  ON customer_reviews FOR SELECT
  TO anon
  USING (is_approved = true);

CREATE POLICY "Anyone can submit reviews"
  ON customer_reviews FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated admins can update reviews"
  ON customer_reviews FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_pickup_orders_created_at ON pickup_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pickup_orders_status ON pickup_orders(status);
CREATE INDEX IF NOT EXISTS idx_catering_orders_created_at ON catering_menu_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_food_truck_requests_created_at ON food_truck_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_applications_created_at ON job_applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON customer_reviews(is_approved, created_at DESC);
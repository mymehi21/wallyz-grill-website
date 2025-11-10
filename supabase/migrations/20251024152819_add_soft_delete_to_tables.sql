/*
  # Add Soft Delete Support

  1. Changes
    - Add `deleted_at` column to all data collection tables
    - Add `deleted_by` column to track who deleted the record
    - Create indexes on `deleted_at` for efficient queries
  
  2. Tables Modified
    - pickup_orders
    - catering_menu_orders
    - food_truck_requests
    - job_applications
    - customer_reviews
  
  3. Purpose
    - Enable soft deletes (mark as deleted instead of permanent removal)
    - Allow recovery of deleted items
    - Maintain audit trail of deletions
*/

-- Add soft delete columns to pickup_orders
ALTER TABLE pickup_orders 
ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_pickup_orders_deleted_at ON pickup_orders(deleted_at);

-- Add soft delete columns to catering_menu_orders
ALTER TABLE catering_menu_orders 
ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_catering_menu_orders_deleted_at ON catering_menu_orders(deleted_at);

-- Add soft delete columns to food_truck_requests
ALTER TABLE food_truck_requests 
ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_food_truck_requests_deleted_at ON food_truck_requests(deleted_at);

-- Add soft delete columns to job_applications
ALTER TABLE job_applications 
ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_job_applications_deleted_at ON job_applications(deleted_at);

-- Add soft delete columns to customer_reviews
ALTER TABLE customer_reviews 
ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_customer_reviews_deleted_at ON customer_reviews(deleted_at);

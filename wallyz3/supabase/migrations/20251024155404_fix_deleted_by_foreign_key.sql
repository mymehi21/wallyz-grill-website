/*
  # Fix Foreign Key Constraint for deleted_by Column

  1. Changes
    - Drop existing foreign key constraints on deleted_by columns
    - These constraints were causing issues because they reference auth.users
    - We'll keep the columns but remove the strict foreign key requirement
  
  2. Purpose
    - Allow soft deletes to work properly
    - The deleted_by column will still track who deleted items, but won't enforce the constraint
*/

-- Drop foreign key constraints from all tables
ALTER TABLE pickup_orders 
DROP CONSTRAINT IF EXISTS pickup_orders_deleted_by_fkey;

ALTER TABLE catering_menu_orders 
DROP CONSTRAINT IF EXISTS catering_menu_orders_deleted_by_fkey;

ALTER TABLE food_truck_requests 
DROP CONSTRAINT IF EXISTS food_truck_requests_deleted_by_fkey;

ALTER TABLE job_applications 
DROP CONSTRAINT IF EXISTS job_applications_deleted_by_fkey;

ALTER TABLE customer_reviews 
DROP CONSTRAINT IF EXISTS customer_reviews_deleted_by_fkey;

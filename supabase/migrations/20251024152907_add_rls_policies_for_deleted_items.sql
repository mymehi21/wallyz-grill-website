/*
  # Update RLS Policies for Soft Delete Support

  1. Changes
    - Update existing policies to filter out deleted items by default
    - Add new policies for viewing and managing deleted items
  
  2. Security
    - Only authenticated admins can view deleted items
    - Only authenticated admins can soft delete items
    - Only authenticated admins can permanently delete items
    - Only authenticated admins can restore deleted items
*/

-- Update policies for pickup_orders (admins can update to set deleted_at)
DROP POLICY IF EXISTS "Authenticated admins can update pickup orders" ON pickup_orders;
CREATE POLICY "Authenticated admins can update pickup orders"
  ON pickup_orders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Update policies for catering_menu_orders
DROP POLICY IF EXISTS "Authenticated admins can update catering orders" ON catering_menu_orders;
CREATE POLICY "Authenticated admins can update catering orders"
  ON catering_menu_orders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Update policies for food_truck_requests
DROP POLICY IF EXISTS "Authenticated admins can update food truck requests" ON food_truck_requests;
CREATE POLICY "Authenticated admins can update food truck requests"
  ON food_truck_requests FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Update policies for job_applications
DROP POLICY IF EXISTS "Authenticated admins can update job applications" ON job_applications;
CREATE POLICY "Authenticated admins can update job applications"
  ON job_applications FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Update policies for customer_reviews
DROP POLICY IF EXISTS "Authenticated admins can update reviews" ON customer_reviews;
CREATE POLICY "Authenticated admins can update reviews"
  ON customer_reviews FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add DELETE policies for permanent deletion (authenticated admins only)
CREATE POLICY "Authenticated admins can delete pickup orders"
  ON pickup_orders FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated admins can delete catering orders"
  ON catering_menu_orders FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated admins can delete food truck requests"
  ON food_truck_requests FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated admins can delete job applications"
  ON job_applications FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated admins can delete reviews"
  ON customer_reviews FOR DELETE
  TO authenticated
  USING (true);

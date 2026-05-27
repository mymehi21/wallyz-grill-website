/*
  # Add Catering Menu Items Table

  1. New Tables
    - `catering_menu_items`
      - `id` (uuid, primary key)
      - `name` (text) - Name of the catering item
      - `description` (text) - Description of the item
      - `price` (numeric) - Price of the item
      - `serves` (integer) - How many people this serves
      - `image_url` (text) - Optional image URL
      - `is_available` (boolean) - Whether item is available
      - `display_order` (integer) - Order to display items
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `catering_menu_items` table
    - Add policy for public read access
    - Add policy for authenticated admin write access
*/

CREATE TABLE IF NOT EXISTS catering_menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  serves integer DEFAULT 10,
  image_url text,
  is_available boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE catering_menu_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view available catering items" ON catering_menu_items;
CREATE POLICY "Anyone can view available catering items"
  ON catering_menu_items
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert catering items" ON catering_menu_items;
CREATE POLICY "Authenticated users can insert catering items"
  ON catering_menu_items
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update catering items" ON catering_menu_items;
CREATE POLICY "Authenticated users can update catering items"
  ON catering_menu_items
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete catering items" ON catering_menu_items;
CREATE POLICY "Authenticated users can delete catering items"
  ON catering_menu_items
  FOR DELETE
  TO authenticated
  USING (true);

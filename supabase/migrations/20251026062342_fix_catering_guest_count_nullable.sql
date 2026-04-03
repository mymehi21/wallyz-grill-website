/*
  # Fix Catering Menu Orders Schema
  
  1. Changes
    - Make `guest_count` nullable in `catering_menu_orders` table
    - This allows catering orders to be placed without specifying guest count
  
  2. Reason
    - Guest count is optional information for menu catering orders
    - Customers may not always know exact guest count when ordering party trays
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'catering_menu_orders' AND column_name = 'guest_count' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE catering_menu_orders ALTER COLUMN guest_count DROP NOT NULL;
  END IF;
END $$;

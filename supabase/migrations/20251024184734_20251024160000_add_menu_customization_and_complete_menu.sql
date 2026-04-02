/*
  # Add Menu Customization System and Complete Menu Items

  ## Overview
  This migration adds menu item customization capabilities and populates the database
  with the complete Wallyz Grill menu from their menu PDF.

  ## Schema Changes

  ### 1. Add customization fields to `menu_items`
  - `base_ingredients` (jsonb) - Array of base ingredients that can be removed
  - `protein_type` (text) - Main protein (beef, chicken, fish, etc.)
  - `allow_protein_additions` (boolean) - Whether additional proteins can be added
  - `customization_options` (jsonb) - Available add-ons and modifications

  ### 2. Add customization fields to `order_items`
  - `removed_ingredients` (jsonb) - List of ingredients customer removed
  - `added_items` (jsonb) - List of items customer added with prices

  ## Menu Data
  Adds complete menu with:
  - Burgers (7 items)
  - Subs (5 items)
  - Rice Bowls (3 items)
  - Shawarma (3 items)
  - Tacos (3 items)
  - Salads (2 items)
  - Sides (8 items)
  - Party Trays (3 items)

  ## Customization Rules
  - Base ingredients can be REMOVED (no charge)
  - Proteins can be ADDED (additional charge)
  - Proteins cannot be removed (core of the item)

  ## Security
  - No RLS changes needed (inherits from existing policies)
*/

-- Add customization columns to menu_items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'menu_items' AND column_name = 'base_ingredients'
  ) THEN
    ALTER TABLE menu_items ADD COLUMN base_ingredients jsonb DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'menu_items' AND column_name = 'protein_type'
  ) THEN
    ALTER TABLE menu_items ADD COLUMN protein_type text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'menu_items' AND column_name = 'allow_protein_additions'
  ) THEN
    ALTER TABLE menu_items ADD COLUMN allow_protein_additions boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'menu_items' AND column_name = 'customization_options'
  ) THEN
    ALTER TABLE menu_items ADD COLUMN customization_options jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Add customization columns to order_items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'order_items' AND column_name = 'removed_ingredients'
  ) THEN
    ALTER TABLE order_items ADD COLUMN removed_ingredients jsonb DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'order_items' AND column_name = 'added_items'
  ) THEN
    ALTER TABLE order_items ADD COLUMN added_items jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Insert menu categories
INSERT INTO menu_categories (name, description, display_order, is_active) VALUES
  ('Burgers', 'Juicy burgers made with quality beef patties', 1, true),
  ('Subs', 'Fresh subs with your choice of protein', 2, true),
  ('Rice Bowls', 'Flavorful rice bowls with marinated meats', 3, true),
  ('Shawarma', 'Authentic shawarma served in tortilla bread', 4, true),
  ('Tacos', 'Three delicious tacos per order', 5, true),
  ('Salads', 'Fresh and healthy salad options', 6, true),
  ('Sides', 'Perfect accompaniments to your meal', 7, true),
  ('Party Trays', 'Large portions perfect for gatherings', 8, true)
ON CONFLICT DO NOTHING;

-- Get category IDs (we'll use these in the menu items insert)
-- BURGERS
INSERT INTO menu_items (
  category_id,
  name,
  description,
  price,
  base_ingredients,
  protein_type,
  allow_protein_additions,
  display_order,
  is_available
)
SELECT
  id,
  'Classic Cheese Burger',
  'Beef Pattie, Lettuce, Tomatoes, Onions, American Cheese, Mustard, Ketchup, And Mayo.',
  7.99,
  '["Lettuce", "Tomatoes", "Onions", "American Cheese", "Mustard", "Ketchup", "Mayo"]'::jsonb,
  'Beef',
  true,
  1,
  true
FROM menu_categories WHERE name = 'Burgers'
ON CONFLICT DO NOTHING;

INSERT INTO menu_items (
  category_id,
  name,
  description,
  price,
  base_ingredients,
  protein_type,
  allow_protein_additions,
  display_order,
  is_available
)
SELECT
  id,
  'Smash Cheese Burger',
  'Double Beef Patties, Lettuce, Tomatoes, Grilled Onions, Pickels, American Cheese, Mayo And Special Sauce.',
  8.99,
  '["Lettuce", "Tomatoes", "Grilled Onions", "Pickels", "American Cheese", "Mayo", "Special Sauce"]'::jsonb,
  'Double Beef',
  true,
  2,
  true
FROM menu_categories WHERE name = 'Burgers'
ON CONFLICT DO NOTHING;

INSERT INTO menu_items (
  category_id,
  name,
  description,
  price,
  base_ingredients,
  protein_type,
  allow_protein_additions,
  display_order,
  is_available
)
SELECT
  id,
  'Mushroom Swiss Burger',
  'Double Beef Pattie, Seasoned Mushrooms, Grilled Onions, Specail Sauce, And Mayo.',
  8.99,
  '["Seasoned Mushrooms", "Grilled Onions", "Specail Sauce", "Mayo"]'::jsonb,
  'Double Beef',
  true,
  3,
  true
FROM menu_categories WHERE name = 'Burgers'
ON CONFLICT DO NOTHING;

INSERT INTO menu_items (
  category_id,
  name,
  description,
  price,
  base_ingredients,
  protein_type,
  allow_protein_additions,
  display_order,
  is_available
)
SELECT
  id,
  'Texas Burger',
  'Beef Pattie, Lettuce, Jalepeno, Grilled Onions, Swiss Cheese, Mayo, And Barbecue Sauce.',
  9.99,
  '["Lettuce", "Jalepeno", "Grilled Onions", "Swiss Cheese", "Mayo", "Barbecue Sauce"]'::jsonb,
  'Beef',
  true,
  4,
  true
FROM menu_categories WHERE name = 'Burgers'
ON CONFLICT DO NOTHING;

INSERT INTO menu_items (
  category_id,
  name,
  description,
  price,
  base_ingredients,
  protein_type,
  allow_protein_additions,
  display_order,
  is_available
)
SELECT
  id,
  'NachoBurger',
  'Beef Pattie, Lettuce, Green Peppers, Onions, Nacho Cheese, Doritos, Mayo, And Wallyz Sauce.',
  9.99,
  '["Lettuce", "Green Peppers", "Onions", "Nacho Cheese", "Doritos", "Mayo", "Wallyz Sauce"]'::jsonb,
  'Beef',
  true,
  5,
  true
FROM menu_categories WHERE name = 'Burgers'
ON CONFLICT DO NOTHING;

INSERT INTO menu_items (
  category_id,
  name,
  description,
  price,
  base_ingredients,
  protein_type,
  allow_protein_additions,
  display_order,
  is_available
)
SELECT
  id,
  'Crispy Chicken Burger',
  'Deep Fried Chicken, Lettuce, Tomatoes, Pickels, American Cheese, Mayo, And Wallyz Sauce.',
  7.99,
  '["Lettuce", "Tomatoes", "Pickels", "American Cheese", "Mayo", "Wallyz Sauce"]'::jsonb,
  'Fried Chicken',
  true,
  6,
  true
FROM menu_categories WHERE name = 'Burgers'
ON CONFLICT DO NOTHING;

INSERT INTO menu_items (
  category_id,
  name,
  description,
  price,
  base_ingredients,
  protein_type,
  allow_protein_additions,
  display_order,
  is_available
)
SELECT
  id,
  'Grilled Chicken Burger',
  'Grilled Chicken Breast, Lettuce, Tomatoes, Pickels, Swiss Cheese, Mayo, and Wallyz Sauce.',
  7.99,
  '["Lettuce", "Tomatoes", "Pickels", "Swiss Cheese", "Mayo", "Wallyz Sauce"]'::jsonb,
  'Grilled Chicken',
  true,
  7,
  true
FROM menu_categories WHERE name = 'Burgers'
ON CONFLICT DO NOTHING;

INSERT INTO menu_items (
  category_id,
  name,
  description,
  price,
  base_ingredients,
  protein_type,
  allow_protein_additions,
  display_order,
  is_available
)
SELECT
  id,
  'Wally z Burger',
  'Beef Pattie, Lettuce, Tomatoes, Pickels, Onion Rings, Mozzarella Stick, Mayo, Special Sauce, And Wallyz Sauce.',
  10.99,
  '["Lettuce", "Tomatoes", "Pickels", "Onion Rings", "Mozzarella Stick", "Mayo", "Special Sauce", "Wallyz Sauce"]'::jsonb,
  'Beef',
  true,
  8,
  true
FROM menu_categories WHERE name = 'Burgers'
ON CONFLICT DO NOTHING;

-- SUBS
INSERT INTO menu_items (
  category_id,
  name,
  description,
  price,
  base_ingredients,
  protein_type,
  allow_protein_additions,
  display_order,
  is_available
)
SELECT
  id,
  'Chicken Sub',
  'Grilled Chicken Breast, Lettuce, Tomatoes, Pickels, Garlic, Mayo.',
  9.99,
  '["Lettuce", "Tomatoes", "Pickels", "Garlic", "Mayo"]'::jsonb,
  'Grilled Chicken',
  true,
  1,
  true
FROM menu_categories WHERE name = 'Subs'
ON CONFLICT DO NOTHING;

INSERT INTO menu_items (
  category_id,
  name,
  description,
  price,
  base_ingredients,
  protein_type,
  allow_protein_additions,
  display_order,
  is_available
)
SELECT
  id,
  'Philly Steak Sub',
  'Marinated Philli Steak, Grilled Green Peppers, Grilled Onions, Lettuce, Tomatoes, Swiss Cheese, Mayo, And Wallyz Sauce.',
  10.99,
  '["Grilled Green Peppers", "Grilled Onions", "Lettuce", "Tomatoes", "Swiss Cheese", "Mayo", "Wallyz Sauce"]'::jsonb,
  'Philly Steak',
  true,
  2,
  true
FROM menu_categories WHERE name = 'Subs'
ON CONFLICT DO NOTHING;

INSERT INTO menu_items (
  category_id,
  name,
  description,
  price,
  base_ingredients,
  protein_type,
  allow_protein_additions,
  display_order,
  is_available
)
SELECT
  id,
  'Fajita Sub',
  'Grilled Chicken, Green Peppers, Onions, Mushrooms, Corn, Mozzarella Cheese, Mayo, And Wallyz Sauce.',
  9.99,
  '["Green Peppers", "Onions", "Mushrooms", "Corn", "Mozzarella Cheese", "Mayo", "Wallyz Sauce"]'::jsonb,
  'Grilled Chicken',
  true,
  3,
  true
FROM menu_categories WHERE name = 'Subs'
ON CONFLICT DO NOTHING;

INSERT INTO menu_items (
  category_id,
  name,
  description,
  price,
  base_ingredients,
  protein_type,
  allow_protein_additions,
  display_order,
  is_available
)
SELECT
  id,
  'Francisco Sub',
  'Grilled Marinated Chicken, Corn, Lettuce, Pickels, Mayo, And Wallyz Sauce.',
  9.99,
  '["Corn", "Lettuce", "Pickels", "Mayo", "Wallyz Sauce"]'::jsonb,
  'Grilled Chicken',
  true,
  4,
  true
FROM menu_categories WHERE name = 'Subs'
ON CONFLICT DO NOTHING;

INSERT INTO menu_items (
  category_id,
  name,
  description,
  price,
  base_ingredients,
  protein_type,
  allow_protein_additions,
  display_order,
  is_available
)
SELECT
  id,
  'Crispy Chicken Sub',
  'Deep Fried Chicken, Lettuce, Pickels, Tomatoes, Cheddar Cheese, And Mayo.',
  9.99,
  '["Lettuce", "Pickels", "Tomatoes", "Cheddar Cheese", "Mayo"]'::jsonb,
  'Fried Chicken',
  true,
  5,
  true
FROM menu_categories WHERE name = 'Subs'
ON CONFLICT DO NOTHING;

-- RICE BOWLS
INSERT INTO menu_items (
  category_id,
  name,
  description,
  price,
  base_ingredients,
  protein_type,
  allow_protein_additions,
  display_order,
  is_available
)
SELECT
  id,
  'Chicken Rice Bowl',
  'Marinated Grilled Chicken, Green Peppers, Onions, Lettuce, White Sauce, And Wallyz Sauce.',
  12.99,
  '["Green Peppers", "Onions", "Lettuce", "White Sauce", "Wallyz Sauce"]'::jsonb,
  'Grilled Chicken',
  true,
  1,
  true
FROM menu_categories WHERE name = 'Rice Bowls'
ON CONFLICT DO NOTHING;

INSERT INTO menu_items (
  category_id,
  name,
  description,
  price,
  base_ingredients,
  protein_type,
  allow_protein_additions,
  display_order,
  is_available
)
SELECT
  id,
  'Beef Gyro Rice Bowl',
  'Marinated Beef Gyro, Green Peppers, Onions, Lettuce, White Sauce, And Wallyz Sauce.',
  12.99,
  '["Green Peppers", "Onions", "Lettuce", "White Sauce", "Wallyz Sauce"]'::jsonb,
  'Beef Gyro',
  true,
  2,
  true
FROM menu_categories WHERE name = 'Rice Bowls'
ON CONFLICT DO NOTHING;

INSERT INTO menu_items (
  category_id,
  name,
  description,
  price,
  base_ingredients,
  protein_type,
  allow_protein_additions,
  display_order,
  is_available
)
SELECT
  id,
  'Mix Rice Bowl',
  'Marinated Beef Gyro, Grilled Chicken, Green Peppers, Onions, Lettuce, White Sauce, And Wallyz Sauce.',
  13.99,
  '["Green Peppers", "Onions", "Lettuce", "White Sauce", "Wallyz Sauce"]'::jsonb,
  'Beef Gyro & Chicken',
  true,
  3,
  true
FROM menu_categories WHERE name = 'Rice Bowls'
ON CONFLICT DO NOTHING;

-- SHAWARMA
INSERT INTO menu_items (
  category_id,
  name,
  description,
  price,
  base_ingredients,
  protein_type,
  allow_protein_additions,
  display_order,
  is_available
)
SELECT
  id,
  'Chicken Shawarma',
  'Chicken Shawarma Served In Tortilla Bread With Cucumber Pickles, And Garlic.',
  7.99,
  '["Cucumber Pickles", "Garlic"]'::jsonb,
  'Chicken',
  true,
  1,
  true
FROM menu_categories WHERE name = 'Shawarma'
ON CONFLICT DO NOTHING;

INSERT INTO menu_items (
  category_id,
  name,
  description,
  price,
  base_ingredients,
  protein_type,
  allow_protein_additions,
  display_order,
  is_available
)
SELECT
  id,
  'Beef Shawarma',
  'Beef Shawarma Served In Tortilla Bread With Grilled Onions, Tomatoes, Cucumber Pickles, And Tahini Sauce.',
  8.99,
  '["Grilled Onions", "Tomatoes", "Cucumber Pickles", "Tahini Sauce"]'::jsonb,
  'Beef',
  true,
  2,
  true
FROM menu_categories WHERE name = 'Shawarma'
ON CONFLICT DO NOTHING;

INSERT INTO menu_items (
  category_id,
  name,
  description,
  price,
  base_ingredients,
  protein_type,
  allow_protein_additions,
  display_order,
  is_available
)
SELECT
  id,
  'Wallyz Shawarma',
  'Marinated Grilled Chicken, Garlic, Pickles, And Our Special Wallyz Shawarma Sauce.',
  7.99,
  '["Garlic", "Pickles", "Wallyz Shawarma Sauce"]'::jsonb,
  'Grilled Chicken',
  true,
  3,
  true
FROM menu_categories WHERE name = 'Shawarma'
ON CONFLICT DO NOTHING;

-- TACOS
INSERT INTO menu_items (
  category_id,
  name,
  description,
  price,
  base_ingredients,
  protein_type,
  allow_protein_additions,
  display_order,
  is_available
)
SELECT
  id,
  'Chicken Tacos',
  'Marinated Grilled Chicken, Lettuce, Tomatoes, Mazzorella Cheese, Wallyz Sauce. (3 per order)',
  12.00,
  '["Lettuce", "Tomatoes", "Mazzorella Cheese", "Wallyz Sauce"]'::jsonb,
  'Grilled Chicken',
  true,
  1,
  true
FROM menu_categories WHERE name = 'Tacos'
ON CONFLICT DO NOTHING;

INSERT INTO menu_items (
  category_id,
  name,
  description,
  price,
  base_ingredients,
  protein_type,
  allow_protein_additions,
  display_order,
  is_available
)
SELECT
  id,
  'Steak Tacos',
  'Marinated Steak, Grilled Gren Peppers, Grilled Onions, Lettuce, Tomatoes, Mazorella Cheeese, And Wallyz Sauce. (3 per order)',
  12.00,
  '["Grilled Green Peppers", "Grilled Onions", "Lettuce", "Tomatoes", "Mazorella Cheese", "Wallyz Sauce"]'::jsonb,
  'Steak',
  true,
  2,
  true
FROM menu_categories WHERE name = 'Tacos'
ON CONFLICT DO NOTHING;

INSERT INTO menu_items (
  category_id,
  name,
  description,
  price,
  base_ingredients,
  protein_type,
  allow_protein_additions,
  display_order,
  is_available
)
SELECT
  id,
  'Burger Tacos',
  'Beef Pattie, Mozzarella Cheese, American Cheese, Lettuce, Tomatoes, Onions, Pickels, And Wallyz Sauce. (3 per order)',
  12.00,
  '["Mozzarella Cheese", "American Cheese", "Lettuce", "Tomatoes", "Onions", "Pickels", "Wallyz Sauce"]'::jsonb,
  'Beef',
  true,
  3,
  true
FROM menu_categories WHERE name = 'Tacos'
ON CONFLICT DO NOTHING;

-- SALADS
INSERT INTO menu_items (
  category_id,
  name,
  description,
  price,
  base_ingredients,
  protein_type,
  allow_protein_additions,
  display_order,
  is_available
)
SELECT
  id,
  'Fattoush Salad',
  'Fresh mixed greens with crispy pita chips',
  7.99,
  '[]'::jsonb,
  NULL,
  false,
  1,
  true
FROM menu_categories WHERE name = 'Salads'
ON CONFLICT DO NOTHING;

INSERT INTO menu_items (
  category_id,
  name,
  description,
  price,
  base_ingredients,
  protein_type,
  allow_protein_additions,
  display_order,
  is_available
)
SELECT
  id,
  'Caesar Salad',
  'Crisp romaine lettuce with Caesar dressing',
  9.99,
  '[]'::jsonb,
  NULL,
  false,
  2,
  true
FROM menu_categories WHERE name = 'Salads'
ON CONFLICT DO NOTHING;

-- SIDES
INSERT INTO menu_items (
  category_id,
  name,
  description,
  price,
  base_ingredients,
  protein_type,
  allow_protein_additions,
  display_order,
  is_available
)
SELECT
  id,
  'Cheese Sticks',
  'Crispy mozzarella cheese sticks',
  4.99,
  '[]'::jsonb,
  NULL,
  false,
  1,
  true
FROM menu_categories WHERE name = 'Sides'
ON CONFLICT DO NOTHING;

INSERT INTO menu_items (
  category_id,
  name,
  description,
  price,
  base_ingredients,
  protein_type,
  allow_protein_additions,
  display_order,
  is_available
)
SELECT
  id,
  'Onion Rings',
  'Golden crispy onion rings',
  4.99,
  '[]'::jsonb,
  NULL,
  false,
  2,
  true
FROM menu_categories WHERE name = 'Sides'
ON CONFLICT DO NOTHING;

INSERT INTO menu_items (
  category_id,
  name,
  description,
  price,
  base_ingredients,
  protein_type,
  allow_protein_additions,
  display_order,
  is_available
)
SELECT
  id,
  'Fries',
  'Classic golden french fries',
  3.99,
  '[]'::jsonb,
  NULL,
  false,
  3,
  true
FROM menu_categories WHERE name = 'Sides'
ON CONFLICT DO NOTHING;

INSERT INTO menu_items (
  category_id,
  name,
  description,
  price,
  base_ingredients,
  protein_type,
  allow_protein_additions,
  display_order,
  is_available
)
SELECT
  id,
  'Curly Fries',
  'Seasoned curly fries',
  4.99,
  '[]'::jsonb,
  NULL,
  false,
  4,
  true
FROM menu_categories WHERE name = 'Sides'
ON CONFLICT DO NOTHING;

INSERT INTO menu_items (
  category_id,
  name,
  description,
  price,
  base_ingredients,
  protein_type,
  allow_protein_additions,
  display_order,
  is_available
)
SELECT
  id,
  'Loadded Fries',
  'Fries loaded with toppings',
  8.99,
  '[]'::jsonb,
  NULL,
  false,
  5,
  true
FROM menu_categories WHERE name = 'Sides'
ON CONFLICT DO NOTHING;

INSERT INTO menu_items (
  category_id,
  name,
  description,
  price,
  base_ingredients,
  protein_type,
  allow_protein_additions,
  display_order,
  is_available
)
SELECT
  id,
  'Falafel Wrap',
  'Crispy falafel in a wrap',
  7.99,
  '[]'::jsonb,
  NULL,
  false,
  6,
  true
FROM menu_categories WHERE name = 'Sides'
ON CONFLICT DO NOTHING;

INSERT INTO menu_items (
  category_id,
  name,
  description,
  price,
  base_ingredients,
  protein_type,
  allow_protein_additions,
  display_order,
  is_available
)
SELECT
  id,
  'Chicken Wings',
  'Crispy chicken wings',
  7.99,
  '[]'::jsonb,
  NULL,
  false,
  7,
  true
FROM menu_categories WHERE name = 'Sides'
ON CONFLICT DO NOTHING;

INSERT INTO menu_items (
  category_id,
  name,
  description,
  price,
  base_ingredients,
  protein_type,
  allow_protein_additions,
  display_order,
  is_available
)
SELECT
  id,
  'Chicken Tenders & Fries',
  'Crispy chicken tenders with fries',
  9.99,
  '[]'::jsonb,
  NULL,
  false,
  8,
  true
FROM menu_categories WHERE name = 'Sides'
ON CONFLICT DO NOTHING;

-- PARTY TRAYS
INSERT INTO menu_items (
  category_id,
  name,
  description,
  price,
  base_ingredients,
  protein_type,
  allow_protein_additions,
  display_order,
  is_available
)
SELECT
  id,
  'Shawarma Tray',
  'Large tray of shawarma perfect for parties',
  65.99,
  '[]'::jsonb,
  NULL,
  false,
  1,
  true
FROM menu_categories WHERE name = 'Party Trays'
ON CONFLICT DO NOTHING;

INSERT INTO menu_items (
  category_id,
  name,
  description,
  price,
  base_ingredients,
  protein_type,
  allow_protein_additions,
  display_order,
  is_available
)
SELECT
  id,
  'Burger Tray',
  'Large tray of burgers perfect for parties',
  65.99,
  '[]'::jsonb,
  NULL,
  false,
  2,
  true
FROM menu_categories WHERE name = 'Party Trays'
ON CONFLICT DO NOTHING;

INSERT INTO menu_items (
  category_id,
  name,
  description,
  price,
  base_ingredients,
  protein_type,
  allow_protein_additions,
  display_order,
  is_available
)
SELECT
  id,
  'Sub Tray',
  'Large tray of subs perfect for parties',
  65.99,
  '[]'::jsonb,
  NULL,
  false,
  3,
  true
FROM menu_categories WHERE name = 'Party Trays'
ON CONFLICT DO NOTHING;

-- Set default customization options for items that allow protein additions
UPDATE menu_items
SET customization_options = '{
  "protein_additions": [
    {"name": "Extra Chicken", "price": 3.00},
    {"name": "Extra Beef", "price": 3.50},
    {"name": "Extra Steak", "price": 4.00},
    {"name": "Extra Fish", "price": 3.50}
  ]
}'::jsonb
WHERE allow_protein_additions = true;

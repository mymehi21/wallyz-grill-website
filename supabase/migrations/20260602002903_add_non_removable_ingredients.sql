ALTER TABLE menu_items
ADD COLUMN IF NOT EXISTS non_removable_ingredients jsonb DEFAULT '[]'::jsonb;

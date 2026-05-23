ALTER TABLE catering_menu_orders
ADD COLUMN IF NOT EXISTS subtotal_amount numeric,
ADD COLUMN IF NOT EXISTS applied_discounts jsonb DEFAULT '[]'::jsonb;

-- Add minimum spend threshold to discounts
ALTER TABLE discounts
ADD COLUMN IF NOT EXISTS min_subtotal numeric NOT NULL DEFAULT 0;

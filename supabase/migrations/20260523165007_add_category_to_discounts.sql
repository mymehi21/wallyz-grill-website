-- Discount category: 'regular' for normal menu items, 'party_trays' for party tray discounts
ALTER TABLE discounts
ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'regular';

-- Restaurant accounts table for tablet portal
CREATE TABLE IF NOT EXISTS restaurant_accounts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  username text UNIQUE NOT NULL,
  pin text NOT NULL CHECK (length(pin) = 4),
  location_id text NOT NULL CHECK (location_id IN ('location1', 'location2')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- confirmed_at column for orders
ALTER TABLE pickup_orders ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;
ALTER TABLE catering_orders ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;

-- RLS for restaurant_accounts
ALTER TABLE restaurant_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read restaurant_accounts"
ON restaurant_accounts FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "Allow authenticated insert restaurant_accounts"
ON restaurant_accounts FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated update restaurant_accounts"
ON restaurant_accounts FOR UPDATE TO authenticated
USING (true);

CREATE POLICY "Allow authenticated delete restaurant_accounts"
ON restaurant_accounts FOR DELETE TO authenticated
USING (true);

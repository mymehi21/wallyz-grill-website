CREATE TABLE IF NOT EXISTS discounts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('percentage', 'fixed', 'bogo')),
  value numeric NOT NULL DEFAULT 0,
  scope text NOT NULL CHECK (scope IN ('store', 'item')),
  item_ids text[] DEFAULT '{}',
  location_id text CHECK (location_id IN ('location1', 'location2', 'all')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read discounts" ON discounts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow authenticated manage discounts" ON discounts FOR ALL TO authenticated USING (true) WITH CHECK (true);

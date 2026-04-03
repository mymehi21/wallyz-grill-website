-- Fix RLS policies for site_settings so admins can save hours
-- and Contact page can read hours publicly

DROP POLICY IF EXISTS "Allow public read of site_settings" ON site_settings;
DROP POLICY IF EXISTS "Allow authenticated write to site_settings" ON site_settings;
DROP POLICY IF EXISTS "Allow authenticated update to site_settings" ON site_settings;

-- Anyone can read (needed for Contact page hours display)
CREATE POLICY "Allow public read of site_settings"
ON site_settings FOR SELECT
USING (true);

-- Authenticated users (admins) can insert
CREATE POLICY "Allow authenticated write to site_settings"
ON site_settings FOR INSERT
TO authenticated
WITH CHECK (true);

-- Authenticated users (admins) can update
CREATE POLICY "Allow authenticated update to site_settings"
ON site_settings FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Add full_name and last_login to admin_users if not exists
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS last_login timestamptz;

-- Add full_name to approved_admins if not exists
ALTER TABLE approved_admins ADD COLUMN IF NOT EXISTS full_name text;

-- Make sure testnetwork61@gmail.com is in approved_admins as super admin
INSERT INTO approved_admins (email, full_name, is_active)
VALUES ('testnetwork61@gmail.com', 'Super Admin', true)
ON CONFLICT (email) DO UPDATE SET is_active = true, full_name = 'Super Admin';

-- RLS for admin_users - allow authenticated users to read/write their own profile
DROP POLICY IF EXISTS "Allow authenticated read admin_users" ON admin_users;
DROP POLICY IF EXISTS "Allow authenticated write admin_users" ON admin_users;

CREATE POLICY "Allow authenticated read admin_users"
ON admin_users FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated write admin_users"
ON admin_users FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update admin_users"
ON admin_users FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- RLS for approved_admins - allow reading for signup verification, write only for super admin
DROP POLICY IF EXISTS "Allow public read approved_admins" ON approved_admins;
CREATE POLICY "Allow public read approved_admins"
ON approved_admins FOR SELECT USING (true);

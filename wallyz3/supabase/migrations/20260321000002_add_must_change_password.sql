-- Add must_change_password column to admin_users
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS must_change_password boolean DEFAULT false;

-- Make sure testnetwork61@gmail.com is in approved_admins
INSERT INTO approved_admins (email, full_name, is_active)
VALUES ('testnetwork61@gmail.com', 'Super Admin', true)
ON CONFLICT (email) DO UPDATE SET is_active = true;

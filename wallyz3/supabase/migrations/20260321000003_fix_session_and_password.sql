-- Set must_change_password to false for all existing admin users
-- so they don't get stuck in the change password loop
UPDATE admin_users SET must_change_password = false 
WHERE must_change_password IS NULL;

-- Set default to false for future rows
ALTER TABLE admin_users ALTER COLUMN must_change_password SET DEFAULT false;

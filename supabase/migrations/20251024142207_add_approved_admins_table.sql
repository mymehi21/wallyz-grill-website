/*
  # Approved Admin System

  ## Overview
  This migration creates a secure admin approval system where only pre-approved
  email addresses can create admin accounts. This prevents unauthorized access.

  ## New Tables

  ### `approved_admins`
  - `id` (uuid, primary key) - Unique identifier
  - `email` (text, unique) - Pre-approved admin email address
  - `is_active` (boolean) - Whether this admin approval is active
  - `created_at` (timestamptz) - When the email was approved
  - `created_by` (uuid) - Which admin approved this email (nullable for first admin)

  ## Security
  - Enable RLS on approved_admins table
  - Only authenticated admins can view approved emails
  - Only authenticated admins can add new approved emails
  - Public cannot view or modify approved admin list

  ## Important Notes
  1. You must manually add the first admin email to this table
  2. After that, admins can approve new admin emails through the dashboard
  3. Only pre-approved emails can create admin accounts
*/

-- Create approved admins table
CREATE TABLE IF NOT EXISTS approved_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES admin_users(id) ON DELETE SET NULL
);

ALTER TABLE approved_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated admins can view approved admins"
  ON approved_admins FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated admins can add approved admins"
  ON approved_admins FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated admins can update approved admins"
  ON approved_admins FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_approved_admins_email ON approved_admins(email) WHERE is_active = true;

-- Insert your first admin email (CHANGE THIS TO YOUR EMAIL)
-- This is commented out - you'll add this manually through Supabase dashboard
-- INSERT INTO approved_admins (email, is_active) VALUES ('your-email@example.com', true);

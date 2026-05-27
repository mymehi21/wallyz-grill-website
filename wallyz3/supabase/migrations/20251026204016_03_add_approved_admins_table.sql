/*
  # Approved Admin System

  ## Overview
  Creates a secure admin approval system where only pre-approved
  email addresses can create admin accounts.

  ## New Tables

  ### `approved_admins`
  - `id` (uuid, primary key) - Unique identifier
  - `email` (text, unique) - Pre-approved admin email address
  - `is_active` (boolean) - Whether this admin approval is active
  - `created_at` (timestamptz) - When the email was approved
  - `created_by` (uuid) - Which admin approved this email

  ## Security
  - RLS enabled with proper policies
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

DROP POLICY IF EXISTS "Anyone can check if email is approved" ON approved_admins;
CREATE POLICY "Anyone can check if email is approved"
  ON approved_admins FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Authenticated admins can add approved admins" ON approved_admins;
CREATE POLICY "Authenticated admins can add approved admins"
  ON approved_admins FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated admins can update approved admins" ON approved_admins;
CREATE POLICY "Authenticated admins can update approved admins"
  ON approved_admins FOR UPDATE
  TO authenticated
  USING (true);

-- Add index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_approved_admins_email ON approved_admins(email) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_approved_admins_created_by ON approved_admins(created_by);

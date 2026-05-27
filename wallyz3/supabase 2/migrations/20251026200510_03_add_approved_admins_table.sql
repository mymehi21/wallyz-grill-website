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
  - RLS disabled for easy viewing in dashboard
*/

-- Create approved admins table
CREATE TABLE IF NOT EXISTS approved_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES admin_users(id) ON DELETE SET NULL
);

ALTER TABLE approved_admins DISABLE ROW LEVEL SECURITY;

-- Add index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_approved_admins_email ON approved_admins(email) WHERE is_active = true;
-- Migration: Add supervisor role + create_leads / edit_leads permissions
-- Run this in the Supabase SQL editor.

-- 1. Widen the CHECK constraints to accept 'supervisor'
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'supervisor', 'agent'));

ALTER TABLE role_permissions
  DROP CONSTRAINT IF EXISTS role_permissions_role_check;
ALTER TABLE role_permissions
  ADD CONSTRAINT role_permissions_role_check CHECK (role IN ('admin', 'supervisor', 'agent'));

-- 2. Add new permission columns to role_permissions
ALTER TABLE role_permissions
  ADD COLUMN IF NOT EXISTS create_leads BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS edit_leads   BOOLEAN NOT NULL DEFAULT false;

-- 3. Set correct values for existing roles
UPDATE role_permissions SET create_leads = true,  edit_leads = true  WHERE role = 'admin';
UPDATE role_permissions SET create_leads = false, edit_leads = true  WHERE role = 'agent';

-- 4. Insert supervisor row
INSERT INTO role_permissions (role, see_all_leads, reassign_leads, delete_leads, view_stats, manage_pipeline, create_leads, edit_leads)
VALUES ('supervisor', true, true, false, true, true, true, true)
ON CONFLICT (role) DO NOTHING;

-- 5. Add same columns to user_permissions (nullable = inherit from role)
ALTER TABLE user_permissions
  ADD COLUMN IF NOT EXISTS create_leads BOOLEAN,
  ADD COLUMN IF NOT EXISTS edit_leads   BOOLEAN;

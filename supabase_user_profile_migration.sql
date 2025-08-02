-- Migration to add user profile fields to users table
-- Run this in your Supabase SQL Editor

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS profile_picture TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS manager_id INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- Add comments to document the columns
COMMENT ON COLUMN users.phone IS 'User contact phone number';
COMMENT ON COLUMN users.department IS 'Department where user works';
COMMENT ON COLUMN users.profile_picture IS 'Profile picture stored as data URL or file path';
COMMENT ON COLUMN users.bio IS 'User bio/about information';
COMMENT ON COLUMN users.manager_id IS 'Reference to manager user id';
COMMENT ON COLUMN users.last_login IS 'Timestamp of last login';

-- Create index on manager_id for better performance
CREATE INDEX IF NOT EXISTS idx_users_manager_id ON users(manager_id);

-- Update the RLS policies to include new fields
-- Users can read and update their own profile
CREATE POLICY "users_can_read_own_profile" ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "users_can_update_own_profile" ON users FOR UPDATE USING (auth.uid()::text = id::text);
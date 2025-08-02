-- =====================================================
-- Activity Logs Schema for Sales Order Management
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    user_email TEXT NOT NULL,
    user_name TEXT NOT NULL,
    action_type TEXT NOT NULL, -- 'login', 'logout', 'create', 'update', 'delete', 'view', 'export', 'inactivity_timeout'
    resource_type TEXT, -- 'customer', 'product', 'order', 'vehicle', 'user', 'profile', etc.
    resource_id TEXT, -- ID of the affected resource
    action_description TEXT NOT NULL, -- Human readable description
    details JSONB, -- Additional structured data about the action
    ip_address TEXT,
    user_agent TEXT,
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_email ON activity_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action_type ON activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_resource_type ON activity_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_session_id ON activity_logs(session_id);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_action ON activity_logs(user_id, action_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_resource ON activity_logs(resource_type, resource_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policy - only admins can view activity logs
CREATE POLICY "Admins can view all activity logs" ON activity_logs 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE email = auth.email() 
    AND role = 'Admin' 
    AND is_active = true
  )
);

-- Allow inserts for authenticated users (system will log their actions)
CREATE POLICY "Allow activity log inserts" ON activity_logs 
FOR INSERT WITH CHECK (true);

-- Grant permissions
GRANT ALL ON activity_logs TO authenticated;
GRANT ALL ON SEQUENCE activity_logs_id_seq TO authenticated;

-- Create a function to get user browser info (optional, for enhanced logging)
CREATE OR REPLACE FUNCTION get_client_info()
RETURNS TABLE(ip_address text, user_agent text) AS $$
BEGIN
  RETURN QUERY SELECT 
    current_setting('request.headers', true)::json->>'x-forwarded-for' as ip_address,
    current_setting('request.headers', true)::json->>'user-agent' as user_agent;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the table creation
SELECT 'Activity logs table created successfully' as status;
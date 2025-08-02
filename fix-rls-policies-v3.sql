-- =====================================================
-- Fix Row Level Security Policies for Sales Order Management
-- Clean version that handles existing policies properly
-- Run these in your Supabase SQL Editor
-- =====================================================

-- Function to safely drop policies if they exist
DO $$ 
BEGIN
    -- Drop all existing policies for all tables
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can read users" ON users';
    EXECUTE 'DROP POLICY IF EXISTS "Users can read own profile" ON users';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update own profile" ON users';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage all users" ON users';
    EXECUTE 'DROP POLICY IF EXISTS "Allow user inserts" ON users';
    
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can view customers" ON customers';
    EXECUTE 'DROP POLICY IF EXISTS "Authorized users can manage customers" ON customers';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can manage customers" ON customers';
    
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can view addresses" ON customer_addresses';
    EXECUTE 'DROP POLICY IF EXISTS "Authorized users can manage addresses" ON customer_addresses';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can manage addresses" ON customer_addresses';
    
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can view products" ON products';
    EXECUTE 'DROP POLICY IF EXISTS "Authorized users can manage products" ON products';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can manage products" ON products';
    
    EXECUTE 'DROP POLICY IF EXISTS "Users can view relevant orders" ON orders';
    EXECUTE 'DROP POLICY IF EXISTS "Users can manage orders based on role" ON orders';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can view orders" ON orders';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can manage orders" ON orders';
    
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can view order items" ON order_items';
    EXECUTE 'DROP POLICY IF EXISTS "Authorized users can manage order items" ON order_items';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can manage order items" ON order_items';
    
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can view vehicles" ON vehicles';
    EXECUTE 'DROP POLICY IF EXISTS "Authorized users can manage vehicles" ON vehicles';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can manage vehicles" ON vehicles';
    
    EXECUTE 'DROP POLICY IF EXISTS "Users can view own notifications" ON notifications';
    EXECUTE 'DROP POLICY IF EXISTS "Users can manage own notifications" ON notifications';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can view notifications" ON notifications';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can manage notifications" ON notifications';
    
    EXECUTE 'DROP POLICY IF EXISTS "Inventory users can view stock alerts" ON stock_alerts';
    EXECUTE 'DROP POLICY IF EXISTS "Inventory users can manage stock alerts" ON stock_alerts';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can view stock alerts" ON stock_alerts';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can manage stock alerts" ON stock_alerts';
    
    EXECUTE 'DROP POLICY IF EXISTS "Inventory users can view stock thresholds" ON stock_thresholds';
    EXECUTE 'DROP POLICY IF EXISTS "Inventory users can manage stock thresholds" ON stock_thresholds';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can view stock thresholds" ON stock_thresholds';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can manage stock thresholds" ON stock_thresholds';
    
    -- Activity logs policies
    EXECUTE 'DROP POLICY IF EXISTS "Admins can view all activity logs" ON activity_logs';
    EXECUTE 'DROP POLICY IF EXISTS "Allow activity log inserts" ON activity_logs';
    
END $$;

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- USERS TABLE POLICIES (Simplified to avoid recursion)
-- =====================================================

-- All authenticated users can read all user profiles
CREATE POLICY "users_read_policy" ON users 
FOR SELECT USING (auth.role() = 'authenticated');

-- Users can update their own profile using auth.email()
CREATE POLICY "users_update_own_policy" ON users 
FOR UPDATE USING (auth.email() = email);

-- Allow inserts for user creation (needed for invitations)
CREATE POLICY "users_insert_policy" ON users 
FOR INSERT WITH CHECK (true);

-- =====================================================
-- CUSTOMERS TABLE POLICIES
-- =====================================================

-- All authenticated users can view customers
CREATE POLICY "customers_read_policy" ON customers 
FOR SELECT USING (auth.role() = 'authenticated');

-- All authenticated users can manage customers
CREATE POLICY "customers_write_policy" ON customers 
FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- CUSTOMER ADDRESSES TABLE POLICIES
-- =====================================================

-- All authenticated users can view customer addresses
CREATE POLICY "addresses_read_policy" ON customer_addresses 
FOR SELECT USING (auth.role() = 'authenticated');

-- All authenticated users can manage addresses
CREATE POLICY "addresses_write_policy" ON customer_addresses 
FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- PRODUCTS TABLE POLICIES
-- =====================================================

-- All authenticated users can view products
CREATE POLICY "products_read_policy" ON products 
FOR SELECT USING (auth.role() = 'authenticated');

-- All authenticated users can manage products
CREATE POLICY "products_write_policy" ON products 
FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- ORDERS TABLE POLICIES
-- =====================================================

-- All authenticated users can view orders
CREATE POLICY "orders_read_policy" ON orders 
FOR SELECT USING (auth.role() = 'authenticated');

-- All authenticated users can manage orders
CREATE POLICY "orders_write_policy" ON orders 
FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- ORDER ITEMS TABLE POLICIES
-- =====================================================

-- All authenticated users can view order items
CREATE POLICY "order_items_read_policy" ON order_items 
FOR SELECT USING (auth.role() = 'authenticated');

-- All authenticated users can manage order items
CREATE POLICY "order_items_write_policy" ON order_items 
FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- VEHICLES TABLE POLICIES
-- =====================================================

-- All authenticated users can view vehicles
CREATE POLICY "vehicles_read_policy" ON vehicles 
FOR SELECT USING (auth.role() = 'authenticated');

-- All authenticated users can manage vehicles
CREATE POLICY "vehicles_write_policy" ON vehicles 
FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- NOTIFICATIONS TABLE POLICIES
-- =====================================================

-- All authenticated users can view all notifications (simplified)
CREATE POLICY "notifications_read_policy" ON notifications 
FOR SELECT USING (auth.role() = 'authenticated');

-- All authenticated users can manage all notifications
CREATE POLICY "notifications_write_policy" ON notifications 
FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- STOCK ALERTS TABLE POLICIES
-- =====================================================

-- All authenticated users can view stock alerts
CREATE POLICY "stock_alerts_read_policy" ON stock_alerts 
FOR SELECT USING (auth.role() = 'authenticated');

-- All authenticated users can manage stock alerts
CREATE POLICY "stock_alerts_write_policy" ON stock_alerts 
FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- STOCK THRESHOLDS TABLE POLICIES
-- =====================================================

-- All authenticated users can view stock thresholds
CREATE POLICY "stock_thresholds_read_policy" ON stock_thresholds 
FOR SELECT USING (auth.role() = 'authenticated');

-- All authenticated users can manage stock thresholds
CREATE POLICY "stock_thresholds_write_policy" ON stock_thresholds 
FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- ACTIVITY LOGS TABLE POLICIES
-- =====================================================

-- Only admins can view activity logs
CREATE POLICY "activity_logs_admin_read_policy" ON activity_logs 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE email = auth.email() 
    AND role = 'Admin' 
    AND is_active = true
  )
);

-- Allow inserts for authenticated users (system will log their actions)
CREATE POLICY "activity_logs_insert_policy" ON activity_logs 
FOR INSERT WITH CHECK (true);

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant table permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Grant sequence permissions
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- List all policies to verify they were created
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

SELECT 'RLS policies updated successfully - no recursion issues' as status;
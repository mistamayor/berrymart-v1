-- =====================================================
-- Fix Row Level Security Policies for Sales Order Management
-- Fixed version to prevent infinite recursion
-- Run these in your Supabase SQL Editor
-- =====================================================

-- Drop ALL existing policies first to prevent conflicts
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Authenticated users can view customers" ON customers;
DROP POLICY IF EXISTS "Authorized users can manage customers" ON customers;
DROP POLICY IF EXISTS "Authenticated users can view addresses" ON customer_addresses;
DROP POLICY IF EXISTS "Authorized users can manage addresses" ON customer_addresses;
DROP POLICY IF EXISTS "Authenticated users can view products" ON products;
DROP POLICY IF EXISTS "Authorized users can manage products" ON products;
DROP POLICY IF EXISTS "Users can view relevant orders" ON orders;
DROP POLICY IF EXISTS "Users can manage orders based on role" ON orders;
DROP POLICY IF EXISTS "Authenticated users can view order items" ON order_items;
DROP POLICY IF EXISTS "Authorized users can manage order items" ON order_items;
DROP POLICY IF EXISTS "Authenticated users can view vehicles" ON vehicles;
DROP POLICY IF EXISTS "Authorized users can manage vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can manage own notifications" ON notifications;
DROP POLICY IF EXISTS "Inventory users can view stock alerts" ON stock_alerts;
DROP POLICY IF EXISTS "Inventory users can manage stock alerts" ON stock_alerts;
DROP POLICY IF EXISTS "Inventory users can view stock thresholds" ON stock_thresholds;
DROP POLICY IF EXISTS "Inventory users can manage stock thresholds" ON stock_thresholds;

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

-- =====================================================
-- USERS TABLE POLICIES (Simplified to avoid recursion)
-- =====================================================

-- All authenticated users can read all user profiles
-- This avoids the circular dependency of checking user role within user table
CREATE POLICY "Authenticated users can read users" ON users 
FOR SELECT USING (auth.role() = 'authenticated');

-- Users can update their own profile using auth.email()
CREATE POLICY "Users can update own profile" ON users 
FOR UPDATE USING (auth.email() = email);

-- Allow inserts for user creation (needed for invitations)
CREATE POLICY "Allow user inserts" ON users 
FOR INSERT WITH CHECK (true);

-- =====================================================
-- CUSTOMERS TABLE POLICIES
-- =====================================================

-- All authenticated users can view customers
CREATE POLICY "Authenticated users can view customers" ON customers 
FOR SELECT USING (auth.role() = 'authenticated');

-- All authenticated users can manage customers
CREATE POLICY "Authenticated users can manage customers" ON customers 
FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- CUSTOMER ADDRESSES TABLE POLICIES
-- =====================================================

-- All authenticated users can view customer addresses
CREATE POLICY "Authenticated users can view addresses" ON customer_addresses 
FOR SELECT USING (auth.role() = 'authenticated');

-- All authenticated users can manage addresses
CREATE POLICY "Authenticated users can manage addresses" ON customer_addresses 
FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- PRODUCTS TABLE POLICIES
-- =====================================================

-- All authenticated users can view products
CREATE POLICY "Authenticated users can view products" ON products 
FOR SELECT USING (auth.role() = 'authenticated');

-- All authenticated users can manage products
CREATE POLICY "Authenticated users can manage products" ON products 
FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- ORDERS TABLE POLICIES
-- =====================================================

-- All authenticated users can view orders
CREATE POLICY "Authenticated users can view orders" ON orders 
FOR SELECT USING (auth.role() = 'authenticated');

-- All authenticated users can manage orders
CREATE POLICY "Authenticated users can manage orders" ON orders 
FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- ORDER ITEMS TABLE POLICIES
-- =====================================================

-- All authenticated users can view order items
CREATE POLICY "Authenticated users can view order items" ON order_items 
FOR SELECT USING (auth.role() = 'authenticated');

-- All authenticated users can manage order items
CREATE POLICY "Authenticated users can manage order items" ON order_items 
FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- VEHICLES TABLE POLICIES
-- =====================================================

-- All authenticated users can view vehicles
CREATE POLICY "Authenticated users can view vehicles" ON vehicles 
FOR SELECT USING (auth.role() = 'authenticated');

-- All authenticated users can manage vehicles
CREATE POLICY "Authenticated users can manage vehicles" ON vehicles 
FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- NOTIFICATIONS TABLE POLICIES
-- =====================================================

-- All authenticated users can view all notifications (simplified)
CREATE POLICY "Authenticated users can view notifications" ON notifications 
FOR SELECT USING (auth.role() = 'authenticated');

-- All authenticated users can manage all notifications
CREATE POLICY "Authenticated users can manage notifications" ON notifications 
FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- STOCK ALERTS TABLE POLICIES
-- =====================================================

-- All authenticated users can view stock alerts
CREATE POLICY "Authenticated users can view stock alerts" ON stock_alerts 
FOR SELECT USING (auth.role() = 'authenticated');

-- All authenticated users can manage stock alerts
CREATE POLICY "Authenticated users can manage stock alerts" ON stock_alerts 
FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- STOCK THRESHOLDS TABLE POLICIES
-- =====================================================

-- All authenticated users can view stock thresholds
CREATE POLICY "Authenticated users can view stock thresholds" ON stock_thresholds 
FOR SELECT USING (auth.role() = 'authenticated');

-- All authenticated users can manage stock thresholds
CREATE POLICY "Authenticated users can manage stock thresholds" ON stock_thresholds 
FOR ALL USING (auth.role() = 'authenticated');

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
-- TEST THE POLICIES
-- =====================================================

-- Test query to verify policies work
-- This should return data for authenticated users
SELECT 
    'Customers' as table_name, count(*) as record_count 
FROM customers
UNION ALL
SELECT 
    'Products' as table_name, count(*) as record_count 
FROM products
UNION ALL
SELECT 
    'Orders' as table_name, count(*) as record_count 
FROM orders
UNION ALL
SELECT 
    'Vehicles' as table_name, count(*) as record_count 
FROM vehicles;
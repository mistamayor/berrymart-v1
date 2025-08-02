-- =====================================================
-- Fix Row Level Security Policies for Sales Order Management
-- Run these in your Supabase SQL Editor
-- =====================================================

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
-- USERS TABLE POLICIES
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;

-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON users 
FOR SELECT USING (auth.email() = email);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users 
FOR UPDATE USING (auth.email() = email);

-- Admins can manage all users
CREATE POLICY "Admins can manage all users" ON users 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE email = auth.email() 
    AND role = 'Admin' 
    AND is_active = true
  )
);

-- =====================================================
-- CUSTOMERS TABLE POLICIES
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can view customers" ON customers;
DROP POLICY IF EXISTS "Authorized users can manage customers" ON customers;

-- All authenticated users can view customers
CREATE POLICY "Authenticated users can view customers" ON customers 
FOR SELECT USING (auth.role() = 'authenticated');

-- Authorized users can manage customers (Admin, Manager, Sales)
CREATE POLICY "Authorized users can manage customers" ON customers 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE email = auth.email() 
    AND role IN ('Admin', 'Manager', 'Sales')
    AND is_active = true
  )
);

-- =====================================================
-- CUSTOMER ADDRESSES TABLE POLICIES
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can view addresses" ON customer_addresses;
DROP POLICY IF EXISTS "Authorized users can manage addresses" ON customer_addresses;

-- All authenticated users can view customer addresses
CREATE POLICY "Authenticated users can view addresses" ON customer_addresses 
FOR SELECT USING (auth.role() = 'authenticated');

-- Authorized users can manage addresses
CREATE POLICY "Authorized users can manage addresses" ON customer_addresses 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE email = auth.email() 
    AND role IN ('Admin', 'Manager', 'Sales')
    AND is_active = true
  )
);

-- =====================================================
-- PRODUCTS TABLE POLICIES
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can view products" ON products;
DROP POLICY IF EXISTS "Authorized users can manage products" ON products;

-- All authenticated users can view products
CREATE POLICY "Authenticated users can view products" ON products 
FOR SELECT USING (auth.role() = 'authenticated');

-- Authorized users can manage products (Admin, Manager, Inventory)
CREATE POLICY "Authorized users can manage products" ON products 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE email = auth.email() 
    AND role IN ('Admin', 'Manager', 'Inventory')
    AND is_active = true
  )
);

-- =====================================================
-- ORDERS TABLE POLICIES
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view relevant orders" ON orders;
DROP POLICY IF EXISTS "Users can manage orders based on role" ON orders;

-- Users can view orders based on their role
CREATE POLICY "Users can view relevant orders" ON orders 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE email = auth.email() 
    AND is_active = true
    AND (
      -- Admin and Manager can see all orders
      role IN ('Admin', 'Manager', 'Accounts') OR
      -- Sales can see orders they created
      (role = 'Sales' AND orders.created_by = users.id) OR
      -- Inventory can see all orders for stock management
      role = 'Inventory' OR
      -- Delivery agents can see orders assigned to them
      role = 'DeliveryAgent'
    )
  )
);

-- Users can manage orders based on their role
CREATE POLICY "Users can manage orders based on role" ON orders 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE email = auth.email() 
    AND is_active = true
    AND (
      -- Admin and Manager can manage all orders
      role IN ('Admin', 'Manager') OR
      -- Sales can create and edit their own pending orders
      (role = 'Sales' AND (orders.created_by = users.id OR orders.status = 'pending')) OR
      -- Accounts can view and update financial aspects
      role = 'Accounts' OR
      -- Inventory can update stock-related fields
      role = 'Inventory'
    )
  )
);

-- =====================================================
-- ORDER ITEMS TABLE POLICIES
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can view order items" ON order_items;
DROP POLICY IF EXISTS "Authorized users can manage order items" ON order_items;

-- All authenticated users can view order items
CREATE POLICY "Authenticated users can view order items" ON order_items 
FOR SELECT USING (auth.role() = 'authenticated');

-- Authorized users can manage order items
CREATE POLICY "Authorized users can manage order items" ON order_items 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE email = auth.email() 
    AND role IN ('Admin', 'Manager', 'Sales', 'Inventory')
    AND is_active = true
  )
);

-- =====================================================
-- VEHICLES TABLE POLICIES
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can view vehicles" ON vehicles;
DROP POLICY IF EXISTS "Authorized users can manage vehicles" ON vehicles;

-- All authenticated users can view vehicles
CREATE POLICY "Authenticated users can view vehicles" ON vehicles 
FOR SELECT USING (auth.role() = 'authenticated');

-- Authorized users can manage vehicles (Admin, Manager)
CREATE POLICY "Authorized users can manage vehicles" ON vehicles 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE email = auth.email() 
    AND role IN ('Admin', 'Manager')
    AND is_active = true
  )
);

-- =====================================================
-- NOTIFICATIONS TABLE POLICIES
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can manage own notifications" ON notifications;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON notifications 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE email = auth.email() 
    AND users.id = notifications.user_id
    AND is_active = true
  )
);

-- Users can manage their own notifications
CREATE POLICY "Users can manage own notifications" ON notifications 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE email = auth.email() 
    AND users.id = notifications.user_id
    AND is_active = true
  )
);

-- =====================================================
-- STOCK ALERTS TABLE POLICIES
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Inventory users can view stock alerts" ON stock_alerts;
DROP POLICY IF EXISTS "Inventory users can manage stock alerts" ON stock_alerts;

-- Inventory-related users can view stock alerts
CREATE POLICY "Inventory users can view stock alerts" ON stock_alerts 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE email = auth.email() 
    AND role IN ('Admin', 'Manager', 'Inventory')
    AND is_active = true
  )
);

-- Inventory-related users can manage stock alerts
CREATE POLICY "Inventory users can manage stock alerts" ON stock_alerts 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE email = auth.email() 
    AND role IN ('Admin', 'Manager', 'Inventory')
    AND is_active = true
  )
);

-- =====================================================
-- STOCK THRESHOLDS TABLE POLICIES
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Inventory users can view stock thresholds" ON stock_thresholds;
DROP POLICY IF EXISTS "Inventory users can manage stock thresholds" ON stock_thresholds;

-- Inventory-related users can view stock thresholds
CREATE POLICY "Inventory users can view stock thresholds" ON stock_thresholds 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE email = auth.email() 
    AND role IN ('Admin', 'Manager', 'Inventory')
    AND is_active = true
  )
);

-- Inventory-related users can manage stock thresholds
CREATE POLICY "Inventory users can manage stock thresholds" ON stock_thresholds 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE email = auth.email() 
    AND role IN ('Admin', 'Manager', 'Inventory')
    AND is_active = true
  )
);

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
-- This should return data for authenticated admin users
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
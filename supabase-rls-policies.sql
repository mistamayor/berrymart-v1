-- Row Level Security Policies for Berrymart
-- Run this AFTER creating the schema

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
DECLARE
  user_role_val user_role;
BEGIN
  SELECT role INTO user_role_val
  FROM users
  WHERE email = auth.jwt() ->> 'email';
  
  RETURN COALESCE(user_role_val, 'Sales'::user_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get current user ID
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS bigint AS $$
DECLARE
  user_id_val bigint;
BEGIN
  SELECT id INTO user_id_val
  FROM users
  WHERE email = auth.jwt() ->> 'email';
  
  RETURN user_id_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users table policies
CREATE POLICY "Users can view all users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Only admins can insert users" ON users
  FOR INSERT WITH CHECK (get_user_role() = 'Admin');

CREATE POLICY "Admins can update all users, users can update themselves" ON users
  FOR UPDATE USING (
    get_user_role() = 'Admin' OR 
    email = auth.jwt() ->> 'email'
  );

CREATE POLICY "Only admins can delete users" ON users
  FOR DELETE USING (get_user_role() = 'Admin');

-- Customers table policies
CREATE POLICY "All authenticated users can view customers" ON customers
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Sales, managers, and admins can insert customers" ON customers
  FOR INSERT WITH CHECK (
    get_user_role() IN ('Admin', 'Manager', 'Sales', 'Accounts')
  );

CREATE POLICY "Sales, managers, and admins can update customers" ON customers
  FOR UPDATE USING (
    get_user_role() IN ('Admin', 'Manager', 'Sales', 'Accounts')
  );

CREATE POLICY "Only admins and managers can delete customers" ON customers
  FOR DELETE USING (get_user_role() IN ('Admin', 'Manager'));

-- Customer addresses policies
CREATE POLICY "Users can view customer addresses" ON customer_addresses
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Sales, managers, and admins can manage customer addresses" ON customer_addresses
  FOR ALL USING (
    get_user_role() IN ('Admin', 'Manager', 'Sales', 'Accounts')
  );

-- Products table policies
CREATE POLICY "All authenticated users can view products" ON products
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Inventory, managers, and admins can insert products" ON products
  FOR INSERT WITH CHECK (
    get_user_role() IN ('Admin', 'Manager', 'Inventory')
  );

CREATE POLICY "Inventory, managers, and admins can update products" ON products
  FOR UPDATE USING (
    get_user_role() IN ('Admin', 'Manager', 'Inventory')
  );

CREATE POLICY "Only admins and managers can delete products" ON products
  FOR DELETE USING (get_user_role() IN ('Admin', 'Manager'));

-- Orders table policies
CREATE POLICY "Users can view orders based on role" ON orders
  FOR SELECT USING (
    CASE get_user_role()
      WHEN 'Admin' THEN true
      WHEN 'Manager' THEN true
      WHEN 'Accounts' THEN true
      WHEN 'Inventory' THEN true
      WHEN 'Sales' THEN created_by = get_current_user_id()
      WHEN 'DeliveryAgent' THEN status IN ('approved', 'dispatched', 'delivered')
      ELSE false
    END
  );

CREATE POLICY "Sales, managers, and admins can create orders" ON orders
  FOR INSERT WITH CHECK (
    get_user_role() IN ('Admin', 'Manager', 'Sales') AND
    created_by = get_current_user_id()
  );

CREATE POLICY "Users can update orders based on role and status" ON orders
  FOR UPDATE USING (
    CASE get_user_role()
      WHEN 'Admin' THEN true
      WHEN 'Manager' THEN true
      WHEN 'Sales' THEN (created_by = get_current_user_id() AND status = 'pending')
      WHEN 'DeliveryAgent' THEN status IN ('approved', 'dispatched')
      ELSE false
    END
  );

-- Order items policies
CREATE POLICY "Users can view order items if they can view the order" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders o 
      WHERE o.id = order_items.order_id
      AND (
        CASE get_user_role()
          WHEN 'Admin' THEN true
          WHEN 'Manager' THEN true
          WHEN 'Accounts' THEN true
          WHEN 'Inventory' THEN true
          WHEN 'Sales' THEN o.created_by = get_current_user_id()
          WHEN 'DeliveryAgent' THEN o.status IN ('approved', 'dispatched', 'delivered')
          ELSE false
        END
      )
    )
  );

CREATE POLICY "Users can manage order items based on order permissions" ON order_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM orders o 
      WHERE o.id = order_items.order_id
      AND (
        get_user_role() IN ('Admin', 'Manager') OR
        (get_user_role() = 'Sales' AND o.created_by = get_current_user_id() AND o.status = 'pending')
      )
    )
  );

-- Vehicles table policies
CREATE POLICY "All authenticated users can view vehicles" ON vehicles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Managers and admins can manage vehicles" ON vehicles
  FOR ALL USING (get_user_role() IN ('Admin', 'Manager'));

-- Notifications table policies
CREATE POLICY "Users can only see their own notifications" ON notifications
  FOR SELECT USING (user_id = get_current_user_id());

CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (user_id = get_current_user_id());

CREATE POLICY "Users can delete their own notifications" ON notifications
  FOR DELETE USING (user_id = get_current_user_id());

-- Stock alerts table policies
CREATE POLICY "Inventory, managers, and admins can view stock alerts" ON stock_alerts
  FOR SELECT USING (
    get_user_role() IN ('Admin', 'Manager', 'Inventory')
  );

CREATE POLICY "System can create stock alerts" ON stock_alerts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Inventory, managers, and admins can update stock alerts" ON stock_alerts
  FOR UPDATE USING (
    get_user_role() IN ('Admin', 'Manager', 'Inventory')
  );

-- Stock thresholds table policies
CREATE POLICY "All authenticated users can view stock thresholds" ON stock_thresholds
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins and managers can update stock thresholds" ON stock_thresholds
  FOR UPDATE USING (get_user_role() IN ('Admin', 'Manager'));

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
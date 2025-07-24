export interface CustomerAddress {
  id: number;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  addresses: CustomerAddress[];
  type: 'retail' | 'wholesale' | 'open_market';
  created_at: string;
  last_modified_at?: string;
  last_modified_by?: string;
  last_modified_changes?: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  sku: string;
  base_price: number;
  retail_price: number;
  wholesale_price: number;
  open_market_price: number;
  stock_quantity: number;
  created_at: string;
}

export interface SalesOrder {
  id: number;
  customer_id: number;
  customer_name: string;
  customer_type: string;
  total_amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'dispatched' | 'delivered' | 'cancelled';
  created_at: string;
  created_by: number;
  created_by_name: string;
  approved_at?: string;
  approved_by?: string;
  dispatched_at?: string;
  dispatched_by?: string;
  dispatched_vehicle_id?: number;
  delivered_at?: string;
  pod_image?: string;
  tracking_number?: string;
  delivery_notes?: string;
  notes?: string;
  cancelled_at?: string;
  cancelled_by?: string;
  cancellation_reason?: string;
  last_modified_at?: string;
  last_modified_by?: string;
  last_modified_changes?: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface PricingTier {
  customer_type: 'retail' | 'wholesale' | 'open_market';
  discount_percentage: number;
  minimum_order_amount: number;
}

export interface TransportVehicle {
  id: number;
  type: 'van' | 'truck';
  name: string;
  license_plate: string;
  capacity: number;
  status: 'active' | 'maintenance' | 'retired';
  assigned_agent_id?: number;
  notes?: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  role: 'Admin' | 'Management' | 'Accounts' | 'Manager' | 'Sales' | 'Inventory' | 'DeliveryAgent';
  is_active: boolean;
  created_at: string;
  last_login?: string;
  first_name: string;
  last_name: string;
  department: string;
  phone: string;
  manager_id: number | null;
  vehicle_id?: number | null;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

export interface StockAlert {
  id: number;
  product_id: number;
  product_name: string;
  current_stock: number;
  threshold: number;
  alert_level: 'low' | 'critical' | 'out_of_stock';
  created_at: string;
  acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
}

export interface StockThreshold {
  low_stock: number;
  critical_stock: number;
}

export interface OrderEditPermissions {
  canEditCustomer: boolean;
  canEditItems: boolean;
  canEditNotes: boolean;
  canAddItems: boolean;
  canRemoveItems: boolean;
  canEditQuantities: boolean;
}

export interface OrderUpdateData {
  customer_id?: number;
  customer_name?: string;
  customer_type?: string;
  notes?: string;
  total_amount?: number;
}

export interface OrderItemUpdateData {
  product_id?: number;
  product_name?: string;
  quantity?: number;
  unit_price?: number;
  total_price?: number;
}
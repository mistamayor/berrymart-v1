export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: number
          email: string
          first_name: string
          last_name: string
          role: 'Admin' | 'Manager' | 'Accounts' | 'Sales' | 'Inventory' | 'DeliveryAgent'
          is_active: boolean
          phone: string | null
          department: string | null
          profile_picture: string | null
          bio: string | null
          manager_id: number | null
          last_login: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          email: string
          first_name: string
          last_name: string
          role: 'Admin' | 'Manager' | 'Accounts' | 'Sales' | 'Inventory' | 'DeliveryAgent'
          is_active?: boolean
          phone?: string | null
          department?: string | null
          profile_picture?: string | null
          bio?: string | null
          manager_id?: number | null
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          email?: string
          first_name?: string
          last_name?: string
          role?: 'Admin' | 'Manager' | 'Accounts' | 'Sales' | 'Inventory' | 'DeliveryAgent'
          is_active?: boolean
          phone?: string | null
          department?: string | null
          profile_picture?: string | null
          bio?: string | null
          manager_id?: number | null
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      customers: {
        Row: {
          id: number
          name: string
          email: string
          phone: string
          type: 'retail' | 'wholesale' | 'open_market'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          email: string
          phone: string
          type: 'retail' | 'wholesale' | 'open_market'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          email?: string
          phone?: string
          type?: 'retail' | 'wholesale' | 'open_market'
          created_at?: string
          updated_at?: string
        }
      }
      customer_addresses: {
        Row: {
          id: number
          customer_id: number
          address: string
          city: string
          state: string
          postal_code: string
          country: string
          is_default: boolean
          created_at: string
        }
        Insert: {
          id?: number
          customer_id: number
          address: string
          city: string
          state: string
          postal_code: string
          country: string
          is_default?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          customer_id?: number
          address?: string
          city?: string
          state?: string
          postal_code?: string
          country?: string
          is_default?: boolean
          created_at?: string
        }
      }
      products: {
        Row: {
          id: number
          name: string
          description: string
          sku: string
          base_price: number
          retail_price: number
          wholesale_price: number
          open_market_price: number
          stock_quantity: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          description: string
          sku: string
          base_price: number
          retail_price: number
          wholesale_price: number
          open_market_price: number
          stock_quantity: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          description?: string
          sku?: string
          base_price?: number
          retail_price?: number
          wholesale_price?: number
          open_market_price?: number
          stock_quantity?: number
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: number
          customer_id: number
          customer_name: string
          customer_type: 'retail' | 'wholesale' | 'open_market'
          total_amount: number
          status: 'pending' | 'approved' | 'dispatched' | 'delivered' | 'cancelled'
          notes: string | null
          tracking_number: string | null
          created_by: number
          created_by_name: string
          approved_by: string | null
          approved_at: string | null
          dispatched_by: string | null
          dispatched_at: string | null
          delivered_at: string | null
          pod_image: string | null
          delivery_notes: string | null
          cancelled_by: string | null
          cancelled_at: string | null
          cancellation_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          customer_id: number
          customer_name: string
          customer_type: 'retail' | 'wholesale' | 'open_market'
          total_amount: number
          status?: 'pending' | 'approved' | 'dispatched' | 'delivered' | 'cancelled'
          notes?: string | null
          tracking_number?: string | null
          created_by: number
          created_by_name: string
          approved_by?: string | null
          approved_at?: string | null
          dispatched_by?: string | null
          dispatched_at?: string | null
          delivered_at?: string | null
          pod_image?: string | null
          delivery_notes?: string | null
          cancelled_by?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          customer_id?: number
          customer_name?: string
          customer_type?: 'retail' | 'wholesale' | 'open_market'
          total_amount?: number
          status?: 'pending' | 'approved' | 'dispatched' | 'delivered' | 'cancelled'
          notes?: string | null
          tracking_number?: string | null
          created_by?: number
          created_by_name?: string
          approved_by?: string | null
          approved_at?: string | null
          dispatched_by?: string | null
          dispatched_at?: string | null
          delivered_at?: string | null
          pod_image?: string | null
          delivery_notes?: string | null
          cancelled_by?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: number
          order_id: number
          product_id: number
          product_name: string
          quantity: number
          unit_price: number
          total_price: number
          created_at: string
        }
        Insert: {
          id?: number
          order_id: number
          product_id: number
          product_name: string
          quantity: number
          unit_price: number
          total_price: number
          created_at?: string
        }
        Update: {
          id?: number
          order_id?: number
          product_id?: number
          product_name?: string
          quantity?: number
          unit_price?: number
          total_price?: number
          created_at?: string
        }
      }
      vehicles: {
        Row: {
          id: number
          license_plate: string
          type: 'van' | 'truck'
          capacity: number
          status: 'active' | 'maintenance' | 'retired'
          assigned_agent_id: number | null
          assigned_agent_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          license_plate: string
          type: 'van' | 'truck'
          capacity: number
          status?: 'active' | 'maintenance' | 'retired'
          assigned_agent_id?: number | null
          assigned_agent_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          license_plate?: string
          type?: 'van' | 'truck'
          capacity?: number
          status?: 'active' | 'maintenance' | 'retired'
          assigned_agent_id?: number | null
          assigned_agent_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: number
          user_id: number
          title: string
          message: string
          type: 'order_approval' | 'order_status' | 'system'
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: number
          user_id: number
          title: string
          message: string
          type: 'order_approval' | 'order_status' | 'system'
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: number
          title?: string
          message?: string
          type?: 'order_approval' | 'order_status' | 'system'
          is_read?: boolean
          created_at?: string
        }
      }
      stock_alerts: {
        Row: {
          id: number
          product_id: number
          product_name: string
          current_stock: number
          alert_level: 'out_of_stock' | 'critical' | 'low'
          acknowledged: boolean
          acknowledged_by: string | null
          acknowledged_at: string | null
          created_at: string
        }
        Insert: {
          id?: number
          product_id: number
          product_name: string
          current_stock: number
          alert_level: 'out_of_stock' | 'critical' | 'low'
          acknowledged?: boolean
          acknowledged_by?: string | null
          acknowledged_at?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          product_id?: number
          product_name?: string
          current_stock?: number
          alert_level?: 'out_of_stock' | 'critical' | 'low'
          acknowledged?: boolean
          acknowledged_by?: string | null
          acknowledged_at?: string | null
          created_at?: string
        }
      }
      stock_thresholds: {
        Row: {
          id: number
          critical: number
          low: number
          updated_at: string
        }
        Insert: {
          id?: number
          critical: number
          low: number
          updated_at?: string
        }
        Update: {
          id?: number
          critical?: number
          low?: number
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'Admin' | 'Manager' | 'Accounts' | 'Sales' | 'Inventory' | 'DeliveryAgent'
      customer_type: 'retail' | 'wholesale' | 'open_market'
      order_status: 'pending' | 'approved' | 'dispatched' | 'delivered' | 'cancelled'
      vehicle_type: 'van' | 'truck'
      vehicle_status: 'active' | 'maintenance' | 'retired'
      notification_type: 'order_approval' | 'order_status' | 'system'
      alert_level: 'out_of_stock' | 'critical' | 'low'
    }
  }
}
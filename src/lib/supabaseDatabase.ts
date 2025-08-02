import { supabase } from './supabase'
import { activityLogger } from './activityLogger'
import type { 
  User, 
  Customer, 
  CustomerAddress, 
  Product, 
  SalesOrder, 
  OrderItem, 
  TransportVehicle, 
  Notification, 
  StockAlert, 
  StockThreshold 
} from '../types'

export class SupabaseDatabase {
  
  // User methods
  async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  async getUserById(id: number): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null // No rows returned
      throw error
    }
    return data
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data
  }

  async createUser(user: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert(user)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  async updateUserProfile(id: number, profileData: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    department?: string;
    bio?: string;
  }): Promise<User> {
    return this.updateUser(id, profileData)
  }

  async updateProfilePicture(id: number, profilePicture: string): Promise<User> {
    return this.updateUser(id, { profile_picture: profilePicture })
  }

  async deleteUser(id: number): Promise<void> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  // Customer methods
  async getAllCustomers(): Promise<Customer[]> {
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select(`
        *,
        customer_addresses(*)
      `)
      .order('created_at', { ascending: false })
    
    if (customersError) throw customersError

    // Transform the data to match your existing Customer interface
    return customers?.map(customer => ({
      ...customer,
      addresses: customer.customer_addresses || []
    })) || []
  }

  async getCustomerById(id: number): Promise<Customer | null> {
    const { data, error } = await supabase
      .from('customers')
      .select(`
        *,
        customer_addresses(*)
      `)
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    return {
      ...data,
      addresses: data.customer_addresses || []
    }
  }

  async createCustomer(
    customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>, 
    addresses: Omit<CustomerAddress, 'id' | 'customer_id' | 'created_at'>[]
  ): Promise<Customer> {
    try {
      // Create the customer
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert({
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          type: customer.type
        })
        .select()
        .single()
      
      if (customerError) throw customerError

      // Insert addresses if provided
      let createdAddresses: any[] = []
      if (addresses && addresses.length > 0) {
        const addressData = addresses.map(addr => ({
          address: addr.address,
          city: addr.city,
          state: addr.state,
          postal_code: addr.postal_code,
          country: addr.country || 'Nigeria',
          is_default: addr.is_default || false,
          customer_id: newCustomer.id
        }))

        const { data: addressesData, error: addressError } = await supabase
          .from('customer_addresses')
          .insert(addressData)
          .select()
        
        if (addressError) {
          console.error('Address creation error:', addressError)
          // Don't throw here - customer was created successfully
          createdAddresses = []
        } else {
          createdAddresses = addressesData || []
        }
      }

      // Return the customer with a safe structure
      const result: Customer = {
        id: newCustomer.id,
        name: newCustomer.name,
        email: newCustomer.email,
        phone: newCustomer.phone,
        type: newCustomer.type,
        created_at: newCustomer.created_at,
        addresses: createdAddresses
      }

      // Log customer creation
      await activityLogger.logCreate(
        'customer',
        newCustomer.id.toString(),
        `Created customer: ${customer.name}`,
        {
          customer_name: customer.name,
          customer_email: customer.email,
          customer_type: customer.type,
          addresses_count: addresses.length
        }
      )

      return result
    } catch (error) {
      console.error('Error in createCustomer:', error)
      throw error
    }
  }

  async updateCustomer(id: number, updates: Partial<Customer>): Promise<Customer> {
    const { addresses, ...customerUpdates } = updates
    
    const { data, error } = await supabase
      .from('customers')
      .update(customerUpdates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error

    // Handle address updates if provided
    if (addresses) {
      // For simplicity, we'll delete existing addresses and recreate them
      await supabase
        .from('customer_addresses')
        .delete()
        .eq('customer_id', id)

      if (addresses.length > 0) {
        const addressData = addresses.map(addr => ({
          ...addr,
          customer_id: id
        }))

        await supabase
          .from('customer_addresses')
          .insert(addressData)
      }
    }

    const updatedCustomer = await this.getCustomerById(id)
    if (!updatedCustomer) {
      throw new Error('Failed to retrieve updated customer')
    }
    return updatedCustomer
  }

  // Product methods
  async getAllProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  async getProductById(id: number): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data
  }

  async createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single()
    
    if (error) throw error
    
    // Check for stock alerts after creating product
    await this.generateStockAlerts()
    
    return data
  }

  async updateProduct(id: number, updates: Partial<Product>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    // Check for stock alerts after updating product
    await this.generateStockAlerts()
    
    return data
  }

  // Order methods
  async getAllOrders(): Promise<SalesOrder[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  async getOrderById(id: number): Promise<SalesOrder | null> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data
  }

  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    const { data, error } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)
    
    if (error) throw error
    return data || []
  }

  async getOrdersContainingProduct(productId: number): Promise<{ orders: SalesOrder[], orderItems: OrderItem[] }> {
    // Get all order items for this product
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('product_id', productId)
    
    if (itemsError) throw itemsError

    if (!orderItems || orderItems.length === 0) {
      return { orders: [], orderItems: [] }
    }

    // Get unique order IDs
    const orderIds = [...new Set(orderItems.map(item => item.order_id))]
    
    // Get the orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .in('id', orderIds)
      .order('created_at', { ascending: false })
    
    if (ordersError) throw ordersError

    return {
      orders: orders || [],
      orderItems: orderItems
    }
  }

  async createOrder(
    order: Omit<SalesOrder, 'id' | 'created_at'>, 
    items: Omit<OrderItem, 'id' | 'order_id'>[]
  ): Promise<SalesOrder> {
    // CRITICAL: Validate stock availability BEFORE creating order
    const stockValidationErrors: string[] = []
    
    for (const item of items) {
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, name, stock_quantity')
        .eq('id', item.product_id)
        .single()
      
      if (productError) {
        throw new Error(`Product validation failed: ${productError.message}`)
      }

      if (!product) {
        stockValidationErrors.push(`Product ${item.product_id} not found`)
        continue
      }

      if (item.quantity > product.stock_quantity) {
        stockValidationErrors.push(
          `Insufficient stock for ${product.name}: requested ${item.quantity}, available ${product.stock_quantity}`
        )
      }
    }

    // Reject order creation if there are stock issues
    if (stockValidationErrors.length > 0) {
      throw new Error(`Cannot create order - ${stockValidationErrors.join('; ')}`)
    }

    // Create the order
    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert(order)
      .select()
      .single()
    
    if (orderError) throw orderError

    // Create order items
    const orderItemsData = items.map(item => ({
      ...item,
      order_id: newOrder.id
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsData)
    
    if (itemsError) throw itemsError

    // Update product stock quantities (stock already validated above)
    for (const item of items) {
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', item.product_id)
        .single()
      
      if (productError) throw productError

      const newStock = Math.max(0, product.stock_quantity - item.quantity)
      
      const { error: updateError } = await supabase
        .from('products')
        .update({ stock_quantity: newStock })
        .eq('id', item.product_id)
      
      if (updateError) throw updateError
    }

    // Generate stock alerts
    await this.generateStockAlerts()

    // Log order creation
    await activityLogger.logCreate(
      'order',
      newOrder.id.toString(),
      `Created order #${newOrder.id} for customer ${order.customer_id}`,
      {
        customer_id: order.customer_id,
        total_amount: order.total_amount,
        status: order.status,
        items_count: items.length,
        delivery_date: order.delivery_date
      }
    )

    return newOrder
  }

  async updateOrder(id: number, updates: Partial<SalesOrder>): Promise<SalesOrder> {
    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  async approveOrder(orderId: number, approvedBy: string): Promise<boolean> {
    const { error } = await supabase
      .from('orders')
      .update({
        status: 'approved',
        approved_by: approvedBy,
        approved_at: new Date().toISOString()
      })
      .eq('id', orderId)
    
    if (!error) {
      // Log order approval
      await activityLogger.logUpdate(
        'order',
        orderId.toString(),
        `Approved order #${orderId}`,
        {
          approved_by: approvedBy,
          previous_status: 'pending',
          new_status: 'approved'
        }
      )
    }
    
    return !error
  }

  async cancelOrder(orderId: number, cancelledBy: string, reason: string): Promise<boolean> {
    const { error } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        cancelled_by: cancelledBy,
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason
      })
      .eq('id', orderId)
    
    return !error
  }

  // Stock and alerts methods
  async getStockThresholds(): Promise<StockThreshold> {
    const { data, error } = await supabase
      .from('stock_thresholds')
      .select('*')
      .limit(1)
      .single()
    
    if (error) {
      // Return defaults if no thresholds exist
      return { critical: 0, low: 10 }
    }
    
    return { critical: data.critical, low: data.low }
  }

  async updateStockThresholds(thresholds: StockThreshold): Promise<void> {
    const { error } = await supabase
      .from('stock_thresholds')
      .upsert({
        id: 1, // Single row
        critical: thresholds.critical,
        low: thresholds.low
      })
    
    if (error) throw error
  }

  async getAllStockAlerts(): Promise<StockAlert[]> {
    const { data, error } = await supabase
      .from('stock_alerts')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  async acknowledgeStockAlert(alertId: number, acknowledgedBy: string): Promise<boolean> {
    const { error } = await supabase
      .from('stock_alerts')
      .update({
        acknowledged: true,
        acknowledged_by: acknowledgedBy,
        acknowledged_at: new Date().toISOString()
      })
      .eq('id', alertId)
    
    return !error
  }

  async generateStockAlerts(): Promise<void> {
    // Get current thresholds
    const thresholds = await this.getStockThresholds()
    
    // Get all products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
    
    if (productsError) throw productsError

    // Clear existing alerts
    await supabase.from('stock_alerts').delete().neq('id', 0)

    // Generate new alerts
    const alerts: Omit<StockAlert, 'id' | 'created_at'>[] = []
    
    products?.forEach(product => {
      let alertLevel: 'out_of_stock' | 'critical' | 'low' | null = null
      
      if (product.stock_quantity <= thresholds.critical) {
        alertLevel = product.stock_quantity === 0 ? 'out_of_stock' : 'critical'
      } else if (product.stock_quantity <= thresholds.low) {
        alertLevel = 'low'
      }
      
      if (alertLevel) {
        alerts.push({
          product_id: product.id,
          product_name: product.name,
          current_stock: product.stock_quantity,
          alert_level: alertLevel,
          acknowledged: false,
          acknowledged_by: null,
          acknowledged_at: null
        })
      }
    })

    if (alerts.length > 0) {
      const { error: alertsError } = await supabase
        .from('stock_alerts')
        .insert(alerts)
      
      if (alertsError) throw alertsError
    }
  }

  // Vehicle methods
  async getAllVehicles(): Promise<TransportVehicle[]> {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  async createVehicle(vehicle: Omit<TransportVehicle, 'id' | 'created_at' | 'updated_at'>): Promise<TransportVehicle> {
    const { data, error } = await supabase
      .from('vehicles')
      .insert(vehicle)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  async updateVehicle(id: number, updates: Partial<TransportVehicle>): Promise<TransportVehicle> {
    const { data, error } = await supabase
      .from('vehicles')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // Notification methods
  async getNotificationsByUserId(userId: number): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  async createNotification(notification: Omit<Notification, 'id' | 'created_at'>): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  async markNotificationAsRead(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
    
    return !error
  }

  // Permission checking methods (these will work with RLS)
  hasPermission(userRole: string, allowedRoles: string[]): boolean {
    return allowedRoles.includes(userRole)
  }

  canApproveOrders(userRole: string): boolean {
    return this.hasPermission(userRole, ['Admin', 'Manager'])
  }

  canManageInventory(userRole: string): boolean {
    return this.hasPermission(userRole, ['Admin', 'Manager', 'Inventory'])
  }

  canManageUsers(userRole: string): boolean {
    return this.hasPermission(userRole, ['Admin'])
  }

  canManageVehicles(userRole: string): boolean {
    return this.hasPermission(userRole, ['Admin', 'Manager'])
  }

  // Bulk operations
  async bulkApproveOrders(orderIds: number[], approvedBy: string): Promise<{ success: number[], failed: number[] }> {
    const success: number[] = []
    const failed: number[] = []

    for (const orderId of orderIds) {
      const result = await this.approveOrder(orderId, approvedBy)
      if (result) {
        success.push(orderId)
      } else {
        failed.push(orderId)
      }
    }

    return { success, failed }
  }

  async bulkRejectOrders(orderIds: number[], rejectedBy: string): Promise<{ success: number[], failed: number[] }> {
    const success: number[] = []
    const failed: number[] = []

    for (const orderId of orderIds) {
      const result = await this.cancelOrder(orderId, rejectedBy, 'Rejected by manager')
      if (result) {
        success.push(orderId)
      } else {
        failed.push(orderId)
      }
    }

    return { success, failed }
  }

  async bulkCancelOrders(orderIds: number[], cancelledBy: string, reason: string): Promise<{ success: number[], failed: number[] }> {
    const success: number[] = []
    const failed: number[] = []

    for (const orderId of orderIds) {
      const result = await this.cancelOrder(orderId, cancelledBy, reason)
      if (result) {
        success.push(orderId)
      } else {
        failed.push(orderId)
      }
    }

    return { success, failed }
  }
}

// Export singleton instance
export const supabaseDb = new SupabaseDatabase()
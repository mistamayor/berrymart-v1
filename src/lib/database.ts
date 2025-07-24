import { Customer, Product, SalesOrder, OrderItem, User, TransportVehicle, StockAlert, StockThreshold, OrderUpdateData, OrderItemUpdateData } from '../types';

class DatabaseManager {
  private customers: Customer[] = [];
  private products: Product[] = [];
  private orders: SalesOrder[] = [];
  private orderItems: OrderItem[] = [];
  private users: User[] = [];
  private transportVehicles: TransportVehicle[] = [];
  private stockAlerts: StockAlert[] = [];
  private stockThresholds: StockThreshold = { low_stock: 10, critical_stock: 5 };
  private nextCustomerId = 1;
  private nextProductId = 1;
  private nextOrderId = 1;
  private nextOrderItemId = 1;
  private nextUserId = 1;
  private nextVehicleId = 1;
  private nextStockAlertId = 1;

  constructor() {
    this.seedData();
    this.generateStockAlerts(); // Generate initial stock alerts
  }

  private seedData() {
    // Seed customers
    const customers = [
      { 
        id: this.nextCustomerId++,
        name: 'John Doe', 
        email: 'john@example.com', 
        phone: '123-456-7890', 
        addresses: [
          {
            id: 1,
            address: '123 Main St',
            city: 'Lagos',
            state: 'Lagos',
            postal_code: '100001',
            country: 'Nigeria',
            is_default: true
          }
        ],
        type: 'retail' as const,
        created_at: new Date().toISOString()
      },
      { 
        id: this.nextCustomerId++,
        name: 'ABC Corporation', 
        email: 'orders@abc.com', 
        phone: '987-654-3210', 
        addresses: [
          {
            id: 2,
            address: '456 Business Ave',
            city: 'Abuja',
            state: 'FCT',
            postal_code: '900001',
            country: 'Nigeria',
            is_default: true
          },
          {
            id: 3,
            address: 'Warehouse 2, Industrial Rd',
            city: 'Port Harcourt',
            state: 'Rivers',
            postal_code: '500001',
            country: 'Nigeria',
            is_default: false
          }
        ],
        type: 'wholesale' as const,
        created_at: new Date().toISOString()
      },
      { 
        id: this.nextCustomerId++,
        name: 'Market Vendor', 
        email: 'vendor@market.com', 
        phone: '555-123-4567', 
        addresses: [
          {
            id: 4,
            address: '789 Market St',
            city: 'Ibadan',
            state: 'Oyo',
            postal_code: '200001',
            country: 'Nigeria',
            is_default: true
          }
        ],
        type: 'open_market' as const,
        created_at: new Date().toISOString()
      },
    ];

    this.customers = customers;

    // Seed products
    const products = [
      {
        id: this.nextProductId++,
        name: 'Laptop Pro',
        description: 'High-performance laptop',
        sku: 'LAP-001',
        base_price: 800,
        retail_price: 1200,
        wholesale_price: 900,
        open_market_price: 1000,
        stock_quantity: 50,
        created_at: new Date().toISOString()
      },
      {
        id: this.nextProductId++,
        name: 'Wireless Mouse',
        description: 'Ergonomic wireless mouse',
        sku: 'MOU-001',
        base_price: 15,
        retail_price: 25,
        wholesale_price: 18,
        open_market_price: 22,
        stock_quantity: 200,
        created_at: new Date().toISOString()
      },
      {
        id: this.nextProductId++,
        name: 'Smartphone',
        description: 'Latest smartphone model',
        sku: 'PHO-001',
        base_price: 400,
        retail_price: 600,
        wholesale_price: 450,
        open_market_price: 550,
        stock_quantity: 100,
        created_at: new Date().toISOString()
      }
    ];

    this.products = products;

    // Seed users
    const users = [
      {
        id: this.nextUserId++,
        username: 'Admin',
        email: 'admin@company.com',
        password: 'password', // In production, this should be hashed
        role: 'Admin' as const,
        is_active: true,
        created_at: new Date().toISOString(),
        first_name: 'Alice',
        last_name: 'Anderson',
        department: 'Administration',
        phone: '555-000-0001',
        manager_id: null
      },
      {
        id: this.nextUserId++,
        username: 'john_sales',
        email: 'john@company.com',
        password: 'password123',
        role: 'Sales' as const,
        is_active: true,
        created_at: new Date().toISOString(),
        first_name: 'John',
        last_name: 'Doe',
        department: 'Sales',
        phone: '555-000-0002',
        manager_id: 3 // Mary Manager
      },
      {
        id: this.nextUserId++,
        username: 'mary_manager',
        email: 'mary@company.com',
        password: 'manager123',
        role: 'Manager' as const,
        is_active: true,
        created_at: new Date().toISOString(),
        first_name: 'Mary',
        last_name: 'Manager',
        department: 'Sales',
        phone: '555-000-0003',
        manager_id: 1 // Alice Admin
      },
      {
        id: this.nextUserId++,
        username: 'dave_agent',
        email: 'dave@company.com',
        password: 'agentpass',
        role: 'DeliveryAgent' as const,
        is_active: true,
        created_at: new Date().toISOString(),
        first_name: 'Dave',
        last_name: 'Driver',
        department: 'Transport',
        phone: '555-000-0004',
        manager_id: 1,
        vehicle_id: 1 // Assigned to Delivery Van 1
      }
    ];

    this.users = users;

    // Seed transport vehicles
    const vehicles = [
      {
        id: this.nextVehicleId++,
        type: 'van' as const,
        name: 'Delivery Van 1',
        license_plate: 'VAN-001',
        capacity: 1000,
        status: 'active' as const,
        notes: 'Main city van'
      },
      {
        id: this.nextVehicleId++,
        type: 'truck' as const,
        name: 'Truck Alpha',
        license_plate: 'TRK-101',
        capacity: 5000,
        status: 'active' as const,
        notes: 'Long haul truck'
      }
    ];
    this.transportVehicles = vehicles;
  }

  // Customer methods
  getAllCustomers(): Customer[] {
    return [...this.customers].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  getCustomerById(id: number): Customer | undefined {
    return this.customers.find(customer => customer.id === id);
  }

  createCustomer(customer: Omit<Customer, 'id' | 'created_at'>): Customer {
    const newCustomer: Customer = {
      ...customer,
      id: this.nextCustomerId++,
      created_at: new Date().toISOString()
    };
    this.customers.push(newCustomer);
    return newCustomer;
  }

  updateCustomer(
    id: number,
    updates: Partial<Omit<Customer, 'id' | 'created_at' | 'last_modified_at' | 'last_modified_by' | 'last_modified_changes'>> & {
      last_modified_by: string;
      last_modified_changes: string;
    }
  ): Customer {
    const customerIndex = this.customers.findIndex(c => c.id === id);
    if (customerIndex === -1) throw new Error('Customer not found');
    this.customers[customerIndex] = {
      ...this.customers[customerIndex],
      ...updates,
      last_modified_at: new Date().toISOString(),
      last_modified_by: updates.last_modified_by,
      last_modified_changes: updates.last_modified_changes
    };
    return this.customers[customerIndex];
  }

  // Product methods
  getAllProducts(): Product[] {
    return [...this.products].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  getProductById(id: number): Product | undefined {
    return this.products.find(product => product.id === id);
  }

  createProduct(product: Omit<Product, 'id' | 'created_at'>): Product {
    const newProduct: Product = {
      ...product,
      id: this.nextProductId++,
      created_at: new Date().toISOString()
    };
    this.products.push(newProduct);
    return newProduct;
  }

  updateProduct(id: number, updates: Partial<Omit<Product, 'id' | 'created_at'>>): Product {
    const productIndex = this.products.findIndex(p => p.id === id);
    if (productIndex === -1) throw new Error('Product not found');
    
    this.products[productIndex] = {
      ...this.products[productIndex],
      ...updates
    };
    
    // Check for stock alerts after product update
    this.checkAndGenerateStockAlerts();
    
    return this.products[productIndex];
  }

  // Order methods
  getAllOrders(): SalesOrder[] {
    return [...this.orders].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  getOrderById(id: number): SalesOrder | undefined {
    return this.orders.find(order => order.id === id);
  }

  getOrderItems(orderId: number): OrderItem[] {
    return this.orderItems.filter(item => item.order_id === orderId);
  }

  createOrder(order: Omit<SalesOrder, 'id' | 'created_at'>, items: Omit<OrderItem, 'id' | 'order_id'>[]): SalesOrder {
    const orderId = this.nextOrderId++;
    const newOrder: SalesOrder = {
      ...order,
      id: orderId,
      created_at: new Date().toISOString()
    };
    const newOrderItems: OrderItem[] = items.map(item => ({
      ...item,
      id: this.nextOrderItemId++,
      order_id: orderId
    }));
    this.orders.push(newOrder);
    this.orderItems.push(...newOrderItems);
    
    // Update product stock quantities and check for alerts
    items.forEach(item => {
      const product = this.products.find(p => p.id === item.product_id);
      if (product) {
        product.stock_quantity = Math.max(0, product.stock_quantity - item.quantity);
      }
    });
    
    this.checkAndGenerateStockAlerts();
    
    return newOrder;
  }

  approveOrder(orderId: number, approvedBy: string): boolean {
    const orderIndex = this.orders.findIndex(order => order.id === orderId);
    if (orderIndex === -1) return false;

    this.orders[orderIndex] = {
      ...this.orders[orderIndex],
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: approvedBy
    };

    return true;
  }

  rejectOrder(orderId: number, reason: string): boolean {
    const orderIndex = this.orders.findIndex(order => order.id === orderId);
    if (orderIndex === -1) return false;

    this.orders[orderIndex] = {
      ...this.orders[orderIndex],
      status: 'rejected',
      notes: reason
    };

    return true;
  }

  dispatchOrder(orderId: number, dispatchedBy: string, trackingNumber: string, vehicleId: number): boolean {
    const orderIndex = this.orders.findIndex(order => order.id === orderId);
    if (orderIndex === -1) return false;

    this.orders[orderIndex] = {
      ...this.orders[orderIndex],
      status: 'dispatched',
      dispatched_at: new Date().toISOString(),
      dispatched_by: dispatchedBy,
      tracking_number: trackingNumber,
      dispatched_vehicle_id: vehicleId
    };

    return true;
  }

  markDelivered(orderId: number, podImage: string, deliveryNotes: string): boolean {
    const orderIndex = this.orders.findIndex(order => order.id === orderId);
    if (orderIndex === -1) return false;

    this.orders[orderIndex] = {
      ...this.orders[orderIndex],
      status: 'delivered',
      delivered_at: new Date().toISOString(),
      pod_image: podImage,
      delivery_notes: deliveryNotes
    };

    return true;
  }

  // Order editing methods
  updateOrder(orderId: number, updates: OrderUpdateData, modifiedBy: string): SalesOrder | null {
    const orderIndex = this.orders.findIndex(order => order.id === orderId);
    if (orderIndex === -1) return null;

    const currentOrder = this.orders[orderIndex];
    
    // Create change log
    const changes: Record<string, { old: any; new: any }> = {};
    Object.keys(updates).forEach(key => {
      const typedKey = key as keyof OrderUpdateData;
      if (updates[typedKey] !== undefined && currentOrder[typedKey as keyof SalesOrder] !== updates[typedKey]) {
        changes[key] = {
          old: currentOrder[typedKey as keyof SalesOrder],
          new: updates[typedKey]
        };
      }
    });

    // Update order
    this.orders[orderIndex] = {
      ...currentOrder,
      ...updates,
      last_modified_at: new Date().toISOString(),
      last_modified_by: modifiedBy,
      last_modified_changes: JSON.stringify(changes)
    };

    return this.orders[orderIndex];
  }

  updateOrderItem(itemId: number, updates: OrderItemUpdateData): OrderItem | null {
    const itemIndex = this.orderItems.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return null;

    const currentItem = this.orderItems[itemIndex];
    const oldQuantity = currentItem.quantity;
    const newQuantity = updates.quantity ?? oldQuantity;

    // Handle stock adjustments
    if (updates.quantity && updates.quantity !== oldQuantity) {
      const product = this.products.find(p => p.id === currentItem.product_id);
      if (product) {
        // Return old quantity to stock and subtract new quantity
        const stockDifference = oldQuantity - newQuantity;
        product.stock_quantity = Math.max(0, product.stock_quantity + stockDifference);
      }
    }

    // Update item
    this.orderItems[itemIndex] = {
      ...currentItem,
      ...updates,
      total_price: updates.quantity && updates.unit_price 
        ? updates.quantity * updates.unit_price 
        : currentItem.total_price
    };

    // Update order total
    this.recalculateOrderTotal(currentItem.order_id);
    this.checkAndGenerateStockAlerts();

    return this.orderItems[itemIndex];
  }

  addOrderItem(orderId: number, item: Omit<OrderItem, 'id' | 'order_id'>): OrderItem | null {
    // Check if order exists
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return null;

    // Check stock availability
    const product = this.products.find(p => p.id === item.product_id);
    if (!product || product.stock_quantity < item.quantity) {
      return null; // Insufficient stock
    }

    // Create new order item
    const newItem: OrderItem = {
      ...item,
      id: this.nextOrderItemId++,
      order_id: orderId,
      total_price: item.quantity * item.unit_price
    };

    this.orderItems.push(newItem);

    // Update product stock
    product.stock_quantity -= item.quantity;

    // Update order total
    this.recalculateOrderTotal(orderId);
    this.checkAndGenerateStockAlerts();

    return newItem;
  }

  removeOrderItem(itemId: number): boolean {
    const itemIndex = this.orderItems.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return false;

    const itemToRemove = this.orderItems[itemIndex];
    
    // Return stock to product
    const product = this.products.find(p => p.id === itemToRemove.product_id);
    if (product) {
      product.stock_quantity += itemToRemove.quantity;
    }

    // Remove item
    this.orderItems.splice(itemIndex, 1);

    // Update order total
    this.recalculateOrderTotal(itemToRemove.order_id);
    this.checkAndGenerateStockAlerts();

    return true;
  }

  private recalculateOrderTotal(orderId: number): void {
    const orderIndex = this.orders.findIndex(order => order.id === orderId);
    if (orderIndex === -1) return;

    const orderItems = this.orderItems.filter(item => item.order_id === orderId);
    const totalAmount = orderItems.reduce((sum, item) => sum + item.total_price, 0);

    this.orders[orderIndex] = {
      ...this.orders[orderIndex],
      total_amount: totalAmount
    };
  }

  canEditOrder(orderId: number, userRole: string): boolean {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return false;

    // Business rules for editing permissions
    switch (order.status) {
      case 'pending':
        return ['Admin', 'Manager', 'Sales'].includes(userRole);
      case 'approved':
        return ['Admin', 'Manager'].includes(userRole);
      case 'rejected':
        return ['Admin', 'Manager', 'Sales'].includes(userRole);
      case 'dispatched':
      case 'delivered':
        return ['Admin'].includes(userRole); // Very limited editing for dispatched/delivered
      case 'cancelled':
        return false; // Cancelled orders cannot be edited
      default:
        return false;
    }
  }

  cancelOrder(orderId: number, reason: string, cancelledBy: string): boolean {
    const orderIndex = this.orders.findIndex(order => order.id === orderId);
    if (orderIndex === -1) return false;

    const order = this.orders[orderIndex];
    
    // Prevent cancellation of already completed/cancelled orders
    if (['delivered', 'cancelled'].includes(order.status)) {
      return false;
    }

    // Restore stock for all order items
    const orderItems = this.orderItems.filter(item => item.order_id === orderId);
    orderItems.forEach(item => {
      const product = this.products.find(p => p.id === item.product_id);
      if (product) {
        product.stock_quantity += item.quantity;
      }
    });

    // Update order status
    this.orders[orderIndex] = {
      ...order,
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancelled_by: cancelledBy,
      cancellation_reason: reason
    };

    // Update stock alerts after restoration
    this.checkAndGenerateStockAlerts();
    
    return true;
  }

  canCancelOrder(orderId: number, userRole: string, userId: number): boolean {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return false;

    // Cannot cancel completed, rejected, or already cancelled orders
    if (['delivered', 'rejected', 'cancelled'].includes(order.status)) {
      return false;
    }

    // Role-based cancellation permissions
    switch (userRole) {
      case 'Admin':
        return true; // Can cancel any status
      case 'Manager':
        return ['pending', 'approved'].includes(order.status);
      case 'Sales':
        return order.status === 'pending' && order.created_by === userId;
      default:
        return false;
    }
  }

  // Bulk order operations
  bulkApproveOrders(orderIds: number[], approvedBy: string, comment?: string): { successful: number[]; failed: Array<{orderId: number; reason: string}>; totalProcessed: number } {
    const successful: number[] = [];
    const failed: Array<{orderId: number; reason: string}> = [];

    orderIds.forEach(orderId => {
      const order = this.orders.find(o => o.id === orderId);
      if (!order) {
        failed.push({ orderId, reason: 'Order not found' });
        return;
      }
      
      if (order.status !== 'pending') {
        failed.push({ orderId, reason: `Order status is ${order.status}, not pending` });
        return;
      }

      if (this.approveOrder(orderId, approvedBy)) {
        successful.push(orderId);
      } else {
        failed.push({ orderId, reason: 'Failed to approve order' });
      }
    });

    return {
      successful,
      failed,
      totalProcessed: orderIds.length
    };
  }

  bulkRejectOrders(orderIds: number[], reason: string): { successful: number[]; failed: Array<{orderId: number; reason: string}>; totalProcessed: number } {
    const successful: number[] = [];
    const failed: Array<{orderId: number; reason: string}> = [];

    orderIds.forEach(orderId => {
      const order = this.orders.find(o => o.id === orderId);
      if (!order) {
        failed.push({ orderId, reason: 'Order not found' });
        return;
      }
      
      if (order.status !== 'pending') {
        failed.push({ orderId, reason: `Order status is ${order.status}, not pending` });
        return;
      }

      if (this.rejectOrder(orderId, reason)) {
        successful.push(orderId);
      } else {
        failed.push({ orderId, reason: 'Failed to reject order' });
      }
    });

    return {
      successful,
      failed,
      totalProcessed: orderIds.length
    };
  }

  bulkCancelOrders(orderIds: number[], reason: string, cancelledBy: string): { successful: number[]; failed: Array<{orderId: number; reason: string}>; totalProcessed: number } {
    const successful: number[] = [];
    const failed: Array<{orderId: number; reason: string}> = [];

    orderIds.forEach(orderId => {
      const order = this.orders.find(o => o.id === orderId);
      if (!order) {
        failed.push({ orderId, reason: 'Order not found' });
        return;
      }
      
      if (['delivered', 'cancelled'].includes(order.status)) {
        failed.push({ orderId, reason: `Cannot cancel ${order.status} order` });
        return;
      }

      if (this.cancelOrder(orderId, reason, cancelledBy)) {
        successful.push(orderId);
      } else {
        failed.push({ orderId, reason: 'Failed to cancel order' });
      }
    });

    return {
      successful,
      failed,
      totalProcessed: orderIds.length
    };
  }

  bulkDispatchOrders(orderIds: number[], dispatchedBy: string, trackingNumbers: string[], vehicleId: number): { successful: number[]; failed: Array<{orderId: number; reason: string}>; totalProcessed: number } {
    const successful: number[] = [];
    const failed: Array<{orderId: number; reason: string}> = [];

    orderIds.forEach((orderId, index) => {
      const order = this.orders.find(o => o.id === orderId);
      if (!order) {
        failed.push({ orderId, reason: 'Order not found' });
        return;
      }
      
      if (order.status !== 'approved') {
        failed.push({ orderId, reason: `Order status is ${order.status}, not approved` });
        return;
      }

      const trackingNumber = trackingNumbers[index] || `BULK-${Date.now()}-${orderId}`;
      
      if (this.dispatchOrder(orderId, dispatchedBy, trackingNumber, vehicleId)) {
        successful.push(orderId);
      } else {
        failed.push({ orderId, reason: 'Failed to dispatch order' });
      }
    });

    return {
      successful,
      failed,
      totalProcessed: orderIds.length
    };
  }

  // User methods
  getAllUsers(): User[] {
    return [...this.users].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  getUserById(id: number): User | undefined {
    return this.users.find(user => user.id === id);
  }

  authenticateUser(username: string, password: string): User | null {
    const user = this.users.find(u => 
      u.username === username && 
      u.password === password && 
      u.is_active
    );
    
    if (user) {
      // Update last login
      const userIndex = this.users.findIndex(u => u.id === user.id);
      if (userIndex !== -1) {
        this.users[userIndex] = {
          ...this.users[userIndex],
          last_login: new Date().toISOString()
        };
      }
      return { ...user, last_login: new Date().toISOString() };
    }
    
    return null;
  }

  createUser(user: Omit<User, 'id' | 'created_at'>): User {
    const newUser: User = {
      ...user,
      id: this.nextUserId++,
      created_at: new Date().toISOString()
    };
    this.users.push(newUser);
    return newUser;
  }

  updateUser(id: number, updates: Partial<Omit<User, 'id' | 'created_at'>>): boolean {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) return false;

    this.users[userIndex] = {
      ...this.users[userIndex],
      ...updates
    };

    return true;
  }

  deleteUser(id: number): boolean {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) return false;

    this.users.splice(userIndex, 1);
    return true;
  }

  // Transport vehicle methods
  getAllTransportVehicles(): TransportVehicle[] {
    return [...this.transportVehicles];
  }

  createTransportVehicle(vehicle: Omit<TransportVehicle, 'id'>): TransportVehicle {
    const newVehicle: TransportVehicle = {
      ...vehicle,
      id: this.nextVehicleId++
    };
    this.transportVehicles.push(newVehicle);
    return newVehicle;
  }

  assignAgentToVehicle(vehicleId: number, agentId: number): boolean {
    const vehicle = this.transportVehicles.find(v => v.id === vehicleId);
    const agent = this.users.find(u => u.id === agentId && u.role === 'DeliveryAgent');
    if (!vehicle || !agent) return false;
    vehicle.assigned_agent_id = agentId;
    agent.vehicle_id = vehicleId;
    return true;
  }

  // Stock Alert methods
  getAllStockAlerts(): StockAlert[] {
    return [...this.stockAlerts].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  getActiveStockAlerts(): StockAlert[] {
    return this.stockAlerts.filter(alert => !alert.acknowledged);
  }

  generateStockAlerts(): StockAlert[] {
    const newAlerts: StockAlert[] = [];
    
    this.products.forEach(product => {
      const existingAlert = this.stockAlerts.find(
        alert => alert.product_id === product.id && !alert.acknowledged
      );
      
      // Don't create duplicate alerts for the same product
      if (existingAlert) return;
      
      let alertLevel: 'low' | 'critical' | 'out_of_stock' | null = null;
      let threshold = 0;
      
      if (product.stock_quantity === 0) {
        alertLevel = 'out_of_stock';
        threshold = 0;
      } else if (product.stock_quantity <= this.stockThresholds.critical_stock) {
        alertLevel = 'critical';
        threshold = this.stockThresholds.critical_stock;
      } else if (product.stock_quantity <= this.stockThresholds.low_stock) {
        alertLevel = 'low';
        threshold = this.stockThresholds.low_stock;
      }
      
      if (alertLevel) {
        const alert: StockAlert = {
          id: this.nextStockAlertId++,
          product_id: product.id,
          product_name: product.name,
          current_stock: product.stock_quantity,
          threshold,
          alert_level: alertLevel,
          created_at: new Date().toISOString(),
          acknowledged: false
        };
        
        this.stockAlerts.push(alert);
        newAlerts.push(alert);
      }
    });
    
    return newAlerts;
  }

  acknowledgeStockAlert(alertId: number, acknowledgedBy: string): boolean {
    const alertIndex = this.stockAlerts.findIndex(alert => alert.id === alertId);
    if (alertIndex === -1) return false;
    
    this.stockAlerts[alertIndex] = {
      ...this.stockAlerts[alertIndex],
      acknowledged: true,
      acknowledged_by: acknowledgedBy,
      acknowledged_at: new Date().toISOString()
    };
    
    return true;
  }

  updateStockThresholds(thresholds: StockThreshold): void {
    this.stockThresholds = { ...thresholds };
  }

  getStockThresholds(): StockThreshold {
    return { ...this.stockThresholds };
  }

  // Auto-generate alerts when products are updated or orders are created
  private checkAndGenerateStockAlerts(): void {
    this.generateStockAlerts();
  }

  close() {
    // No-op for in-memory implementation
  }
}

export const db = new DatabaseManager();
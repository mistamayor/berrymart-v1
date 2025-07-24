import { SalesOrder, OrderItem, Customer, Product, User } from '../types';
import { db } from './database';

export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  scope: 'selected' | 'filtered' | 'all';
  includeItems: boolean;
  includeCustomerDetails: boolean;
  includeTimestamps: boolean;
  dateRange?: { from: string; to: string };
  columns?: string[];
}

export interface ExportPermissions {
  canExportAll: boolean;
  canExportCustomerDetails: boolean;
  canExportFinancialData: boolean;
  canExportUserData: boolean;
  maxHistoryMonths: number;
}

class OrderExportService {
  
  getExportPermissions(userRole: string): ExportPermissions {
    switch (userRole) {
      case 'Admin':
        return {
          canExportAll: true,
          canExportCustomerDetails: true,
          canExportFinancialData: true,
          canExportUserData: true,
          maxHistoryMonths: -1, // No limit
        };
      case 'Manager':
        return {
          canExportAll: true,
          canExportCustomerDetails: true,
          canExportFinancialData: true,
          canExportUserData: false,
          maxHistoryMonths: 24,
        };
      case 'Accounts':
        return {
          canExportAll: true,
          canExportCustomerDetails: true,
          canExportFinancialData: true,
          canExportUserData: false,
          maxHistoryMonths: 36,
        };
      case 'Sales':
        return {
          canExportAll: false,
          canExportCustomerDetails: false,
          canExportFinancialData: false,
          canExportUserData: false,
          maxHistoryMonths: 6,
        };
      case 'Inventory':
        return {
          canExportAll: true,
          canExportCustomerDetails: false,
          canExportFinancialData: false,
          canExportUserData: false,
          maxHistoryMonths: 12,
        };
      default:
        return {
          canExportAll: false,
          canExportCustomerDetails: false,
          canExportFinancialData: false,
          canExportUserData: false,
          maxHistoryMonths: 1,
        };
    }
  }

  filterOrdersByPermissions(
    orders: SalesOrder[], 
    user: User, 
    permissions: ExportPermissions
  ): SalesOrder[] {
    let filtered = [...orders];

    // Filter by user permissions
    if (!permissions.canExportAll && user.role === 'Sales') {
      filtered = filtered.filter(order => order.created_by === user.id);
    }

    // Filter by date range based on permissions
    if (permissions.maxHistoryMonths > 0) {
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - permissions.maxHistoryMonths);
      filtered = filtered.filter(order => new Date(order.created_at) >= cutoffDate);
    }

    return filtered;
  }

  prepareExportData(
    orders: SalesOrder[], 
    options: ExportOptions, 
    permissions: ExportPermissions
  ): any[] {
    const data: any[] = [];

    orders.forEach(order => {
      if (options.includeItems) {
        // One row per order item
        const orderItems = db.getOrderItems(order.id);
        orderItems.forEach(item => {
          const row = this.buildOrderItemRow(order, item, options, permissions);
          data.push(row);
        });
      } else {
        // One row per order
        const row = this.buildOrderSummaryRow(order, options, permissions);
        data.push(row);
      }
    });

    return data;
  }

  private buildOrderSummaryRow(
    order: SalesOrder, 
    options: ExportOptions, 
    permissions: ExportPermissions
  ): any {
    const row: any = {
      'Order ID': order.id,
      'Order Date': this.formatDate(order.created_at),
      'Customer Name': order.customer_name,
      'Customer Type': order.customer_type,
      'Status': order.status.toUpperCase(),
      'Total Amount (₦)': this.formatCurrency(order.total_amount),
    };

    if (permissions.canExportUserData) {
      row['Created By'] = order.created_by_name;
    }

    if (options.includeTimestamps) {
      if (order.approved_at) {
        row['Approved Date'] = this.formatDate(order.approved_at);
        if (permissions.canExportUserData) {
          row['Approved By'] = order.approved_by;
        }
      }
      if (order.dispatched_at) {
        row['Dispatched Date'] = this.formatDate(order.dispatched_at);
        if (permissions.canExportUserData) {
          row['Dispatched By'] = order.dispatched_by;
        }
      }
      if (order.delivered_at) {
        row['Delivered Date'] = this.formatDate(order.delivered_at);
      }
      if (order.cancelled_at) {
        row['Cancelled Date'] = this.formatDate(order.cancelled_at);
        if (permissions.canExportUserData) {
          row['Cancelled By'] = order.cancelled_by;
        }
        row['Cancellation Reason'] = order.cancellation_reason || '';
      }
    }

    if (options.includeCustomerDetails && permissions.canExportCustomerDetails) {
      const customer = db.getAllCustomers().find(c => c.id === order.customer_id);
      if (customer) {
        row['Customer Email'] = customer.email;
        row['Customer Phone'] = customer.phone;
        const defaultAddress = customer.addresses.find(a => a.is_default);
        if (defaultAddress) {
          row['Customer Address'] = `${defaultAddress.address}, ${defaultAddress.city}, ${defaultAddress.state}`;
        }
      }
    }

    if (order.tracking_number) {
      row['Tracking Number'] = order.tracking_number;
    }

    if (order.notes) {
      row['Notes'] = order.notes;
    }

    return row;
  }

  private buildOrderItemRow(
    order: SalesOrder, 
    item: OrderItem, 
    options: ExportOptions, 
    permissions: ExportPermissions
  ): any {
    const row: any = {
      'Order ID': order.id,
      'Order Date': this.formatDate(order.created_at),
      'Customer Name': order.customer_name,
      'Customer Type': order.customer_type,
      'Order Status': order.status.toUpperCase(),
      'Product Name': item.product_name,
      'Quantity': item.quantity,
      'Unit Price (₦)': this.formatCurrency(item.unit_price),
      'Line Total (₦)': this.formatCurrency(item.total_price),
      'Order Total (₦)': this.formatCurrency(order.total_amount),
    };

    // Add product SKU if available
    const product = db.getAllProducts().find(p => p.id === item.product_id);
    if (product) {
      row['Product SKU'] = product.sku;
    }

    if (permissions.canExportUserData) {
      row['Created By'] = order.created_by_name;
    }

    if (options.includeTimestamps) {
      if (order.approved_at) {
        row['Approved Date'] = this.formatDate(order.approved_at);
      }
      if (order.dispatched_at) {
        row['Dispatched Date'] = this.formatDate(order.dispatched_at);
      }
      if (order.delivered_at) {
        row['Delivered Date'] = this.formatDate(order.delivered_at);
      }
    }

    return row;
  }

  async exportToCSV(
    orders: SalesOrder[], 
    options: ExportOptions, 
    user: User
  ): Promise<Blob> {
    const permissions = this.getExportPermissions(user.role);
    const filteredOrders = this.filterOrdersByPermissions(orders, user, permissions);
    const data = this.prepareExportData(filteredOrders, options, permissions);

    if (data.length === 0) {
      throw new Error('No data to export');
    }

    // Get headers from first row
    const headers = Object.keys(data[0]);
    
    // Create CSV content
    const csvContent = [
      // Add metadata header
      `# Sales Order Export - Generated on ${new Date().toLocaleString()} by ${user.first_name} ${user.last_name}`,
      `# Total Records: ${data.length}`,
      `# Export Scope: ${options.scope}`,
      `# Include Items: ${options.includeItems}`,
      '',
      // Add column headers
      headers.join(','),
      // Add data rows
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        }).join(',')
      )
    ].join('\n');

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  }

  private formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private formatCurrency(amount: number): string {
    return amount.toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  generateFilename(options: ExportOptions, scope: string): string {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const scopeText = scope === 'selected' ? 'selected' : scope === 'filtered' ? 'filtered' : 'all';
    const itemText = options.includeItems ? 'detailed' : 'summary';
    return `orders-${scopeText}-${itemText}-${timestamp}.${options.format}`;
  }
}

export const exportService = new OrderExportService();
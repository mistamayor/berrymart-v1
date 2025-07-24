import React, { useState, useEffect } from "react";
import { SalesOrder, OrderItem, TransportVehicle, Customer, Product } from "../types";
import { db } from "../lib/database";
import { auth } from "../lib/auth";
import { OrderEditModal } from "./OrderEditModal";
import { OrderCancelModal } from "./OrderCancelModal";
import { BulkActionModal } from "./BulkActionModal";
import { ExportModal } from "./ExportModal";
import {
  ShoppingCart,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  User,
  Package,
  Calendar,
  DollarSign,
  Radio,
  FileText,
  Truck,
  Camera,
  MapPin,
  Search,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Edit3,
  Download,
} from "lucide-react";

interface OrderListProps {
  orders: SalesOrder[];
  onStatusChange: () => void;
  currentUser: { id: number; first_name: string; last_name: string; role: string };
}

export const OrderList: React.FC<OrderListProps> = ({
  orders,
  onStatusChange,
  currentUser,
}) => {
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [showPODModal, setShowPODModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<"approve" | "reject">(
    "approve"
  );
  const [rejectionReason, setRejectionReason] = useState("");
  const [dispatchedBy, setDispatchedBy] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [podImage, setPodImage] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | "all">("all");
  const [approvalComment, setApprovalComment] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(
    null
  );
  const [vehicles, setVehicles] = useState<TransportVehicle[]>([]);
  
  // Enhanced filtering state
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [customerFilter, setCustomerFilter] = useState<string>("all");
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");
  const [amountMinFilter, setAmountMinFilter] = useState("");
  const [amountMaxFilter, setAmountMaxFilter] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "amount" | "customer" | "status">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<SalesOrder | null>(null);
  const [editingOrderItems, setEditingOrderItems] = useState<OrderItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  // Cancel modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState<SalesOrder | null>(null);
  
  // Bulk operations state
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkActionInProgress, setBulkActionInProgress] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject' | 'cancel' | null>(null);
  
  // Export modal state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportScope, setExportScope] = useState<'selected' | 'filtered' | 'all'>('all');

  useEffect(() => {
    // Load customers and products
    setCustomers(db.getAllCustomers());
    setProducts(db.getAllProducts());
  }, []);

  useEffect(() => {
    if (showDispatchModal) {
      setDispatchedBy(`${currentUser.first_name} ${currentUser.last_name}`);
      setVehicles(
        db.getAllTransportVehicles().filter((v) => v.status === "active")
      );
      setSelectedVehicleId(null);
    }
  }, [showDispatchModal, currentUser]);

  // Enhanced filtered and sorted orders logic
  const filteredAndSortedOrders = React.useMemo(() => {
    let filtered = orders.filter((order) => {
      // Text search
      const matchesSearch =
        searchTerm === "" ||
        order.id.toString().includes(searchTerm) ||
        order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.created_by_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.tracking_number?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filter
      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;
      
      // Customer filter
      const matchesCustomer =
        customerFilter === "all" || order.customer_id.toString() === customerFilter;
      
      // Date range filter
      const orderDate = new Date(order.created_at);
      const matchesDateFrom = !dateFromFilter || orderDate >= new Date(dateFromFilter);
      const matchesDateTo = !dateToFilter || orderDate <= new Date(dateToFilter + "T23:59:59");
      
      // Amount range filter
      const matchesAmountMin = !amountMinFilter || order.total_amount >= parseFloat(amountMinFilter);
      const matchesAmountMax = !amountMaxFilter || order.total_amount <= parseFloat(amountMaxFilter);
      
      return matchesSearch && matchesStatus && matchesCustomer && 
             matchesDateFrom && matchesDateTo && matchesAmountMin && matchesAmountMax;
    });

    // Sort orders
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case "date":
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case "amount":
          comparison = a.total_amount - b.total_amount;
          break;
        case "customer":
          comparison = a.customer_name.localeCompare(b.customer_name);
          break;
        case "status":
          const statusOrder = { pending: 1, approved: 2, dispatched: 3, delivered: 4, rejected: 5 };
          comparison = (statusOrder[a.status as keyof typeof statusOrder] || 6) - 
                      (statusOrder[b.status as keyof typeof statusOrder] || 6);
          break;
      }
      
      return sortOrder === "desc" ? -comparison : comparison;
    });

    return filtered;
  }, [orders, searchTerm, statusFilter, customerFilter, dateFromFilter, dateToFilter, 
      amountMinFilter, amountMaxFilter, sortBy, sortOrder]);

  // Helper functions
  const clearAllFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setCustomerFilter("all");
    setDateFromFilter("");
    setDateToFilter("");
    setAmountMinFilter("");
    setAmountMaxFilter("");
  };

  const toggleSortOrder = (newSortBy: typeof sortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSortBy);
      setSortOrder("desc");
    }
  };

  const hasActiveFilters = searchTerm || statusFilter !== "all" || customerFilter !== "all" ||
                          dateFromFilter || dateToFilter || amountMinFilter || amountMaxFilter;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "approved":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "dispatched":
        return <Truck className="w-4 h-4 text-blue-500" />;
      case "delivered":
        return <MapPin className="w-4 h-4 text-purple-500" />;
      case "cancelled":
        return <XCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "dispatched":
        return "bg-blue-100 text-blue-800";
      case "delivered":
        return "bg-purple-100 text-purple-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSalesChannelIcon = (channel: string) => {
    switch (channel) {
      case "online":
        return "🌐";
      case "in_store":
        return "🏪";
      case "phone":
        return "📞";
      case "field_sales":
        return "🚗";
      default:
        return "📦";
    }
  };

  const viewOrderDetails = (order: SalesOrder) => {
    setSelectedOrder(order);
    setOrderItems(db.getOrderItems(order.id));
  };

  const initiateApproval = (
    order: SalesOrder,
    action: "approve" | "reject"
  ) => {
    setSelectedOrder(order);
    setApprovalAction(action);
    setShowApprovalModal(true);
  };

  const initiateDispatch = (order: SalesOrder) => {
    setSelectedOrder(order);
    setShowDispatchModal(true);
  };

  const initiatePOD = (order: SalesOrder) => {
    setSelectedOrder(order);
    setShowPODModal(true);
  };

  const initiateEdit = (order: SalesOrder) => {
    setEditingOrder(order);
    setEditingOrderItems(db.getOrderItems(order.id));
    setShowEditModal(true);
  };

  const handleOrderUpdated = (updatedOrder: SalesOrder) => {
    setShowEditModal(false);
    setEditingOrder(null);
    setEditingOrderItems([]);
    onStatusChange(); // Refresh the order list
  };

  const initiateCancel = (order: SalesOrder) => {
    setCancellingOrder(order);
    setShowCancelModal(true);
  };

  const handleOrderCancelled = (cancelledOrder: SalesOrder) => {
    setShowCancelModal(false);
    setCancellingOrder(null);
    onStatusChange(); // Refresh the order list
  };

  // Bulk operation functions
  const toggleOrderSelection = (orderId: number) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectAll = () => {
    const allOrderIds = filteredAndSortedOrders.map(order => order.id);
    setSelectedOrders(
      selectedOrders.length === allOrderIds.length ? [] : allOrderIds
    );
  };

  const clearSelection = () => {
    setSelectedOrders([]);
  };

  const getSelectedOrders = () => {
    return filteredAndSortedOrders.filter(order => selectedOrders.includes(order.id));
  };

  const canPerformBulkAction = (action: string) => {
    const selected = getSelectedOrders();
    if (selected.length === 0) return false;

    switch (action) {
      case 'approve':
        return auth.hasPermission(["Admin", "Manager"]) && 
               selected.every(order => order.status === 'pending');
      case 'reject':
        return auth.hasPermission(["Admin", "Manager"]) && 
               selected.every(order => order.status === 'pending');
      case 'dispatch':
        return auth.hasPermission(["Admin", "Manager", "Inventory"]) && 
               selected.every(order => order.status === 'approved');
      case 'cancel':
        return selected.every(order => 
          db.canCancelOrder(order.id, currentUser.role, currentUser.id)
        );
      default:
        return false;
    }
  };

  const initiateBulkAction = (action: 'approve' | 'reject' | 'cancel') => {
    setBulkAction(action);
    setShowBulkModal(true);
  };

  const handleBulkActionComplete = (result: { successful: number[]; failed: Array<{orderId: number; reason: string}>; totalProcessed: number }) => {
    setShowBulkModal(false);
    setBulkAction(null);
    setSelectedOrders([]);
    
    // Show result notification
    const { successful, failed, totalProcessed } = result;
    if (failed.length === 0) {
      // All successful
      console.log(`Successfully processed ${successful.length} orders`);
    } else if (successful.length === 0) {
      // All failed
      console.error(`Failed to process all ${totalProcessed} orders`);
    } else {
      // Partial success
      console.warn(`Processed ${successful.length}/${totalProcessed} orders. ${failed.length} failed.`);
    }
    
    onStatusChange(); // Refresh the order list
  };

  // Export functions
  const initiateExport = (scope: 'selected' | 'filtered' | 'all') => {
    setExportScope(scope);
    setShowExportModal(true);
  };

  const getExportOrders = () => {
    switch (exportScope) {
      case 'selected':
        return getSelectedOrders();
      case 'filtered':
        return filteredAndSortedOrders;
      case 'all':
        return orders;
      default:
        return filteredAndSortedOrders;
    }
  };
  const handleApproval = () => {
    if (!selectedOrder) return;
    try {
      if (approvalAction === "approve") {
        const approverName = `${currentUser.first_name} ${currentUser.last_name}`;
        db.approveOrder(selectedOrder.id, approverName, approvalComment);
      } else {
        if (!rejectionReason.trim()) {
          alert("Please enter rejection reason");
          return;
        }
        db.rejectOrder(selectedOrder.id, rejectionReason);
      }
      setShowApprovalModal(false);
      setSelectedOrder(null);
      setApprovalComment("");
      setRejectionReason("");
      onStatusChange();
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  const handleDispatch = () => {
    if (!selectedOrder) return;
    if (!dispatchedBy.trim() || !trackingNumber.trim() || !selectedVehicleId) {
      alert("Please fill in all dispatch details and select a vehicle");
      return;
    }
    try {
      db.dispatchOrder(
        selectedOrder.id,
        dispatchedBy,
        trackingNumber,
        selectedVehicleId
      );
      setShowDispatchModal(false);
      setSelectedOrder(null);
      setDispatchedBy("");
      setTrackingNumber("");
      setSelectedVehicleId(null);
      onStatusChange();
    } catch (error) {
      console.error("Error dispatching order:", error);
    }
  };

  const handlePOD = () => {
    if (!selectedOrder) return;

    if (!podImage.trim()) {
      alert("Please provide POD image URL");
      return;
    }

    try {
      db.markDelivered(selectedOrder.id, podImage, deliveryNotes);
      setShowPODModal(false);
      setSelectedOrder(null);
      setPodImage("");
      setDeliveryNotes("");
      onStatusChange();
    } catch (error) {
      console.error("Error marking order as delivered:", error);
    }
  };
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No orders yet
        </h3>
        <p className="text-gray-500">Create your first order to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Sales Orders</h2>
            <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
              <span className="flex items-center">
                <Clock className="w-4 h-4 mr-1 text-yellow-500" />
                Pending: {orders.filter((o) => o.status === "pending").length}
              </span>
              <span className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
                Approved: {orders.filter((o) => o.status === "approved").length}
              </span>
              <span className="flex items-center">
                <Truck className="w-4 h-4 mr-1 text-blue-500" />
                Dispatched: {orders.filter((o) => o.status === "dispatched").length}
              </span>
              <span className="flex items-center">
                <MapPin className="w-4 h-4 mr-1 text-purple-500" />
                Delivered: {orders.filter((o) => o.status === "delivered").length}
              </span>
              <span className="flex items-center">
                <XCircle className="w-4 h-4 mr-1 text-red-500" />
                Rejected: {orders.filter((o) => o.status === "rejected").length}
              </span>
              <span className="flex items-center">
                <XCircle className="w-4 h-4 mr-1 text-gray-500" />
                Cancelled: {orders.filter((o) => o.status === "cancelled").length}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Main Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                placeholder="Search orders, customers..."
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Advanced Filter Toggle */}
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`p-2 rounded-lg border transition-colors ${
                showAdvancedFilters || hasActiveFilters
                  ? "bg-blue-50 border-blue-200 text-blue-600"
                  : "bg-white border-gray-300 text-gray-600 hover:text-gray-900"
              }`}
              title="Advanced Filters"
            >
              <Filter className="w-4 h-4" />
            </button>

            {/* Export Button */}
            <button
              onClick={() => initiateExport(hasActiveFilters ? 'filtered' : 'all')}
              className="flex items-center px-3 py-2 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
              title={hasActiveFilters ? "Export Filtered Orders" : "Export All Orders"}
            >
              <Download className="w-4 h-4 mr-1" />
              Export {hasActiveFilters ? 'Filtered' : 'All'}
            </button>

            {/* Sort Controls */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Sort:</span>
              <button
                onClick={() => toggleSortOrder("date")}
                className={`flex items-center px-2 py-1 text-xs rounded transition-colors ${
                  sortBy === "date" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Date {sortBy === "date" && (sortOrder === "desc" ? <ChevronDown className="w-3 h-3 ml-1" /> : <ChevronUp className="w-3 h-3 ml-1" />)}
              </button>
              <button
                onClick={() => toggleSortOrder("amount")}
                className={`flex items-center px-2 py-1 text-xs rounded transition-colors ${
                  sortBy === "amount" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Amount {sortBy === "amount" && (sortOrder === "desc" ? <ChevronDown className="w-3 h-3 ml-1" /> : <ChevronUp className="w-3 h-3 ml-1" />)}
              </button>
              <button
                onClick={() => toggleSortOrder("customer")}
                className={`flex items-center px-2 py-1 text-xs rounded transition-colors ${
                  sortBy === "customer" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Customer {sortBy === "customer" && (sortOrder === "desc" ? <ChevronDown className="w-3 h-3 ml-1" /> : <ChevronUp className="w-3 h-3 ml-1" />)}
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showAdvancedFilters && (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="dispatched">Dispatched</option>
                  <option value="delivered">Delivered</option>
                  <option value="rejected">Rejected</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Customer Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                <select
                  value={customerFilter}
                  onChange={(e) => setCustomerFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Customers</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id.toString()}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date From */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                <input
                  type="date"
                  value={dateFromFilter}
                  onChange={(e) => setDateFromFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Date To */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                <input
                  type="date"
                  value={dateToFilter}
                  onChange={(e) => setDateToFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Amount Min */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Amount (₦)</label>
                <input
                  type="number"
                  value={amountMinFilter}
                  onChange={(e) => setAmountMinFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>

              {/* Amount Max */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Amount (₦)</label>
                <input
                  type="number"
                  value={amountMaxFilter}
                  onChange={(e) => setAmountMaxFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="No limit"
                />
              </div>
            </div>

            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-gray-600">
                Showing {filteredAndSortedOrders.length} of {orders.length} orders
              </div>
              <button
                onClick={clearAllFilters}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        )}

        {/* Filter Summary */}
        {hasActiveFilters && !showAdvancedFilters && (
          <div className="text-sm text-gray-600">
            Showing {filteredAndSortedOrders.length} of {orders.length} orders
            <button
              onClick={clearAllFilters}
              className="ml-2 text-blue-600 hover:text-blue-800 underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Bulk Selection and Actions */}
      {filteredAndSortedOrders.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-4">
            <input
              type="checkbox"
              checked={selectedOrders.length > 0 && selectedOrders.length === filteredAndSortedOrders.length}
              ref={(input) => {
                if (input) {
                  input.indeterminate = selectedOrders.length > 0 && selectedOrders.length < filteredAndSortedOrders.length;
                }
              }}
              onChange={handleSelectAll}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              {selectedOrders.length > 0 
                ? `${selectedOrders.length} of ${filteredAndSortedOrders.length} selected`
                : `Select orders for bulk actions`
              }
            </span>
          </div>
          
          {selectedOrders.length > 0 && (
            <div className="flex items-center space-x-2">
              {canPerformBulkAction('approve') && (
                <button
                  onClick={() => initiateBulkAction('approve')}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  disabled={bulkActionInProgress}
                >
                  Approve Selected
                </button>
              )}
              {canPerformBulkAction('reject') && (
                <button
                  onClick={() => initiateBulkAction('reject')}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  disabled={bulkActionInProgress}
                >
                  Reject Selected
                </button>
              )}
              {canPerformBulkAction('cancel') && (
                <button
                  onClick={() => initiateBulkAction('cancel')}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  disabled={bulkActionInProgress}
                >
                  Cancel Selected
                </button>
              )}
              <button
                onClick={() => initiateExport('selected')}
                className="px-3 py-1 text-sm text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors"
                disabled={bulkActionInProgress}
                title="Export Selected Orders"
              >
                <Download className="w-3 h-3 mr-1" />
                Export
              </button>
              <button
                onClick={clearSelection}
                className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                disabled={bulkActionInProgress}
                title="Clear Selection"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-4">
        {filteredAndSortedOrders.length === 0 && hasActiveFilters ? (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No orders found
            </h3>
            <p className="text-gray-500 mb-4">
              No orders match your current filters.
            </p>
            <button
              onClick={clearAllFilters}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          filteredAndSortedOrders.map((order) => (
          <div
            key={order.id}
            className={`bg-white p-6 pl-12 rounded-lg shadow-sm border transition-colors relative ${
              selectedOrders.includes(order.id) 
                ? 'border-blue-300 bg-blue-50' 
                : 'border-gray-200 cursor-pointer hover:bg-blue-50'
            }`}
            onClick={(e) => {
              // Don't trigger order details if clicking on checkbox area
              if (!(e.target as HTMLElement).closest('.order-checkbox')) {
                viewOrderDetails(order);
              }
            }}
          >
            {/* Selection Checkbox */}
            <div className="absolute top-3 left-3 order-checkbox">
              <input
                type="checkbox"
                checked={selectedOrders.includes(order.id)}
                onChange={(e) => {
                  e.stopPropagation();
                  toggleOrderSelection(order.id);
                }}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                  <span className="font-bold text-gray-900">
                    Order #{order.id}
                  </span>
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                    order.status
                  )}`}
                >
                  {getStatusIcon(order.status)}
                  <span className="ml-1">{order.status}</span>
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {/* Edit Button */}
                {db.canEditOrder(order.id, currentUser.role) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      initiateEdit(order);
                    }}
                    className="px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors flex items-center"
                    title="Edit Order"
                  >
                    <Edit3 className="w-3 h-3 mr-1" />
                    Edit
                  </button>
                )}
                {/* Cancel Button */}
                {db.canCancelOrder(order.id, currentUser.role, currentUser.id) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      initiateCancel(order);
                    }}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center"
                    title="Cancel Order"
                  >
                    <XCircle className="w-3 h-3 mr-1" />
                    Cancel
                  </button>
                )}
                {order.status === "pending" &&
                  auth.hasPermission(["Admin", "Manager"]) && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          initiateApproval(order, "approve");
                        }}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          initiateApproval(order, "reject");
                        }}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                      >
                        Reject
                      </button>
                    </>
                  )}
                {order.status === "approved" &&
                  auth.hasPermission(["Admin", "Manager", "Inventory"]) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        initiateDispatch(order);
                      }}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Dispatch
                    </button>
                  )}
                {order.status === "dispatched" &&
                  auth.hasPermission(["Admin", "Manager", "Inventory"]) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        initiatePOD(order);
                      }}
                      className="px-3 py-1 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                    >
                      Mark Delivered
                    </button>
                  )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">
                    {order.customer_name}
                  </p>
                  <p className="text-gray-600 capitalize">
                    {order.customer_type}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">
                    {order.created_by_name}
                  </p>
                  <p className="text-gray-600">Created By</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">
                    ₦
                    {order.total_amount.toLocaleString("en-NG", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-gray-600">Total Amount</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">
                    {formatDate(order.created_at)}
                  </p>
                  <p className="text-gray-600">Created</p>
                </div>
              </div>
            </div>

            {order.notes && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <FileText className="w-4 h-4 inline mr-1" />
                  {order.notes}
                </p>
              </div>
            )}

            {order.approved_by && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800">
                  <CheckCircle className="w-4 h-4 inline mr-1" />
                  Approved by {order.approved_by} on{" "}
                  {formatDate(order.approved_at!)}
                </p>
              </div>
            )}

            {order.dispatched_by && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <Truck className="w-4 h-4 inline mr-1" />
                  Dispatched by {order.dispatched_by} on{" "}
                  {formatDate(order.dispatched_at!)}
                  {order.tracking_number && (
                    <span className="block mt-1">
                      Tracking:{" "}
                      <span className="font-mono">{order.tracking_number}</span>
                    </span>
                  )}
                </p>
              </div>
            )}

            {order.delivered_at && (
              <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                <p className="text-sm text-purple-800">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Delivered on {formatDate(order.delivered_at)}
                  {order.delivery_notes && (
                    <span className="block mt-1">{order.delivery_notes}</span>
                  )}
                </p>
              </div>
            )}

            {order.cancelled_at && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-800">
                  <XCircle className="w-4 h-4 inline mr-1" />
                  Cancelled by {order.cancelled_by} on{" "}
                  {formatDate(order.cancelled_at)}
                  {order.cancellation_reason && (
                    <span className="block mt-1 font-medium">
                      Reason: {order.cancellation_reason}
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>
          ))
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && !showApprovalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  Order Details
                </h3>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Order Info Table */}
              <table className="w-full mb-6 border border-gray-200 rounded-lg overflow-hidden">
                <tbody>
                  <tr className="bg-gray-50">
                    <th className="text-left px-4 py-2 w-1/3 font-medium text-gray-700 border-b border-gray-200">
                      Order ID
                    </th>
                    <td className="px-4 py-2 border-b border-gray-200">
                      #{selectedOrder.id}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-left px-4 py-2 font-medium text-gray-700 border-b border-gray-200">
                      Status
                    </th>
                    <td className="px-4 py-2 border-b border-gray-200">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          selectedOrder.status
                        )}`}
                      >
                        {getStatusIcon(selectedOrder.status)}
                        <span className="ml-1">{selectedOrder.status}</span>
                      </span>
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <th className="text-left px-4 py-2 font-medium text-gray-700 border-b border-gray-200">
                      Customer
                    </th>
                    <td className="px-4 py-2 border-b border-gray-200">
                      {selectedOrder.customer_name}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-left px-4 py-2 font-medium text-gray-700 border-b border-gray-200">
                      Customer Type
                    </th>
                    <td className="px-4 py-2 border-b border-gray-200 capitalize">
                      {selectedOrder.customer_type}
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <th className="text-left px-4 py-2 font-medium text-gray-700 border-b border-gray-200">
                      Created By
                    </th>
                    <td className="px-4 py-2 border-b border-gray-200">
                      {selectedOrder.created_by_name}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-left px-4 py-2 font-medium text-gray-700 border-b border-gray-200">
                      Created
                    </th>
                    <td className="px-4 py-2 border-b border-gray-200">
                      {formatDate(selectedOrder.created_at)}
                    </td>
                  </tr>
                  {selectedOrder.tracking_number && (
                    <tr className="bg-gray-50">
                      <th className="text-left px-4 py-2 font-medium text-gray-700 border-b border-gray-200">
                        Tracking Number
                      </th>
                      <td className="px-4 py-2 border-b border-gray-200 font-mono">
                        {selectedOrder.tracking_number}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Order Items Table */}
              <h4 className="font-semibold text-gray-900 mb-2">Order Items</h4>
              <div className="overflow-x-auto mb-6">
                <table className="min-w-full border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Product
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                        Unit Price
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                        Quantity
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderItems.map((item) => (
                      <tr
                        key={item.id}
                        className="border-t"
                      >
                        <td className="px-4 py-2 font-medium text-gray-900">
                          {item.product_name}
                        </td>
                        <td className="px-4 py-2 text-right">
                          ₦
                          {item.unit_price.toLocaleString("en-NG", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-2 text-right font-semibold">
                          ₦
                          {item.total_price.toLocaleString("en-NG", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end items-center text-lg font-bold mb-6">
                <span className="mr-2">Total Amount:</span>
                <span className="text-blue-600">
                  ₦
                  {selectedOrder.total_amount.toLocaleString("en-NG", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>

              {/* Status Sections */}
              {selectedOrder.notes && (
                <div className="mb-4">
                  <h5 className="font-semibold text-gray-800 mb-1">Notes</h5>
                  <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
                    {selectedOrder.notes}
                  </div>
                </div>
              )}
              {selectedOrder.approved_by && (
                <div className="mb-4">
                  <h5 className="font-semibold text-green-700 mb-1">
                    Approval
                  </h5>
                  <div className="text-sm text-green-800 bg-green-50 rounded-lg p-3">
                    Approved by {selectedOrder.approved_by} on{" "}
                    {formatDate(selectedOrder.approved_at!)}
                  </div>
                </div>
              )}
              {selectedOrder.dispatched_by && (
                <div className="mb-4">
                  <h5 className="font-semibold text-blue-700 mb-1">Dispatch</h5>
                  <div className="text-sm text-blue-800 bg-blue-50 rounded-lg p-3">
                    Dispatched by {selectedOrder.dispatched_by} on{" "}
                    {formatDate(selectedOrder.dispatched_at!)}
                    {selectedOrder.tracking_number && (
                      <span className="block mt-1">
                        Tracking:{" "}
                        <span className="font-mono">
                          {selectedOrder.tracking_number}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              )}
              {selectedOrder.delivered_at && (
                <div className="mb-4">
                  <h5 className="font-semibold text-purple-700 mb-1">
                    Delivery
                  </h5>
                  <div className="text-sm text-purple-800 bg-purple-50 rounded-lg p-3">
                    Delivered on {formatDate(selectedOrder.delivered_at)}
                    {selectedOrder.delivery_notes && (
                      <span className="block mt-1">
                        {selectedOrder.delivery_notes}
                      </span>
                    )}
                  </div>
                </div>
              )}
              {selectedOrder.pod_image && (
                <div className="mb-4">
                  <h5 className="font-semibold text-gray-800 mb-1">
                    Proof of Delivery
                  </h5>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <img
                      src={selectedOrder.pod_image}
                      alt="Proof of Delivery"
                      className="max-w-full h-auto rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                        (
                          e.target as HTMLImageElement
                        ).nextElementSibling!.textContent =
                          "POD Image: " + selectedOrder.pod_image;
                      }}
                    />
                    <p className="text-sm text-gray-600 mt-2 hidden"></p>
                  </div>
                </div>
              )}
              {/* Approve/Reject Buttons for Pending Orders */}
              {selectedOrder.status === "pending" &&
                auth.hasPermission(["Admin", "Manager"]) && (
                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={() => initiateApproval(selectedOrder, "approve")}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => initiateApproval(selectedOrder, "reject")}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                )}
              {/* Dispatch Button for Approved Orders */}
              {selectedOrder.status === "approved" &&
                auth.hasPermission(["Admin", "Manager", "Inventory"]) && (
                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={() => initiateDispatch(selectedOrder)}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Dispatch
                    </button>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* Dispatch Modal */}
      {showDispatchModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  <Truck className="w-5 h-5 mr-2 text-blue-600" />
                  Dispatch Order
                </h3>
                <button
                  onClick={() => setShowDispatchModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Order #{selectedOrder.id}
                  </p>
                  <p className="font-medium text-gray-900">
                    {selectedOrder.customer_name}
                  </p>
                  <p className="text-sm text-gray-600">
                    ₦
                    {selectedOrder.total_amount.toLocaleString("en-NG", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dispatched By *
                  </label>
                  <input
                    type="text"
                    value={dispatchedBy}
                    disabled
                    className="w-full px-3 py-2 border border-gray-200 bg-gray-100 rounded-lg text-gray-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tracking Number *
                  </label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter tracking number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Van/Truck *
                  </label>
                  <select
                    value={selectedVehicleId ?? ""}
                    onChange={(e) =>
                      setSelectedVehicleId(Number(e.target.value))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option
                      value=""
                      disabled
                    >
                      Select a vehicle
                    </option>
                    {vehicles.map((vehicle) => (
                      <option
                        key={vehicle.id}
                        value={vehicle.id}
                      >
                        {vehicle.name} ({vehicle.type}, {vehicle.license_plate})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowDispatchModal(false)}
                    className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDispatch}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Dispatch Order
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POD Modal */}
      {showPODModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  <Camera className="w-5 h-5 mr-2 text-purple-600" />
                  Mark as Delivered
                </h3>
                <button
                  onClick={() => setShowPODModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Order #{selectedOrder.id}
                  </p>
                  <p className="font-medium text-gray-900">
                    {selectedOrder.customer_name}
                  </p>
                  <p className="text-sm text-gray-600">
                    Tracking:{" "}
                    <span className="font-mono">
                      {selectedOrder.tracking_number}
                    </span>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Proof of Delivery Image URL *
                  </label>
                  <input
                    type="url"
                    value={podImage}
                    onChange={(e) => setPodImage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="https://example.com/pod-image.jpg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Upload image to a service like Imgur and paste the URL here
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Notes (Optional)
                  </label>
                  <textarea
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Any additional delivery notes..."
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowPODModal(false)}
                    className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePOD}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Mark Delivered
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Approval Modal */}
      {showApprovalModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  {approvalAction === "approve"
                    ? "Approve Order"
                    : "Reject Order"}
                </h3>
                <button
                  onClick={() => setShowApprovalModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Approver
                  </label>
                  <div className="text-gray-900 font-semibold bg-gray-50 rounded px-3 py-2">
                    {currentUser.first_name} {currentUser.last_name}
                  </div>
                </div>
                {approvalAction === "approve" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Comments (optional)
                    </label>
                    <textarea
                      className="border border-gray-300 rounded-md px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      value={approvalComment}
                      onChange={(e) => setApprovalComment(e.target.value)}
                      placeholder="Add comments (optional)"
                    />
                  </div>
                )}
                {approvalAction === "reject" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rejection Reason *
                    </label>
                    <textarea
                      className="border border-gray-300 rounded-md px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Enter reason for rejection"
                      required
                    />
                  </div>
                )}
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => setShowApprovalModal(false)}
                    className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApproval}
                    className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                  >
                    {approvalAction === "approve" ? "Approve" : "Reject"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Edit Modal */}
      {showEditModal && editingOrder && (
        <OrderEditModal
          order={editingOrder}
          orderItems={editingOrderItems}
          customers={customers}
          products={products}
          onOrderUpdated={handleOrderUpdated}
          onClose={() => {
            setShowEditModal(false);
            setEditingOrder(null);
            setEditingOrderItems([]);
          }}
          currentUser={currentUser}
        />
      )}

      {/* Order Cancel Modal */}
      {showCancelModal && cancellingOrder && (
        <OrderCancelModal
          order={cancellingOrder}
          onOrderCancelled={handleOrderCancelled}
          onClose={() => {
            setShowCancelModal(false);
            setCancellingOrder(null);
          }}
          currentUser={currentUser}
        />
      )}

      {/* Bulk Action Modal */}
      {showBulkModal && bulkAction && (
        <BulkActionModal
          action={bulkAction}
          orders={getSelectedOrders()}
          onComplete={handleBulkActionComplete}
          onClose={() => {
            setShowBulkModal(false);
            setBulkAction(null);
          }}
          currentUser={currentUser}
        />
      )}

      {/* Export Modal */}
      {showExportModal && (
        <ExportModal
          orders={getExportOrders()}
          scope={exportScope}
          onClose={() => setShowExportModal(false)}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

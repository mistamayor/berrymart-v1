import React, { useState, useEffect } from "react";
import { SalesOrder, OrderItem, TransportVehicle, Customer, Product } from "../types";
import { supabaseDb } from "../lib/supabaseDatabase";
import { supabaseAuth } from "../lib/supabaseAuth";
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
  ChevronLeft,
  ChevronRight,
  Edit3,
  Download,
  Upload,
  ImageIcon,
} from "lucide-react";

interface OrderListProps {
  orders: SalesOrder[];
  onStatusChange: () => void;
  onViewOrderDetails: (orderId: number) => void;
  currentUser: { id: number; first_name: string; last_name: string; role: string };
}

export const OrderList: React.FC<OrderListProps> = ({
  orders,
  onStatusChange,
  onViewOrderDetails,
  currentUser,
}) => {
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
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
  const [podImageFile, setPodImageFile] = useState<File | null>(null);
  const [podImagePreview, setPodImagePreview] = useState<string | null>(null);
  const [isCapturingPhoto, setIsCapturingPhoto] = useState(false);
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
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(20);

  useEffect(() => {
    // Load customers and products
    const loadData = async () => {
      try {
        const [customersData, productsData] = await Promise.all([
          supabaseDb.getAllCustomers(),
          supabaseDb.getAllProducts()
        ]);
        setCustomers(customersData);
        setProducts(productsData);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (showDispatchModal) {
      setDispatchedBy(`${currentUser.first_name} ${currentUser.last_name}`);
      const loadVehicles = async () => {
        try {
          const vehiclesData = await supabaseDb.getAllVehicles();
          setVehicles(vehiclesData.filter((v) => v.status === "active"));
        } catch (error) {
          console.error('Error loading vehicles:', error);
        }
      };
      loadVehicles();
      setSelectedVehicleId(null);
    }
  }, [showDispatchModal, currentUser]);

  // Enhanced filtered and sorted orders logic
  const filteredAndSortedOrders = React.useMemo(() => {
    const filtered = orders.filter((order) => {
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

  // Pagination logic
  const totalPages = Math.ceil(filteredAndSortedOrders.length / ordersPerPage);
  const startIndex = (currentPage - 1) * ordersPerPage;
  const endIndex = startIndex + ordersPerPage;
  const paginatedOrders = filteredAndSortedOrders.slice(startIndex, endIndex);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, customerFilter, dateFromFilter, dateToFilter, 
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
    onViewOrderDetails(order.id);
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

  const initiateEdit = async (order: SalesOrder) => {
    setEditingOrder(order);
    const items = await supabaseDb.getOrderItems(order.id);
    setEditingOrderItems(items);
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
        return supabaseAuth.hasPermission(["Admin", "Manager"]) && 
               selected.every(order => order.status === 'pending');
      case 'reject':
        return supabaseAuth.hasPermission(["Admin", "Manager"]) && 
               selected.every(order => order.status === 'pending');
      case 'dispatch':
        return supabaseAuth.hasPermission(["Admin", "Manager", "Inventory"]) && 
               selected.every(order => order.status === 'approved');
      case 'cancel':
        return selected.every(order => 
          supabaseAuth.canCancelOrder(order)
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
  const handleApproval = async () => {
    if (!selectedOrder) return;
    try {
      if (approvalAction === "approve") {
        const approverName = `${currentUser.first_name} ${currentUser.last_name}`;
        await supabaseDb.approveOrder(selectedOrder.id, approverName);
      } else {
        if (!rejectionReason.trim()) {
          alert("Please enter rejection reason");
          return;
        }
        await supabaseDb.cancelOrder(selectedOrder.id, `${currentUser.first_name} ${currentUser.last_name}`, rejectionReason);
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

  const handleDispatch = async () => {
    if (!selectedOrder) return;
    if (!dispatchedBy.trim() || !trackingNumber.trim() || !selectedVehicleId) {
      alert("Please fill in all dispatch details and select a vehicle");
      return;
    }
    try {
      await supabaseDb.updateOrder(selectedOrder.id, {
        status: 'dispatched',
        dispatched_by: dispatchedBy,
        dispatched_at: new Date().toISOString(),
        tracking_number: trackingNumber
      });
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPodImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPodImagePreview(result);
        setPodImage(result); // For now, use the data URL
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Use back camera if available
      });
      setIsCapturingPhoto(true);
      
      // Create a video element to show camera feed
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
      
      // Create a modal overlay for camera
      const overlay = document.createElement('div');
      overlay.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60]';
      
      const container = document.createElement('div');
      container.className = 'bg-white p-4 rounded-lg max-w-md w-full mx-4';
      
      const videoContainer = document.createElement('div');
      videoContainer.className = 'relative mb-4';
      video.className = 'w-full rounded-lg';
      videoContainer.appendChild(video);
      
      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'flex space-x-3';
      
      const captureBtn = document.createElement('button');
      captureBtn.textContent = 'Capture Photo';
      captureBtn.className = 'flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700';
      
      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = 'Cancel';
      cancelBtn.className = 'flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50';
      
      const cleanup = () => {
        stream.getTracks().forEach(track => track.stop());
        document.body.removeChild(overlay);
        setIsCapturingPhoto(false);
      };
      
      captureBtn.onclick = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'pod-photo.jpg', { type: 'image/jpeg' });
            setPodImageFile(file);
            
            const reader = new FileReader();
            reader.onload = (e) => {
              const result = e.target?.result as string;
              setPodImagePreview(result);
              setPodImage(result);
            };
            reader.readAsDataURL(file);
          }
        }, 'image/jpeg', 0.8);
        
        cleanup();
      };
      
      cancelBtn.onclick = cleanup;
      
      buttonContainer.appendChild(cancelBtn);
      buttonContainer.appendChild(captureBtn);
      container.appendChild(videoContainer);
      container.appendChild(buttonContainer);
      overlay.appendChild(container);
      document.body.appendChild(overlay);
      
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please use file upload instead.');
    }
  };

  const handlePOD = async () => {
    if (!selectedOrder) return;

    if (!podImagePreview && !podImage.trim()) {
      alert("Please provide a proof of delivery image");
      return;
    }

    try {
      // Use the preview image (data URL) as the POD image
      const podImageData = podImagePreview || podImage;
      
      await supabaseDb.updateOrder(selectedOrder.id, {
        status: 'delivered',
        delivered_at: new Date().toISOString(),
        pod_image: podImageData,
        delivery_notes: deliveryNotes.trim() || undefined
      });
      setShowPODModal(false);
      setSelectedOrder(null);
      setPodImage("");
      setPodImageFile(null);
      setPodImagePreview(null);
      setDeliveryNotes("");
      onStatusChange();
    } catch (error) {
      console.error("Error marking order as delivered:", error);
      alert("Failed to mark order as delivered. Please try again.");
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
      {/* Simplified Header */}
      <div className="flex flex-col gap-4">
        {/* Top Row: Title and Primary Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold text-gray-900">Orders</h2>
            <span className="text-sm text-gray-500">
              {filteredAndSortedOrders.length} of {orders.length} orders
              {totalPages > 1 && (
                <span className="ml-2 text-xs">
                  (Page {currentPage} of {totalPages})
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
                placeholder="Search orders..."
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

            {/* Quick Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="dispatched">Dispatched</option>
              <option value="delivered">Delivered</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {/* More Filters Button */}
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center px-3 py-2 text-sm rounded-lg border transition-colors ${
                showAdvancedFilters || hasActiveFilters
                  ? "bg-blue-50 border-blue-200 text-blue-600"
                  : "border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Filter className="w-4 h-4 mr-1" />
              Filters
              {hasActiveFilters && <span className="ml-1 text-xs bg-blue-100 text-blue-600 px-1 rounded">•</span>}
            </button>

            {/* Export */}
            <button
              onClick={() => initiateExport(hasActiveFilters ? 'filtered' : 'all')}
              className="flex items-center px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4 mr-1" />
              Export
            </button>
          </div>
        </div>

        {/* Status Summary Cards - Compact */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
          {[
            { status: 'pending', label: 'Pending', icon: Clock, activeClass: 'bg-yellow-50 border-yellow-200 text-yellow-700', iconClass: 'text-yellow-600' },
            { status: 'approved', label: 'Approved', icon: CheckCircle, activeClass: 'bg-green-50 border-green-200 text-green-700', iconClass: 'text-green-600' },
            { status: 'dispatched', label: 'Dispatched', icon: Truck, activeClass: 'bg-blue-50 border-blue-200 text-blue-700', iconClass: 'text-blue-600' },
            { status: 'delivered', label: 'Delivered', icon: MapPin, activeClass: 'bg-purple-50 border-purple-200 text-purple-700', iconClass: 'text-purple-600' },
            { status: 'rejected', label: 'Rejected', icon: XCircle, activeClass: 'bg-red-50 border-red-200 text-red-700', iconClass: 'text-red-600' },
            { status: 'cancelled', label: 'Cancelled', icon: XCircle, activeClass: 'bg-gray-50 border-gray-200 text-gray-700', iconClass: 'text-gray-600' }
          ].map(({ status, label, icon: Icon, activeClass, iconClass }) => {
            const count = orders.filter(o => o.status === status).length;
            const isActive = statusFilter === status;
            
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  isActive 
                    ? activeClass
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Icon className={`w-4 h-4 ${isActive ? iconClass : 'text-gray-400'}`} />
                  <span className="text-lg font-semibold">{count}</span>
                </div>
                <div className="text-xs font-medium mt-1">{label}</div>
              </button>
            );
          })}
        </div>

        {/* Advanced Filters Panel */}
        {showAdvancedFilters && (
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-900">Advanced Filters</h3>
              <button
                onClick={clearAllFilters}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Clear All
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {/* Customer Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Customer</label>
                <select
                  value={customerFilter}
                  onChange={(e) => setCustomerFilter(e.target.value)}
                  className="w-full px-2 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Customers</option>
                  {customers.slice(0, 10).map((customer) => (
                    <option key={customer.id} value={customer.id.toString()}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date From */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">From Date</label>
                <input
                  type="date"
                  value={dateFromFilter}
                  onChange={(e) => setDateFromFilter(e.target.value)}
                  className="w-full px-2 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Date To */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">To Date</label>
                <input
                  type="date"
                  value={dateToFilter}
                  onChange={(e) => setDateToFilter(e.target.value)}
                  className="w-full px-2 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Amount Min */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Min Amount</label>
                <input
                  type="number"
                  value={amountMinFilter}
                  onChange={(e) => setAmountMinFilter(e.target.value)}
                  className="w-full px-2 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="₦0"
                />
              </div>

              {/* Amount Max */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Max Amount</label>
                <input
                  type="number"
                  value={amountMaxFilter}
                  onChange={(e) => setAmountMaxFilter(e.target.value)}
                  className="w-full px-2 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="No limit"
                />
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Sort By</label>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortBy(field as any);
                    setSortOrder(order as any);
                  }}
                  className="w-full px-2 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="date-desc">Date (Newest)</option>
                  <option value="date-asc">Date (Oldest)</option>
                  <option value="amount-desc">Amount (High-Low)</option>
                  <option value="amount-asc">Amount (Low-High)</option>
                  <option value="customer-asc">Customer (A-Z)</option>
                  <option value="customer-desc">Customer (Z-A)</option>
                </select>
              </div>
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
      {paginatedOrders.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-4">
            <input
              type="checkbox"
              checked={selectedOrders.length > 0 && paginatedOrders.every(order => selectedOrders.includes(order.id))}
              ref={(input) => {
                if (input) {
                  input.indeterminate = selectedOrders.length > 0 && !paginatedOrders.every(order => selectedOrders.includes(order.id));
                }
              }}
              onChange={() => {
                const currentPageIds = paginatedOrders.map(order => order.id);
                const allCurrentSelected = currentPageIds.every(id => selectedOrders.includes(id));
                if (allCurrentSelected) {
                  // Deselect all on current page
                  setSelectedOrders(prev => prev.filter(id => !currentPageIds.includes(id)));
                } else {
                  // Select all on current page
                  setSelectedOrders(prev => [...new Set([...prev, ...currentPageIds])]);
                }
              }}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              {selectedOrders.length > 0 
                ? `${selectedOrders.length} selected across all pages`
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
          paginatedOrders.map((order) => (
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
                {supabaseAuth.canEditOrder(order) && (
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      await initiateEdit(order);
                    }}
                    className="px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors flex items-center"
                    title="Edit Order"
                  >
                    <Edit3 className="w-3 h-3 mr-1" />
                    Edit
                  </button>
                )}
                {/* Cancel Button */}
                {supabaseAuth.canCancelOrder(order) && (
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
                  supabaseAuth.hasPermission(["Admin", "Manager"]) && (
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
                  supabaseAuth.hasPermission(["Admin", "Manager", "Inventory"]) && (
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
                  supabaseAuth.hasPermission(["Admin", "Manager", "Inventory"]) && (
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>Showing</span>
            <span className="font-medium">{startIndex + 1}</span>
            <span>to</span>
            <span className="font-medium">{Math.min(endIndex, filteredAndSortedOrders.length)}</span>
            <span>of</span>
            <span className="font-medium">{filteredAndSortedOrders.length}</span>
            <span>orders</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`flex items-center px-3 py-2 text-sm rounded-lg border transition-colors ${
                currentPage === 1
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </button>
            
            <div className="flex items-center space-x-1">
              {/* Page Numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else {
                  // Show pages around current page
                  const start = Math.max(1, currentPage - 2);
                  const end = Math.min(totalPages, start + 4);
                  const adjustedStart = Math.max(1, end - 4);
                  pageNum = adjustedStart + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={`flex items-center px-3 py-2 text-sm rounded-lg border transition-colors ${
                currentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
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
                        {vehicle.license_plate} ({vehicle.type})
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
                    Proof of Delivery Image *
                  </label>
                  
                  {/* Image Preview */}
                  {podImagePreview && (
                    <div className="mb-4 p-3 border border-gray-200 rounded-lg bg-gray-50">
                      <img 
                        src={podImagePreview} 
                        alt="Proof of Delivery Preview" 
                        className="w-full h-48 object-cover rounded-lg mb-2"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPodImagePreview(null);
                          setPodImageFile(null);
                          setPodImage("");
                        }}
                        className="text-sm text-red-600 hover:text-red-800 flex items-center"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Remove image
                      </button>
                    </div>
                  )}
                  
                  {!podImagePreview && (
                    <div className="space-y-3">
                      {/* Upload Options */}
                      <div className="grid grid-cols-2 gap-3">
                        {/* File Upload */}
                        <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors">
                          <div className="flex flex-col items-center">
                            <Upload className="w-6 h-6 text-gray-400 mb-1" />
                            <span className="text-sm text-gray-600">Upload File</span>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileUpload}
                          />
                        </label>
                        
                        {/* Camera Capture */}
                        <button
                          type="button"
                          onClick={handleCameraCapture}
                          className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors"
                        >
                          <Camera className="w-6 h-6 text-gray-400 mb-1" />
                          <span className="text-sm text-gray-600">Take Photo</span>
                        </button>
                      </div>
                    </div>
                  )}
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

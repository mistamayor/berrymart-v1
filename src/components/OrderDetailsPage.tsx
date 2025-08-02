import React, { useState, useEffect } from "react";
import { SalesOrder, OrderItem, TransportVehicle } from "../types";
import { supabaseDb } from "../lib/supabaseDatabase";
import { supabaseAuth } from "../lib/supabaseAuth";
import { activityLogger } from "../lib/activityLogger";
import {
  ShoppingCart,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Package,
  Calendar,
  DollarSign,
  FileText,
  Truck,
  Camera,
  MapPin,
  ArrowLeft,
  Edit3,
  Upload,
  X,
  Home,
  ChevronRight,
} from "lucide-react";

interface OrderDetailsPageProps {
  orderId: number;
  onBack: () => void;
  onOrderUpdated: () => void;
  currentUser: { id: number; first_name: string; last_name: string; role: string };
}

export const OrderDetailsPage: React.FC<OrderDetailsPageProps> = ({
  orderId,
  onBack,
  onOrderUpdated,
  currentUser,
}) => {
  const [order, setOrder] = useState<SalesOrder | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Action modals state
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [showPODModal, setShowPODModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<"approve" | "reject">("approve");
  const [rejectionReason, setRejectionReason] = useState("");
  const [approvalComment, setApprovalComment] = useState("");
  
  // Dispatch state
  const [dispatchedBy, setDispatchedBy] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [vehicles, setVehicles] = useState<TransportVehicle[]>([]);
  
  // POD state
  const [podImage, setPodImage] = useState("");
  const [podImageFile, setPodImageFile] = useState<File | null>(null);
  const [podImagePreview, setPodImagePreview] = useState<string | null>(null);
  const [deliveryNotes, setDeliveryNotes] = useState("");

  useEffect(() => {
    loadOrderDetails();
    // Log page view
    activityLogger.logView('order_details', orderId.toString(), `Viewed order #${orderId} details`);
  }, [orderId]);

  useEffect(() => {
    if (showDispatchModal) {
      setDispatchedBy(`${currentUser.first_name} ${currentUser.last_name}`);
      loadVehicles();
    }
  }, [showDispatchModal, currentUser]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [orderData, itemsData] = await Promise.all([
        supabaseDb.getOrderById(orderId),
        supabaseDb.getOrderItems(orderId),
      ]);
      
      if (!orderData) {
        setError("Order not found");
        return;
      }
      
      setOrder(orderData);
      setOrderItems(itemsData);
    } catch (err) {
      console.error("Error loading order details:", err);
      setError("Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  const loadVehicles = async () => {
    try {
      const vehiclesData = await supabaseDb.getAllVehicles();
      setVehicles(vehiclesData.filter((v) => v.status === "active"));
    } catch (error) {
      console.error('Error loading vehicles:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "approved":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "rejected":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "dispatched":
        return <Truck className="w-5 h-5 text-blue-500" />;
      case "delivered":
        return <MapPin className="w-5 h-5 text-purple-500" />;
      case "cancelled":
        return <XCircle className="w-5 h-5 text-gray-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      case "dispatched":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "delivered":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "cancelled":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const initiateApproval = (action: "approve" | "reject") => {
    setApprovalAction(action);
    setShowApprovalModal(true);
  };

  const handleApproval = async () => {
    if (!order) return;
    try {
      if (approvalAction === "approve") {
        const approverName = `${currentUser.first_name} ${currentUser.last_name}`;
        await supabaseDb.approveOrder(order.id, approverName);
      } else {
        if (!rejectionReason.trim()) {
          alert("Please enter rejection reason");
          return;
        }
        await supabaseDb.cancelOrder(order.id, `${currentUser.first_name} ${currentUser.last_name}`, rejectionReason);
      }
      setShowApprovalModal(false);
      setApprovalComment("");
      setRejectionReason("");
      await loadOrderDetails();
      onOrderUpdated();
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  const initiateDispatch = () => {
    setSelectedVehicleId(null);
    setTrackingNumber("");
    setShowDispatchModal(true);
  };

  const handleDispatch = async () => {
    if (!order) return;
    if (!dispatchedBy.trim() || !trackingNumber.trim() || !selectedVehicleId) {
      alert("Please fill in all dispatch details and select a vehicle");
      return;
    }
    try {
      await supabaseDb.updateOrder(order.id, {
        status: 'dispatched',
        dispatched_by: dispatchedBy,
        dispatched_at: new Date().toISOString(),
        tracking_number: trackingNumber
      });
      setShowDispatchModal(false);
      await loadOrderDetails();
      onOrderUpdated();
    } catch (error) {
      console.error("Error dispatching order:", error);
    }
  };

  const initiatePOD = () => {
    setPodImagePreview(null);
    setPodImageFile(null);
    setPodImage("");
    setDeliveryNotes("");
    setShowPODModal(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPodImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPodImagePreview(result);
        setPodImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePOD = async () => {
    if (!order) return;

    if (!podImagePreview && !podImage.trim()) {
      alert("Please provide a proof of delivery image");
      return;
    }

    try {
      const podImageData = podImagePreview || podImage;
      
      await supabaseDb.updateOrder(order.id, {
        status: 'delivered',
        delivered_at: new Date().toISOString(),
        pod_image: podImageData,
        delivery_notes: deliveryNotes.trim() || undefined
      });
      setShowPODModal(false);
      await loadOrderDetails();
      onOrderUpdated();
    } catch (error) {
      console.error("Error marking order as delivered:", error);
      alert("Failed to mark order as delivered. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center py-12">
        <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">{error || "Order not found"}</h3>
        <button
          onClick={onBack}
          className="text-blue-600 hover:text-blue-800 underline"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button and Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </button>
          
          {/* Breadcrumb */}
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Home className="w-4 h-4" />
            <ChevronRight className="w-4 h-4" />
            <span>Orders</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">Order #{order.id}</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center space-x-2">
          {order.status === "pending" && supabaseAuth.hasPermission(["Admin", "Manager"]) && (
            <>
              <button
                onClick={() => initiateApproval("approve")}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Approve
              </button>
              <button
                onClick={() => initiateApproval("reject")}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Reject
              </button>
            </>
          )}
          {order.status === "approved" && supabaseAuth.hasPermission(["Admin", "Manager", "Inventory"]) && (
            <button
              onClick={initiateDispatch}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Dispatch
            </button>
          )}
          {order.status === "dispatched" && supabaseAuth.hasPermission(["Admin", "Manager", "Inventory"]) && (
            <button
              onClick={initiatePOD}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Mark Delivered
            </button>
          )}
        </div>
      </div>

      {/* Order Header Card */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <ShoppingCart className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Order #{order.id}</h1>
              <p className="text-gray-600">Created {formatDate(order.created_at)}</p>
            </div>
          </div>
          
          <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
            {getStatusIcon(order.status)}
            <span className="ml-2 capitalize">{order.status}</span>
          </div>
        </div>

        {/* Order Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center space-x-3">
            <User className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">Customer</p>
              <p className="font-medium text-gray-900">{order.customer_name}</p>
              <p className="text-sm text-gray-500 capitalize">{order.customer_type}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <DollarSign className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="font-bold text-xl text-blue-600">
                ₦{order.total_amount.toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <User className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">Created By</p>
              <p className="font-medium text-gray-900">{order.created_by_name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Package className="w-5 h-5 mr-2" />
            Order Items ({orderItems.length})
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Price
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orderItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{item.product_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900">
                    ₦{item.unit_price.toLocaleString("en-NG", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-gray-900">
                    ₦{item.total_price.toLocaleString("en-NG", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={3} className="px-6 py-4 text-right font-medium text-gray-900">
                  Total Amount:
                </td>
                <td className="px-6 py-4 text-right font-bold text-xl text-blue-600">
                  ₦{order.total_amount.toLocaleString("en-NG", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Order Timeline & Status Updates */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Timeline</h2>
        
        <div className="space-y-4">
          {/* Order Created */}
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">Order Created</p>
              <p className="text-sm text-gray-600">{formatDate(order.created_at)}</p>
              <p className="text-sm text-gray-500">by {order.created_by_name}</p>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <FileText className="w-4 h-4 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Order Notes</p>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg mt-1">{order.notes}</p>
              </div>
            </div>
          )}

          {/* Approval */}
          {order.approved_by && (
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Order Approved</p>
                <p className="text-sm text-gray-600">{formatDate(order.approved_at!)}</p>
                <p className="text-sm text-gray-500">by {order.approved_by}</p>
              </div>
            </div>
          )}

          {/* Dispatch */}
          {order.dispatched_by && (
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Truck className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Order Dispatched</p>
                <p className="text-sm text-gray-600">{formatDate(order.dispatched_at!)}</p>
                <p className="text-sm text-gray-500">by {order.dispatched_by}</p>
                {order.tracking_number && (
                  <p className="text-sm text-gray-600 font-mono bg-gray-50 p-2 rounded mt-1">
                    Tracking: {order.tracking_number}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Delivery */}
          {order.delivered_at && (
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <MapPin className="w-4 h-4 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Order Delivered</p>
                <p className="text-sm text-gray-600">{formatDate(order.delivered_at)}</p>
                {order.delivery_notes && (
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg mt-1">{order.delivery_notes}</p>
                )}
              </div>
            </div>
          )}

          {/* Cancellation */}
          {order.cancelled_at && (
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <XCircle className="w-4 h-4 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Order Cancelled</p>
                <p className="text-sm text-gray-600">{formatDate(order.cancelled_at)}</p>
                <p className="text-sm text-gray-500">by {order.cancelled_by}</p>
                {order.cancellation_reason && (
                  <p className="text-sm text-gray-600 bg-red-50 p-3 rounded-lg mt-1 border border-red-200">
                    <strong>Reason:</strong> {order.cancellation_reason}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Proof of Delivery */}
      {order.pod_image && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Camera className="w-5 h-5 mr-2" />
            Proof of Delivery
          </h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <img
              src={order.pod_image}
              alt="Proof of Delivery"
              className="max-w-full h-auto rounded-lg shadow-md"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
                const errorMsg = document.createElement("p");
                errorMsg.textContent = "Failed to load POD image";
                errorMsg.className = "text-red-600 text-sm";
                (e.target as HTMLImageElement).parentNode?.appendChild(errorMsg);
              }}
            />
          </div>
        </div>
      )}

      {/* Modals - same as in OrderList */}
      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  {approvalAction === "approve" ? "Approve Order" : "Reject Order"}
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApproval}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                  >
                    {approvalAction === "approve" ? "Approve" : "Reject"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dispatch Modal */}
      {showDispatchModal && (
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
                  <p className="text-sm text-gray-600">Order #{order.id}</p>
                  <p className="font-medium text-gray-900">{order.customer_name}</p>
                  <p className="text-sm text-gray-600">
                    ₦{order.total_amount.toLocaleString("en-NG", {
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
                    onChange={(e) => setSelectedVehicleId(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="" disabled>
                      Select a vehicle
                    </option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
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
      {showPODModal && (
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
                  <p className="text-sm text-gray-600">Order #{order.id}</p>
                  <p className="font-medium text-gray-900">{order.customer_name}</p>
                  <p className="text-sm text-gray-600">
                    Tracking: <span className="font-mono">{order.tracking_number}</span>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Proof of Delivery Image *
                  </label>
                  
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
                    <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors">
                      <div className="flex flex-col items-center">
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600">Upload POD Image</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </label>
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
    </div>
  );
};
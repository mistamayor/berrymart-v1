import React, { useState, useEffect } from "react";
import { SalesOrder, OrderItem, TransportVehicle } from "../types";
import { db } from "../lib/database";
import { auth } from "../lib/auth";
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
} from "lucide-react";

interface OrderListProps {
  orders: SalesOrder[];
  onStatusChange: () => void;
  currentUser: { id: number; first_name: string; last_name: string };
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

  useEffect(() => {
    if (showDispatchModal) {
      setDispatchedBy(`${currentUser.first_name} ${currentUser.last_name}`);
      setVehicles(
        db.getAllTransportVehicles().filter((v) => v.status === "active")
      );
      setSelectedVehicleId(null);
    }
  }, [showDispatchModal, currentUser]);

  // Filtered orders logic
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      searchTerm === "" ||
      order.id.toString().includes(searchTerm) ||
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.created_by_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-xl font-bold text-gray-900">Sales Orders</h2>
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search by order #, customer, or creator..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="dispatched">Dispatched</option>
            <option value="delivered">Delivered</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
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
        </div>
      </div>

      <div className="grid gap-4">
        {filteredOrders.map((order) => (
          <div
            key={order.id}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:bg-blue-50 transition-colors"
            onClick={() => viewOrderDetails(order)}
          >
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
          </div>
        ))}
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
    </div>
  );
};

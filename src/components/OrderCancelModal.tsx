import React, { useState } from "react";
import { SalesOrder } from "../types";
import { db } from "../lib/database";
import {
  XCircle,
  X,
  AlertTriangle,
  Package,
  User,
  Calendar,
  DollarSign,
} from "lucide-react";

interface OrderCancelModalProps {
  order: SalesOrder;
  onOrderCancelled: (order: SalesOrder) => void;
  onClose: () => void;
  currentUser: { id: number; first_name: string; last_name: string; role: string };
}

const CANCELLATION_REASONS = [
  "Customer requested cancellation",
  "Out of stock - unable to fulfill",
  "Pricing error",
  "Duplicate order",
  "Payment issues",
  "Shipping restrictions",
  "Customer changed mind",
  "Order placed in error",
  "Product discontinued",
  "Unable to meet delivery date",
  "Other"
];

export const OrderCancelModal: React.FC<OrderCancelModalProps> = ({
  order,
  onOrderCancelled,
  onClose,
  currentUser,
}) => {
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canCancel = db.canCancelOrder(order.id, currentUser.role, currentUser.id);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!selectedReason) {
      newErrors.reason = "Please select a cancellation reason";
    }

    if (selectedReason === "Other" && !customReason.trim()) {
      newErrors.customReason = "Please provide a custom reason";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !canCancel) return;

    setIsSubmitting(true);
    try {
      const finalReason = selectedReason === "Other" ? customReason.trim() : selectedReason;
      const cancellerName = `${currentUser.first_name} ${currentUser.last_name}`;
      
      const success = db.cancelOrder(order.id, finalReason, cancellerName);
      
      if (success) {
        const updatedOrder = db.getOrderById(order.id);
        if (updatedOrder) {
          onOrderCancelled(updatedOrder);
        }
      } else {
        setErrors({ submit: "Failed to cancel order. Please try again." });
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      setErrors({ submit: "An error occurred while cancelling the order." });
    } finally {
      setIsSubmitting(false);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "dispatched":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getWarningMessage = () => {
    switch (order.status) {
      case "pending":
        return "This will cancel the pending order and restore all product stock.";
      case "approved":
        return "This will cancel the approved order and restore all product stock. The customer should be notified.";
      case "dispatched":
        return "⚠️ WARNING: This order has been dispatched. Cancelling may require coordination with delivery team and customer notification.";
      default:
        return "This will cancel the order and restore product stock.";
    }
  };

  const getButtonColor = () => {
    switch (order.status) {
      case "dispatched":
        return "bg-red-700 hover:bg-red-800"; // Darker red for dispatched orders
      default:
        return "bg-red-600 hover:bg-red-700";
    }
  };

  if (!canCancel) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <XCircle className="w-6 h-6 mr-2 text-red-600" />
                Cannot Cancel Order
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="text-center py-4">
              <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Cancellation Not Allowed
              </h4>
              <p className="text-gray-600 mb-4">
                You don't have permission to cancel this order or the order cannot be cancelled in its current state.
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center">
              <XCircle className="w-7 h-7 mr-2 text-red-600" />
              Cancel Order
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">Order Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Package className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">Order #{order.id}</p>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {order.status.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">{order.customer_name}</p>
                  <p className="text-gray-600 capitalize">{order.customer_type}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">
                    ₦{order.total_amount.toLocaleString('en-NG', {
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
                  <p className="font-medium text-gray-900">{formatDate(order.created_at)}</p>
                  <p className="text-gray-600">Created</p>
                </div>
              </div>
            </div>
          </div>

          {/* Warning Message */}
          <div className={`p-4 rounded-lg border-l-4 mb-6 ${
            order.status === 'dispatched' 
              ? 'bg-red-50 border-red-400' 
              : 'bg-amber-50 border-amber-400'
          }`}>
            <div className="flex items-start">
              <AlertTriangle className={`w-5 h-5 mr-3 mt-0.5 ${
                order.status === 'dispatched' ? 'text-red-600' : 'text-amber-600'
              }`} />
              <div>
                <h5 className={`font-medium ${
                  order.status === 'dispatched' ? 'text-red-800' : 'text-amber-800'
                }`}>
                  Cancellation Impact
                </h5>
                <p className={`text-sm mt-1 ${
                  order.status === 'dispatched' ? 'text-red-700' : 'text-amber-700'
                }`}>
                  {getWarningMessage()}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Cancellation Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cancellation Reason *
              </label>
              <select
                value={selectedReason}
                onChange={(e) => {
                  setSelectedReason(e.target.value);
                  setErrors((prev) => ({ ...prev, reason: "" }));
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  errors.reason ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select a reason...</option>
                {CANCELLATION_REASONS.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
              {errors.reason && <p className="text-red-500 text-sm mt-1">{errors.reason}</p>}
            </div>

            {/* Custom Reason Input */}
            {selectedReason === "Other" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Reason *
                </label>
                <textarea
                  value={customReason}
                  onChange={(e) => {
                    setCustomReason(e.target.value);
                    setErrors((prev) => ({ ...prev, customReason: "" }));
                  }}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    errors.customReason ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Please provide a detailed reason for cancellation..."
                />
                {errors.customReason && <p className="text-red-500 text-sm mt-1">{errors.customReason}</p>}
              </div>
            )}

            {/* Canceller Info */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cancelled By
              </label>
              <div className="text-gray-900 font-semibold bg-gray-50 rounded px-3 py-2">
                {currentUser.first_name} {currentUser.last_name} ({currentUser.role})
              </div>
            </div>

            {errors.submit && (
              <div className="text-red-600 text-sm flex items-center">
                <AlertTriangle className="w-4 h-4 mr-1" />
                {errors.submit}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Keep Order
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-6 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center ${getButtonColor()}`}
              >
                <XCircle className="w-4 h-4 mr-2" />
                {isSubmitting ? "Cancelling..." : "Cancel Order"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
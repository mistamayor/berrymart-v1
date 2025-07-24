import React, { useState } from "react";
import { SalesOrder } from "../types";
import { db } from "../lib/database";
import {
  CheckCircle,
  XCircle,
  X,
  AlertTriangle,
  Package,
  User,
  DollarSign,
  Loader,
} from "lucide-react";

interface BulkActionModalProps {
  action: 'approve' | 'reject' | 'cancel';
  orders: SalesOrder[];
  onComplete: (result: { successful: number[]; failed: Array<{orderId: number; reason: string}>; totalProcessed: number }) => void;
  onClose: () => void;
  currentUser: { id: number; first_name: string; last_name: string; role: string };
}

export const BulkActionModal: React.FC<BulkActionModalProps> = ({
  action,
  orders,
  onComplete,
  onClose,
  currentUser,
}) => {
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");
  const [confirmUnderstand, setConfirmUnderstand] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const getActionConfig = () => {
    switch (action) {
      case 'approve':
        return {
          title: `Approve ${orders.length} Orders`,
          description: "This will approve all selected pending orders.",
          buttonText: "Approve Orders",
          buttonColor: "bg-green-600 hover:bg-green-700",
          icon: <CheckCircle className="w-6 h-6 text-green-600" />,
          requiresReason: false,
          requiresConfirmation: false,
        };
      case 'reject':
        return {
          title: `Reject ${orders.length} Orders`,
          description: "This will reject all selected pending orders. This action cannot be undone.",
          buttonText: "Reject Orders",
          buttonColor: "bg-red-600 hover:bg-red-700",
          icon: <XCircle className="w-6 h-6 text-red-600" />,
          requiresReason: true,
          requiresConfirmation: true,
        };
      case 'cancel':
        return {
          title: `Cancel ${orders.length} Orders`,
          description: "This will cancel all selected orders and restore product stock. This action cannot be undone.",
          buttonText: "Cancel Orders",
          buttonColor: "bg-red-600 hover:bg-red-700",
          icon: <XCircle className="w-6 h-6 text-red-600" />,
          requiresReason: true,
          requiresConfirmation: true,
        };
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  };

  const config = getActionConfig();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (config.requiresReason && !reason.trim()) {
      newErrors.reason = "Please provide a reason";
    }

    if (config.requiresConfirmation && !confirmUnderstand) {
      newErrors.confirmation = "Please confirm you understand this action";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsProcessing(true);
    try {
      const orderIds = orders.map(order => order.id);
      const userFullName = `${currentUser.first_name} ${currentUser.last_name}`;
      
      let result;
      
      switch (action) {
        case 'approve':
          result = db.bulkApproveOrders(orderIds, userFullName, comment);
          break;
        case 'reject':
          result = db.bulkRejectOrders(orderIds, reason);
          break;
        case 'cancel':
          result = db.bulkCancelOrders(orderIds, reason, userFullName);
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }

      onComplete(result);
    } catch (error) {
      console.error(`Error performing bulk ${action}:`, error);
      setErrors({ submit: `Failed to ${action} orders. Please try again.` });
    } finally {
      setIsProcessing(false);
    }
  };

  const totalAmount = orders.reduce((sum, order) => sum + order.total_amount, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center">
              {config.icon}
              <span className="ml-3">{config.title}</span>
            </h3>
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="text-gray-400 hover:text-gray-600 text-2xl disabled:cursor-not-allowed"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Description */}
          <div className={`p-4 rounded-lg border-l-4 mb-6 ${
            action === 'approve' 
              ? 'bg-green-50 border-green-400' 
              : 'bg-red-50 border-red-400'
          }`}>
            <div className="flex items-start">
              <AlertTriangle className={`w-5 h-5 mr-3 mt-0.5 ${
                action === 'approve' ? 'text-green-600' : 'text-red-600'
              }`} />
              <div>
                <h5 className={`font-medium ${
                  action === 'approve' ? 'text-green-800' : 'text-red-800'
                }`}>
                  Bulk {action.charAt(0).toUpperCase() + action.slice(1)} Action
                </h5>
                <p className={`text-sm mt-1 ${
                  action === 'approve' ? 'text-green-700' : 'text-red-700'
                }`}>
                  {config.description}
                </p>
              </div>
            </div>
          </div>

          {/* Orders Summary */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">Selected Orders ({orders.length})</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {orders.map((order) => (
                <div key={order.id} className="flex items-center justify-between text-sm bg-white p-2 rounded border">
                  <div className="flex items-center space-x-3">
                    <Package className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">#{order.id}</span>
                    <span className="text-gray-600">{order.customer_name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'approved' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status.toUpperCase()}
                    </span>
                    <span className="font-medium">
                      ₦{order.total_amount.toLocaleString('en-NG', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
              <span className="font-medium text-gray-900">Total Amount:</span>
              <span className="font-bold text-lg text-blue-600">
                ₦{totalAmount.toLocaleString('en-NG', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Reason Input */}
            {config.requiresReason && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {action === 'approve' ? 'Comments (Optional)' : `${action.charAt(0).toUpperCase() + action.slice(1)} Reason *`}
                </label>
                <textarea
                  value={action === 'approve' ? comment : reason}
                  onChange={(e) => {
                    if (action === 'approve') {
                      setComment(e.target.value);
                    } else {
                      setReason(e.target.value);
                      setErrors((prev) => ({ ...prev, reason: "" }));
                    }
                  }}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    action === 'approve' ? 'focus:ring-green-500' : 'focus:ring-red-500'
                  } ${errors.reason ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder={action === 'approve' 
                    ? "Add any comments for the approval..." 
                    : `Please provide a reason for bulk ${action}...`}
                  required={config.requiresReason && action !== 'approve'}
                />
                {errors.reason && <p className="text-red-500 text-sm mt-1">{errors.reason}</p>}
              </div>
            )}

            {/* Action by */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {action === 'approve' ? 'Approved By' : action === 'reject' ? 'Rejected By' : 'Cancelled By'}
              </label>
              <div className="text-gray-900 font-semibold bg-gray-50 rounded px-3 py-2 flex items-center">
                <User className="w-4 h-4 mr-2 text-gray-400" />
                {currentUser.first_name} {currentUser.last_name} ({currentUser.role})
              </div>
            </div>

            {/* Confirmation Checkbox */}
            {config.requiresConfirmation && (
              <div>
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={confirmUnderstand}
                    onChange={(e) => {
                      setConfirmUnderstand(e.target.checked);
                      setErrors((prev) => ({ ...prev, confirmation: "" }));
                    }}
                    className="w-4 h-4 text-red-600 rounded focus:ring-red-500 mt-1"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      I understand this action cannot be undone
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      This will permanently {action} all selected orders and {
                        action === 'cancel' ? 'restore product stock' : 'update their status'
                      }.
                    </p>
                  </div>
                </label>
                {errors.confirmation && <p className="text-red-500 text-sm mt-1">{errors.confirmation}</p>}
              </div>
            )}

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
                disabled={isProcessing}
                className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isProcessing}
                className={`px-6 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center ${config.buttonColor}`}
              >
                {isProcessing ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  config.buttonText
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
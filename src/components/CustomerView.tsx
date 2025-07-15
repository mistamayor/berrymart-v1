import React, { useEffect, useState } from "react";
import { Customer, SalesOrder } from "../types";
import { db } from "../lib/database";
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  UserCheck,
  ShoppingCart,
  CheckCircle,
  XCircle,
  Truck,
  MapPin as DeliveredIcon,
} from "lucide-react";
import { auth } from "../lib/auth";
import { CustomerForm } from "./CustomerForm";

interface CustomerViewProps {
  customer: Customer;
  onClose: () => void;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "pending":
      return <ShoppingCart className="w-4 h-4 text-yellow-500" />;
    case "approved":
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case "rejected":
      return <XCircle className="w-4 h-4 text-red-500" />;
    case "dispatched":
      return <Truck className="w-4 h-4 text-blue-500" />;
    case "delivered":
      return <DeliveredIcon className="w-4 h-4 text-purple-500" />;
    default:
      return <ShoppingCart className="w-4 h-4 text-gray-400" />;
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

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const CustomerView: React.FC<CustomerViewProps> = ({ customer, onClose }) => {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [showEditForm, setShowEditForm] = useState(false);
  const [customerData, setCustomerData] = useState<Customer>(customer);

  useEffect(() => {
    // Get all orders for this customer
    const allOrders = db.getAllOrders();
    setOrders(allOrders.filter((o) => o.customer_id === customer.id));
  }, [customer.id]);

  useEffect(() => {
    setCustomerData(customer);
  }, [customer]);

  const canEditCustomer = auth.hasPermission([
    "Admin",
    "Management",
    "Manager",
  ]);

  const handleEditCustomer = () => {
    setShowEditForm(true);
  };

  const handleCustomerUpdated = (updatedCustomer: Customer) => {
    setCustomerData(updatedCustomer);
    setShowEditForm(false);
    // Optionally, trigger a parent refresh if needed
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center">
              <User className="w-7 h-7 mr-2 text-blue-600" />
              Customer Details
            </h3>
            <div className="flex items-center gap-2">
              {canEditCustomer && (
                <button
                  onClick={handleEditCustomer}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors font-semibold"
                >
                  Edit
                </button>
              )}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Customer Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-lg font-bold text-gray-900">
                <User className="w-5 h-5 text-blue-600" />
                {customer.name}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4" /> {customer.email}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="w-4 h-4" /> {customer.phone}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <UserCheck className="w-4 h-4" />
                <span className="capitalize">
                  {customer.type.replace("_", " ")}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Created: {formatDate(customer.created_at)}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="font-semibold text-gray-700">Customer ID:</div>
              <div className="text-lg font-mono text-gray-900">
                {customer.id}
              </div>
            </div>
          </div>

          {/* Ship-To Addresses */}
          <div className="mb-8">
            <h4 className="font-semibold text-gray-900 mb-2">
              Ship-To Addresses
            </h4>
            {customer.addresses.length === 0 ? (
              <div className="text-gray-500 text-sm mb-4">
                No addresses for this customer.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customer.addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="p-4 border rounded-lg bg-gray-50 relative"
                  >
                    {addr.is_default && (
                      <span className="absolute top-2 right-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                        Default
                      </span>
                    )}
                    <div className="font-semibold text-gray-800">
                      {addr.address}
                    </div>
                    <div className="text-sm text-gray-600">
                      {addr.city}, {addr.state}, {addr.country}{" "}
                      {addr.postal_code}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Customer Sales Summary */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-2">Sales Summary</h4>
            <div className="flex gap-6">
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                <div className="text-xs text-gray-500">YTD Sales</div>
                <div className="text-lg font-bold text-green-700">
                  ₦
                  {orders
                    .filter(
                      (o) =>
                        new Date(o.created_at).getFullYear() ===
                        new Date().getFullYear()
                    )
                    .reduce((sum, o) => sum + o.total_amount, 0)
                    .toLocaleString("en-NG", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
                <div className="text-xs text-gray-500">MTD Sales</div>
                <div className="text-lg font-bold text-blue-700">
                  ₦
                  {orders
                    .filter((o) => {
                      const now = new Date();
                      const d = new Date(o.created_at);
                      return (
                        d.getFullYear() === now.getFullYear() &&
                        d.getMonth() === now.getMonth()
                      );
                    })
                    .reduce((sum, o) => sum + o.total_amount, 0)
                    .toLocaleString("en-NG", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                </div>
              </div>
            </div>
          </div>

          {/* Orders Table */}
          <h4 className="font-semibold text-gray-900 mb-2">Orders</h4>
          {orders.length === 0 ? (
            <div className="text-gray-500 text-sm mb-4">
              No orders for this customer.
            </div>
          ) : (
            <div className="overflow-x-auto mb-2">
              <table className="min-w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Order #
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                      Total
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-t"
                    >
                      <td className="px-4 py-2 font-medium text-gray-900">
                        #{order.id}
                      </td>
                      <td className="px-4 py-2">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        ₦
                        {order.total_amount.toLocaleString("en-NG", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {getStatusIcon(order.status)}
                          <span className="ml-1">{order.status}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {showEditForm && (
            <CustomerForm
              onCustomerAdded={handleCustomerUpdated}
              onClose={() => setShowEditForm(false)}
              customer={customerData}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerView;

import React, { useEffect, useState } from "react";
import { Product, SalesOrder, OrderItem } from "../types";
import { db } from "../lib/database";
import {
  X,
  Package,
  Hash,
  DollarSign,
  Boxes,
  AlertTriangle,
  ShoppingCart,
  CheckCircle,
  XCircle,
  Truck,
  MapPin as DeliveredIcon,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { auth } from "../lib/auth";
import { ProductForm } from "./ProductForm";

interface ProductViewProps {
  product: Product;
  onClose: () => void;
  onProductUpdated?: (product: Product) => void;
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

const getStockStatus = (quantity: number) => {
  if (quantity === 0)
    return { color: "text-red-600", bg: "bg-red-100", label: "Out of Stock" };
  if (quantity < 10)
    return {
      color: "text-yellow-600",
      bg: "bg-yellow-100",
      label: "Low Stock",
    };
  return { color: "text-green-600", bg: "bg-green-100", label: "In Stock" };
};

const ProductView: React.FC<ProductViewProps> = ({ 
  product, 
  onClose, 
  onProductUpdated 
}) => {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [showEditForm, setShowEditForm] = useState(false);
  const [productData, setProductData] = useState<Product>(product);

  useEffect(() => {
    // Get all order items for this product
    const allOrders = db.getAllOrders();
    const allOrderItems = allOrders.flatMap(order => 
      db.getOrderItems(order.id).filter(item => item.product_id === product.id)
    );
    setOrderItems(allOrderItems);

    // Get orders that contain this product
    const ordersWithThisProduct = allOrders.filter(order =>
      db.getOrderItems(order.id).some(item => item.product_id === product.id)
    );
    setOrders(ordersWithThisProduct);
  }, [product.id]);

  useEffect(() => {
    setProductData(product);
  }, [product]);

  const canEditProduct = auth.hasPermission([
    "Admin",
    "Manager",
    "Inventory",
  ]);

  const handleEditProduct = () => {
    setShowEditForm(true);
  };

  const handleProductUpdated = (updatedProduct: Product) => {
    setProductData(updatedProduct);
    setShowEditForm(false);
    // Trigger parent refresh to update the product list
    if (onProductUpdated) {
      onProductUpdated(updatedProduct);
    }
  };

  const stockStatus = getStockStatus(productData.stock_quantity);

  // Calculate sales metrics
  const totalQuantitySold = orderItems
    .filter(item => {
      const order = orders.find(o => o.id === item.order_id);
      return order && order.status !== 'rejected';
    })
    .reduce((sum, item) => sum + item.quantity, 0);

  const totalRevenue = orderItems
    .filter(item => {
      const order = orders.find(o => o.id === item.order_id);
      return order && order.status !== 'rejected';
    })
    .reduce((sum, item) => sum + item.total_price, 0);

  const monthlyRevenue = orderItems
    .filter(item => {
      const order = orders.find(o => o.id === item.order_id);
      if (!order || order.status === 'rejected') return false;
      const now = new Date();
      const orderDate = new Date(order.created_at);
      return orderDate.getFullYear() === now.getFullYear() && 
             orderDate.getMonth() === now.getMonth();
    })
    .reduce((sum, item) => sum + item.total_price, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center">
              <Package className="w-7 h-7 mr-2 text-blue-600" />
              Product Details
            </h3>
            <div className="flex items-center gap-2">
              {canEditProduct && (
                <button
                  onClick={handleEditProduct}
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

          {/* Product Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">{productData.name}</h4>
                    <p className="text-sm text-gray-600 flex items-center">
                      <Hash className="w-3 h-3 mr-1" />
                      {productData.sku}
                    </p>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${stockStatus.bg} ${stockStatus.color}`}
                >
                  {productData.stock_quantity < 10 && (
                    <AlertTriangle className="w-4 h-4 mr-1" />
                  )}
                  {stockStatus.label}
                </span>
              </div>

              {productData.description && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-semibold text-gray-700 mb-2">Description</h5>
                  <p className="text-gray-600">{productData.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Boxes className="w-5 h-5 text-blue-600 mr-2" />
                    <span className="font-semibold text-gray-700">Stock</span>
                  </div>
                  <p className={`text-2xl font-bold ${stockStatus.color}`}>
                    {productData.stock_quantity}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Calendar className="w-5 h-5 text-green-600 mr-2" />
                    <span className="font-semibold text-gray-700">Created</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {formatDate(productData.created_at)}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="font-semibold text-gray-700 mb-3">Pricing Tiers</h5>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Base Price:</span>
                    <span className="font-medium">
                      ₦{productData.base_price.toLocaleString("en-NG", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Retail Price:</span>
                    <span className="font-medium">
                      ₦{productData.retail_price.toLocaleString("en-NG", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Wholesale Price:</span>
                    <span className="font-medium">
                      ₦{productData.wholesale_price.toLocaleString("en-NG", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Open Market Price:</span>
                    <span className="font-medium">
                      ₦{productData.open_market_price.toLocaleString("en-NG", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sales Summary */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-4">Sales Performance</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600">Total Revenue</div>
                    <div className="text-xl font-bold text-green-700">
                      ₦{totalRevenue.toLocaleString("en-NG", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600">Units Sold</div>
                    <div className="text-xl font-bold text-blue-700">
                      {totalQuantitySold.toLocaleString()}
                    </div>
                  </div>
                  <Boxes className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600">MTD Revenue</div>
                    <div className="text-xl font-bold text-purple-700">
                      ₦{monthlyRevenue.toLocaleString("en-NG", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </div>
                  <Calendar className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Orders Table */}
          <h4 className="font-semibold text-gray-900 mb-4">Recent Orders</h4>
          {orders.length === 0 ? (
            <div className="text-gray-500 text-sm mb-4 text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              No orders found for this product.
            </div>
          ) : (
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Order #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Quantity
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Unit Price
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 10).map((order) => {
                    const orderItem = orderItems.find(item => item.order_id === order.id);
                    return (
                      <tr key={order.id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">
                          #{order.id}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {order.customer_name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium">
                          {orderItem?.quantity || 0}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium">
                          ₦{orderItem?.unit_price.toLocaleString("en-NG", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }) || "0.00"}
                        </td>
                        <td className="px-4 py-3">
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
                    );
                  })}
                </tbody>
              </table>
              {orders.length > 10 && (
                <div className="text-center py-2 text-sm text-gray-500">
                  Showing 10 of {orders.length} orders
                </div>
              )}
            </div>
          )}

          {showEditForm && (
            <ProductForm
              onProductAdded={handleProductUpdated}
              onClose={() => setShowEditForm(false)}
              product={productData}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductView;
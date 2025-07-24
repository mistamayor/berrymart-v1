import React, { useState, useEffect } from "react";
import { Customer, Product, SalesOrder, OrderItem, OrderEditPermissions } from "../types";
import { db } from "../lib/database";
import { auth } from "../lib/auth";
import {
  ShoppingCart,
  User,
  Package,
  Plus,
  Minus,
  X,
  DollarSign,
  Search,
  ChevronDown,
  Edit3,
  Save,
  AlertTriangle,
  Info,
} from "lucide-react";

interface OrderEditModalProps {
  order: SalesOrder;
  orderItems: OrderItem[];
  customers: Customer[];
  products: Product[];
  onOrderUpdated: (order: SalesOrder) => void;
  onClose: () => void;
  currentUser: { id: number; first_name: string; last_name: string; role: string };
}

interface EditableOrderItem extends OrderItem {
  isNew?: boolean;
  isModified?: boolean;
  originalQuantity?: number;
}

export const OrderEditModal: React.FC<OrderEditModalProps> = ({
  order,
  orderItems,
  customers,
  products,
  onOrderUpdated,
  onClose,
  currentUser,
}) => {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [editableItems, setEditableItems] = useState<EditableOrderItem[]>([]);
  const [notes, setNotes] = useState(order.notes || "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [permissions, setPermissions] = useState<OrderEditPermissions>({
    canEditCustomer: false,
    canEditItems: false,
    canEditNotes: false,
    canAddItems: false,
    canRemoveItems: false,
    canEditQuantities: false,
  });

  useEffect(() => {
    // Initialize customer
    const customer = customers.find(c => c.id === order.customer_id);
    if (customer) {
      setSelectedCustomer(customer);
      setCustomerSearchTerm(customer.name);
    }

    // Initialize editable items
    setEditableItems(orderItems.map(item => ({
      ...item,
      originalQuantity: item.quantity
    })));

    // Set permissions based on order status and user role
    const canEdit = db.canEditOrder(order.id, currentUser.role);
    setPermissions({
      canEditCustomer: canEdit && order.status === 'pending',
      canEditItems: canEdit && ['pending', 'approved'].includes(order.status),
      canEditNotes: canEdit,
      canAddItems: canEdit && order.status === 'pending',
      canRemoveItems: canEdit && order.status === 'pending',
      canEditQuantities: canEdit && ['pending', 'approved'].includes(order.status),
    });
  }, [order, orderItems, customers, currentUser]);

  // Filter customers based on search term
  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase())
  );

  // Get available products for adding to order
  const availableProducts = products.filter(
    (product) =>
      product.stock_quantity > 0 &&
      !editableItems.some((item) => item.product_id === product.id)
  );

  const getPriceForCustomerType = (product: Product, customerType: string) => {
    switch (customerType) {
      case "retail":
        return product.retail_price;
      case "wholesale":
        return product.wholesale_price;
      case "open_market":
        return product.open_market_price;
      default:
        return product.retail_price;
    }
  };

  const handleCustomerSelect = (customer: Customer) => {
    if (!permissions.canEditCustomer) return;
    setSelectedCustomer(customer);
    setCustomerSearchTerm(customer.name);
    setShowCustomerDropdown(false);
    setErrors((prev) => ({ ...prev, customer: "" }));

    // Update prices if customer type changes
    if (customer.type !== order.customer_type) {
      const updatedItems = editableItems.map(item => {
        const product = products.find(p => p.id === item.product_id);
        if (product) {
          const newUnitPrice = getPriceForCustomerType(product, customer.type);
          return {
            ...item,
            unit_price: newUnitPrice,
            total_price: item.quantity * newUnitPrice,
            isModified: true
          };
        }
        return item;
      });
      setEditableItems(updatedItems);
    }
  };

  const handleCustomerSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!permissions.canEditCustomer) return;
    const value = e.target.value;
    setCustomerSearchTerm(value);
    setShowCustomerDropdown(true);

    if (selectedCustomer && !selectedCustomer.name.toLowerCase().includes(value.toLowerCase())) {
      setSelectedCustomer(null);
    }
  };

  const addToCart = () => {
    if (!selectedProduct || !permissions.canAddItems) return;

    const unitPrice = getPriceForCustomerType(selectedProduct, selectedCustomer?.type || order.customer_type);
    const totalPrice = quantity * unitPrice;

    const newItem: EditableOrderItem = {
      id: Date.now(), // Temporary ID for new items
      order_id: order.id,
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
      quantity,
      unit_price: unitPrice,
      total_price: totalPrice,
      isNew: true,
      isModified: true
    };

    setEditableItems([...editableItems, newItem]);
    setSelectedProduct(null);
    setQuantity(1);
  };

  const removeFromCart = (index: number) => {
    if (!permissions.canRemoveItems) return;
    const updatedItems = editableItems.filter((_, i) => i !== index);
    setEditableItems(updatedItems);
  };

  const updateQuantity = (index: number, newQuantity: number) => {
    if (!permissions.canEditQuantities || newQuantity <= 0) return;

    const updatedItems = editableItems.map((item, i) => {
      if (i === index) {
        return {
          ...item,
          quantity: newQuantity,
          total_price: newQuantity * item.unit_price,
          isModified: true
        };
      }
      return item;
    });
    setEditableItems(updatedItems);
  };

  const getTotalAmount = () => {
    return editableItems.reduce((sum, item) => sum + item.total_price, 0);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!selectedCustomer) newErrors.customer = "Please select a customer";
    if (editableItems.length === 0) newErrors.cart = "Order must have at least one item";

    // Check stock availability for new and modified items
    editableItems.forEach((item, index) => {
      const product = products.find(p => p.id === item.product_id);
      if (product) {
        const availableStock = product.stock_quantity + (item.originalQuantity || 0);
        if (item.quantity > availableStock) {
          newErrors[`item_${index}`] = `Insufficient stock. Available: ${availableStock}`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !selectedCustomer) return;

    try {
      const modifierName = `${currentUser.first_name} ${currentUser.last_name}`;

      // Update order details if changed
      const orderUpdates: any = {};
      if (selectedCustomer.id !== order.customer_id) {
        orderUpdates.customer_id = selectedCustomer.id;
        orderUpdates.customer_name = selectedCustomer.name;
        orderUpdates.customer_type = selectedCustomer.type;
      }
      if (notes !== order.notes) {
        orderUpdates.notes = notes;
      }
      orderUpdates.total_amount = getTotalAmount();

      if (Object.keys(orderUpdates).length > 0) {
        db.updateOrder(order.id, orderUpdates, modifierName);
      }

      // Handle item changes
      const currentItemIds = orderItems.map(item => item.id);
      const editableItemIds = editableItems.filter(item => !item.isNew).map(item => item.id);

      // Remove deleted items
      currentItemIds.forEach(itemId => {
        if (!editableItemIds.includes(itemId)) {
          db.removeOrderItem(itemId);
        }
      });

      // Add new items
      editableItems.filter(item => item.isNew).forEach(item => {
        const { id, order_id, isNew, isModified, originalQuantity, ...itemData } = item;
        db.addOrderItem(order.id, itemData);
      });

      // Update modified items
      editableItems
        .filter(item => !item.isNew && item.isModified)
        .forEach(item => {
          const { isNew, isModified, originalQuantity, ...itemData } = item;
          db.updateOrderItem(item.id, itemData);
        });

      // Get updated order
      const updatedOrder = db.getOrderById(order.id);
      if (updatedOrder) {
        onOrderUpdated(updatedOrder);
      }
      onClose();
    } catch (error) {
      console.error("Error updating order:", error);
      setErrors({ submit: "Failed to update order. Please try again." });
    }
  };

  const getStatusMessage = () => {
    if (order.status === 'delivered' || order.status === 'dispatched') {
      return "Limited editing available for dispatched/delivered orders";
    }
    if (order.status === 'approved') {
      return "Only quantity and notes can be edited for approved orders";
    }
    return null;
  };

  const statusMessage = getStatusMessage();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Edit3 className="w-6 h-6 mr-2 text-blue-600" />
              Edit Order #{order.id}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {statusMessage && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center">
              <Info className="w-5 h-5 text-amber-600 mr-2 flex-shrink-0" />
              <p className="text-sm text-amber-800">{statusMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer {!permissions.canEditCustomer && "(Read-only)"}
              </label>
              <div className="relative">
                <div className="flex items-center">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={customerSearchTerm}
                    onChange={handleCustomerSearchChange}
                    onFocus={() => permissions.canEditCustomer && setShowCustomerDropdown(true)}
                    className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      !permissions.canEditCustomer ? 'bg-gray-100 cursor-not-allowed' : ''
                    } ${errors.customer ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Search customers..."
                    disabled={!permissions.canEditCustomer}
                  />
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                </div>
                {showCustomerDropdown && permissions.canEditCustomer && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredCustomers.map((customer) => (
                      <div
                        key={customer.id}
                        className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        onClick={() => handleCustomerSelect(customer)}
                      >
                        <div className="font-medium text-gray-900">{customer.name}</div>
                        <div className="text-sm text-gray-600 capitalize">{customer.type}</div>
                        <div className="text-sm text-gray-500">{customer.email}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {errors.customer && <p className="text-red-500 text-sm mt-1">{errors.customer}</p>}
            </div>

            {/* Add Products Section */}
            {permissions.canAddItems && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Products</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Product</label>
                    <select
                      value={selectedProduct?.id || ""}
                      onChange={(e) => {
                        const product = availableProducts.find(p => p.id === Number(e.target.value));
                        setSelectedProduct(product || null);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a product...</option>
                      {availableProducts.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} (Stock: {product.stock_quantity})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={addToCart}
                      disabled={!selectedProduct}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add to Order
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Order Items */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
              {editableItems.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No items in this order</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {editableItems.map((item, index) => (
                    <div
                      key={item.id}
                      className={`p-4 border rounded-lg ${
                        item.isNew ? 'border-green-300 bg-green-50' : 
                        item.isModified ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          <Package className="w-5 h-5 text-gray-400" />
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 flex items-center">
                              {item.product_name}
                              {item.isNew && <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">NEW</span>}
                              {item.isModified && !item.isNew && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">MODIFIED</span>}
                            </h4>
                            <p className="text-sm text-gray-600">
                              ₦{item.unit_price.toLocaleString('en-NG', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })} each
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => updateQuantity(index, item.quantity - 1)}
                              disabled={!permissions.canEditQuantities || item.quantity <= 1}
                              className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="font-medium text-gray-900 min-w-[3rem] text-center">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(index, item.quantity + 1)}
                              disabled={!permissions.canEditQuantities}
                              className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="text-right min-w-[6rem]">
                            <p className="font-semibold text-gray-900">
                              ₦{item.total_price.toLocaleString('en-NG', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </p>
                          </div>
                          {permissions.canRemoveItems && (
                            <button
                              type="button"
                              onClick={() => removeFromCart(index)}
                              className="p-1 text-red-500 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      {errors[`item_${index}`] && (
                        <div className="mt-2 flex items-center text-red-600">
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          <span className="text-sm">{errors[`item_${index}`]}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {errors.cart && <p className="text-red-500 text-sm mt-2">{errors.cart}</p>}
            </div>

            {/* Notes */}
            {permissions.canEditNotes && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add any additional notes for this order..."
                />
              </div>
            )}

            {/* Order Summary */}
            <div className="border-t pt-6">
              <div className="flex justify-between items-center text-xl font-bold">
                <span>Total Amount:</span>
                <span className="text-blue-600">
                  ₦{getTotalAmount().toLocaleString('en-NG', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              {getTotalAmount() !== order.total_amount && (
                <p className="text-sm text-gray-600 mt-1">
                  Original amount: ₦{order.total_amount.toLocaleString('en-NG', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              )}
            </div>

            {errors.submit && (
              <div className="text-red-600 text-sm flex items-center">
                <AlertTriangle className="w-4 h-4 mr-1" />
                {errors.submit}
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
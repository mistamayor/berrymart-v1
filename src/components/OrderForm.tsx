import React, { useState } from "react";
import { Customer, Product, SalesOrder, OrderItem } from "../types";
import { db } from "../lib/database";
import {
  ShoppingCart,
  User,
  Package,
  Plus,
  Minus,
  X,
  DollarSign,
  Radio,
  Search,
  ChevronDown,
} from "lucide-react";

interface OrderFormProps {
  customers: Customer[];
  products: Product[];
  onOrderAdded: (order: SalesOrder) => void;
  onClose: () => void;
  currentUser: { id: number; first_name: string; last_name: string };
}

interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export const OrderForm: React.FC<OrderFormProps> = ({
  customers,
  products,
  onOrderAdded,
  onClose,
  currentUser,
}) => {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedShipToAddress, setSelectedShipToAddress] = useState<CustomerAddress | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Filter customers based on search term
  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
      customer.type.toLowerCase().includes(customerSearchTerm.toLowerCase())
  );

  const getPrice = (product: Product, customerType: string) => {
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

  const addToCart = () => {
    if (!selectedCustomer || !selectedProduct) return;

    const unitPrice = getPrice(selectedProduct, selectedCustomer.type);
    const totalPrice = unitPrice * quantity;

    const existingItemIndex = cart.findIndex(
      (item) => item.product.id === selectedProduct.id
    );

    if (existingItemIndex >= 0) {
      const updatedCart = [...cart];
      updatedCart[existingItemIndex].quantity += quantity;
      updatedCart[existingItemIndex].totalPrice =
        updatedCart[existingItemIndex].quantity * unitPrice;
      setCart(updatedCart);
    } else {
      const newItem: CartItem = {
        product: selectedProduct,
        quantity,
        unitPrice,
        totalPrice,
      };
      setCart([...cart, newItem]);
    }

    setSelectedProduct(null);
    setQuantity(1);
  };

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearchTerm(customer.name);
    setShowCustomerDropdown(false);
    // Auto-select default address or first address
    const defaultAddress = customer.addresses.find(addr => addr.is_default);
    setSelectedShipToAddress(defaultAddress || customer.addresses[0] || null);
    setErrors((prev) => ({ ...prev, customer: "" }));
  };

  const handleCustomerSearchChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setCustomerSearchTerm(value);
    setShowCustomerDropdown(true);

    // Clear selected customer if search term doesn't match
    if (
      selectedCustomer &&
      !selectedCustomer.name.toLowerCase().includes(value.toLowerCase())
    ) {
      setSelectedCustomer(null);
      setSelectedShipToAddress(null);
    }
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const updatedCart = cart.map((item) => {
      if (item.product.id === productId) {
        return {
          ...item,
          quantity: newQuantity,
          totalPrice: newQuantity * item.unitPrice,
        };
      }
      return item;
    });
    setCart(updatedCart);
  };

  const getTotalAmount = () => {
    return cart.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!selectedCustomer) newErrors.customer = "Please select a customer";
    if (cart.length === 0)
      newErrors.cart = "Please add at least one item to the cart";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !selectedCustomer || !selectedShipToAddress) return;

    try {
      const orderData: Omit<SalesOrder, "id" | "created_at"> = {
        customer_id: selectedCustomer.id,
        customer_name: selectedCustomer.name,
        customer_type: selectedCustomer.type,
        ship_to_address_id: selectedShipToAddress.id,
        ship_to_address: `${selectedShipToAddress.address}, ${selectedShipToAddress.city}, ${selectedShipToAddress.state}, ${selectedShipToAddress.country} ${selectedShipToAddress.postal_code}`,
        total_amount: getTotalAmount(),
        status: "pending",
        notes,
        created_by: currentUser.id,
        created_by_name: `${currentUser.first_name} ${currentUser.last_name}`,
      };

      const orderItems: Omit<OrderItem, "id" | "order_id">[] = cart.map(
        (item) => ({
          product_id: item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total_price: item.totalPrice,
        })
      );

      const order = db.createOrder(orderData, orderItems);
      onOrderAdded(order);
      onClose();
    } catch (error) {
      console.error("Error creating order:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <ShoppingCart className="w-6 h-6 mr-2 text-blue-600" />
              Create New Order
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* Customer Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Customer *
              </label>
              <div
                className="relative"
                onBlur={() =>
                  setTimeout(() => setShowCustomerDropdown(false), 200)
                }
              >
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={customerSearchTerm}
                  onChange={handleCustomerSearchChange}
                  onFocus={() => setShowCustomerDropdown(true)}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.customer ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Search customers by name, email, or type..."
                />

                {/* Dropdown */}
                {showCustomerDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredCustomers.length > 0 ? (
                      filteredCustomers.map((customer) => (
                        <div
                          key={customer.id}
                          onClick={() => handleCustomerSelect(customer)}
                          className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">
                                {customer.name}
                              </p>
                              <p className="text-sm text-gray-600">
                                {customer.email}
                              </p>
                            </div>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                customer.type === "retail"
                                  ? "bg-blue-100 text-blue-800"
                                  : customer.type === "wholesale"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-orange-100 text-orange-800"
                              }`}
                            >
                              {customer.type.replace("_", " ")}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-gray-500 text-center">
                        No customers found
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Selected Customer Display */}
              {selectedCustomer && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-blue-900">
                        {selectedCustomer.name}
                      </p>
                      <p className="text-sm text-blue-700">
                        {selectedCustomer.email} •{" "}
                        {selectedCustomer.type.replace("_", " ")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCustomer(null);
                        setCustomerSearchTerm("");
                        setSelectedShipToAddress(null);
                      }}
                      className="text-blue-400 hover:text-blue-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {errors.customer && (
                <p className="text-red-500 text-sm mt-1">{errors.customer}</p>
              )}
            </div>

            {/* Customer Selection - Old dropdown code removed */}
            <div className="hidden">
              <div className="relative">
                <select>
                  <option value="">Choose a customer...</option>
                  {customers.map((customer) => (
                    <option
                      key={customer.id}
                      value={customer.id}
                    >
                      {customer.name} - {customer.type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Only show product selection and below if customer is selected */}
            {selectedCustomer && (
              <>
                {/* Ship-To Address Selection */}
                {selectedCustomer.addresses.length > 1 && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Ship-To Address
                    </h3>
                    <div className="space-y-3">
                      {selectedCustomer.addresses.map((address) => (
                        <div
                          key={address.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                            selectedShipToAddress?.id === address.id
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => setSelectedShipToAddress(address)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <input
                                type="radio"
                                checked={selectedShipToAddress?.id === address.id}
                                onChange={() => setSelectedShipToAddress(address)}
                                className="text-blue-600 focus:ring-blue-500"
                              />
                              <div>
                                <div className="font-medium text-gray-900">
                                  {address.address}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {address.city}, {address.state}, {address.country} {address.postal_code}
                                </div>
                              </div>
                            </div>
                            {address.is_default && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Default
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Single Address Display */}
                {selectedCustomer.addresses.length === 1 && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Ship-To Address
                    </h3>
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="font-medium text-gray-900">
                        {selectedCustomer.addresses[0].address}
                      </div>
                      <div className="text-sm text-gray-600">
                        {selectedCustomer.addresses[0].city}, {selectedCustomer.addresses[0].state}, {selectedCustomer.addresses[0].country} {selectedCustomer.addresses[0].postal_code}
                      </div>
                    </div>
                  </div>
                )}

                {/* Product Selection */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Add Products
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Product
                      </label>
                      <div className="relative">
                        <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <select
                          value={selectedProduct?.id || ""}
                          onChange={(e) => {
                            const product = products.find(
                              (p) => p.id === parseInt(e.target.value)
                            );
                            setSelectedProduct(product || null);
                          }}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Choose a product...</option>
                          {products.map((product) => (
                            <option
                              key={product.id}
                              value={product.id}
                            >
                              {product.name} - Stock: {product.stock_quantity}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) =>
                          setQuantity(parseInt(e.target.value) || 1)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit Price
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          value={
                            selectedProduct && selectedCustomer
                              ? `₦${getPrice(
                                  selectedProduct,
                                  selectedCustomer.type
                                ).toLocaleString("en-NG", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}`
                              : "₦0.00"
                          }
                          readOnly
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={addToCart}
                    disabled={!selectedProduct || !selectedCustomer}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add to Cart
                  </button>
                </div>

                {/* Cart */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Order Items
                  </h3>
                  {cart.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No items in cart
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {cart.map((item) => (
                        <div
                          key={item.product.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                        >
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">
                              {item.product.name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              ₦
                              {item.unitPrice.toLocaleString("en-NG", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}{" "}
                              each
                            </p>
                          </div>

                          <div className="flex items-center space-x-3">
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(
                                  item.product.id,
                                  item.quantity - 1
                                )
                              }
                              className="p-1 text-gray-400 hover:text-gray-600"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center font-medium">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(
                                  item.product.id,
                                  item.quantity + 1
                                )
                              }
                              className="p-1 text-gray-400 hover:text-gray-600"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex items-center space-x-3">
                            <span className="font-medium text-gray-900">
                              ₦
                              {item.totalPrice.toLocaleString("en-NG", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.product.id)}
                              className="p-1 text-red-400 hover:text-red-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {errors.cart && (
                    <p className="text-red-500 text-sm mt-1">{errors.cart}</p>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add any notes for this order..."
                  />
                </div>

                {/* Total */}
                <div className="border-t pt-6">
                  {/* Selected Ship-To Address Summary */}
                  {selectedShipToAddress && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-1">Ship To:</h4>
                      <div className="text-sm text-blue-800">
                        <div>{selectedShipToAddress.address}</div>
                        <div>{selectedShipToAddress.city}, {selectedShipToAddress.state}, {selectedShipToAddress.country} {selectedShipToAddress.postal_code}</div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center text-xl font-bold">
                    <span>Total Amount:</span>
                    <span className="text-blue-600">
                      ₦
                      {getTotalAmount().toLocaleString("en-NG", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Actions */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedCustomer || !selectedShipToAddress}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Order
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

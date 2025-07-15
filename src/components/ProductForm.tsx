import React, { useState } from "react";
import { Product } from "../types";
import { db } from "../lib/database";
import { Package, DollarSign, Hash, FileText, Boxes } from "lucide-react";

interface ProductFormProps {
  onProductAdded: (product: Product) => void;
  onClose: () => void;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  onProductAdded,
  onClose,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sku: "",
    base_price: "",
    retail_price: "",
    wholesale_price: "",
    open_market_price: "",
    stock_quantity: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Product name is required";
    if (!formData.sku.trim()) newErrors.sku = "SKU is required";
    if (!formData.base_price || parseFloat(formData.base_price) <= 0)
      newErrors.base_price = "Valid base price is required";
    if (!formData.retail_price || parseFloat(formData.retail_price) <= 0)
      newErrors.retail_price = "Valid retail price is required";
    if (!formData.wholesale_price || parseFloat(formData.wholesale_price) <= 0)
      newErrors.wholesale_price = "Valid wholesale price is required";
    if (
      !formData.open_market_price ||
      parseFloat(formData.open_market_price) <= 0
    )
      newErrors.open_market_price = "Valid open market price is required";
    if (!formData.stock_quantity || parseInt(formData.stock_quantity) < 0)
      newErrors.stock_quantity = "Valid stock quantity is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        const product = db.createProduct({
          name: formData.name,
          description: formData.description,
          sku: formData.sku,
          base_price: parseFloat(formData.base_price),
          retail_price: parseFloat(formData.retail_price),
          wholesale_price: parseFloat(formData.wholesale_price),
          open_market_price: parseFloat(formData.open_market_price),
          stock_quantity: parseInt(formData.stock_quantity),
        });
        onProductAdded(product);
        onClose();
      } catch (error) {
        console.error("Error creating product:", error);
      }
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <Package className="w-6 h-6 mr-2 text-blue-600" />
              Add New Product
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
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name
                </label>
                <div className="relative">
                  <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.name ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Enter product name"
                  />
                </div>
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SKU
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.sku ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Enter SKU"
                  />
                </div>
                {errors.sku && (
                  <p className="text-red-500 text-sm mt-1">{errors.sku}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter product description"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Base Price (₦)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="number"
                    name="base_price"
                    value={formData.base_price}
                    onChange={handleInputChange}
                    step="0.01"
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.base_price ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="0.00 (₦)"
                  />
                </div>
                {errors.base_price && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.base_price}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Retail Price (₦)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="number"
                    name="retail_price"
                    value={formData.retail_price}
                    onChange={handleInputChange}
                    step="0.01"
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.retail_price ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="0.00 (₦)"
                  />
                </div>
                {errors.retail_price && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.retail_price}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Wholesale Price (₦)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="number"
                    name="wholesale_price"
                    value={formData.wholesale_price}
                    onChange={handleInputChange}
                    step="0.01"
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.wholesale_price
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="0.00 (₦)"
                  />
                </div>
                {errors.wholesale_price && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.wholesale_price}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Open Market Price (₦)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="number"
                    name="open_market_price"
                    value={formData.open_market_price}
                    onChange={handleInputChange}
                    step="0.01"
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.open_market_price
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="0.00 (₦)"
                  />
                </div>
                {errors.open_market_price && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.open_market_price}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock Quantity
              </label>
              <div className="relative">
                <Boxes className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="number"
                  name="stock_quantity"
                  value={formData.stock_quantity}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.stock_quantity ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="0"
                />
              </div>
              {errors.stock_quantity && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.stock_quantity}
                </p>
              )}
            </div>

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
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Product
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

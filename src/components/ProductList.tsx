import React from "react";
import { Product } from "../types";
import { Package, Hash, DollarSign, Boxes, AlertTriangle } from "lucide-react";

interface ProductListProps {
  products: Product[];
}

export const ProductList: React.FC<ProductListProps> = ({ products }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
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

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No products yet
        </h3>
        <p className="text-gray-500">Add your first product to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Products</h2>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            In Stock: {products.filter((p) => p.stock_quantity >= 10).length}
          </span>
          <span className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
            Low Stock:{" "}
            {
              products.filter(
                (p) => p.stock_quantity < 10 && p.stock_quantity > 0
              ).length
            }
          </span>
          <span className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            Out of Stock:{" "}
            {products.filter((p) => p.stock_quantity === 0).length}
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => {
          const stockStatus = getStockStatus(product.stock_quantity);
          return (
            <div
              key={product.id}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{product.name}</h3>
                    <p className="text-sm text-gray-600 flex items-center">
                      <Hash className="w-3 h-3 mr-1" />
                      {product.sku}
                    </p>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stockStatus.bg} ${stockStatus.color}`}
                >
                  {product.stock_quantity < 10 && (
                    <AlertTriangle className="w-3 h-3 mr-1" />
                  )}
                  {stockStatus.label}
                </span>
              </div>

              {product.description && (
                <p className="text-sm text-gray-600 mb-4">
                  {product.description}
                </p>
              )}

              <div className="space-y-3 mb-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-gray-600">Retail</p>
                      <p className="font-medium">
                        ₦
                        {product.retail_price.toLocaleString("en-NG", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-gray-600">Wholesale</p>
                      <p className="font-medium">
                        ₦
                        {product.wholesale_price.toLocaleString("en-NG", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-gray-600">Open Market</p>
                      <p className="font-medium">
                        ₦
                        {product.open_market_price.toLocaleString("en-NG", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Boxes className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-gray-600">Stock</p>
                      <p className={`font-medium ${stockStatus.color}`}>
                        {product.stock_quantity}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Created: {formatDate(product.created_at)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from "react";
import { Product, StockThreshold } from "../types";
import { Package, Hash, DollarSign, Boxes, AlertTriangle, Search, X, Filter, Grid3X3, List, Eye } from "lucide-react";
import { auth } from "../lib/auth";
import { db } from "../lib/database";
import ProductView from "./ProductView";

interface ProductListProps {
  products: Product[];
  onProductUpdated?: (product: Product) => void;
}

type ViewMode = "grid" | "list";
type StockFilter = "all" | "in_stock" | "low_stock" | "out_of_stock";
type SortBy = "name" | "price" | "stock" | "created_at";

export const ProductList: React.FC<ProductListProps> = ({ products, onProductUpdated }) => {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("created_at");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductView, setShowProductView] = useState(false);
  const [stockThresholds, setStockThresholds] = useState<StockThreshold>({ low_stock: 10, critical_stock: 5 });

  useEffect(() => {
    setStockThresholds(db.getStockThresholds());
  }, []);
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
    if (quantity <= stockThresholds.critical_stock)
      return {
        color: "text-orange-600",
        bg: "bg-orange-100",
        label: "Critical Stock",
      };
    if (quantity <= stockThresholds.low_stock)
      return {
        color: "text-yellow-600",
        bg: "bg-yellow-100",
        label: "Low Stock",
      };
    return { color: "text-green-600", bg: "bg-green-100", label: "In Stock" };
  };

  // Filter and sort products
  const filteredAndSortedProducts = React.useMemo(() => {
    const filtered = products.filter((product) => {
      // Search filter
      const matchesSearch = 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase());

      // Stock filter
      const matchesStock = (() => {
        switch (stockFilter) {
          case "in_stock":
            return product.stock_quantity > stockThresholds.low_stock;
          case "low_stock":
            return product.stock_quantity <= stockThresholds.low_stock && product.stock_quantity > 0;
          case "out_of_stock":
            return product.stock_quantity === 0;
          default:
            return true;
        }
      })();

      return matchesSearch && matchesStock;
    });

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "price":
          return a.retail_price - b.retail_price;
        case "stock":
          return b.stock_quantity - a.stock_quantity;
        case "created_at":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return filtered;
  }, [products, searchTerm, stockFilter, sortBy]);

  const clearSearch = () => {
    setSearchTerm("");
  };

  const resetFilters = () => {
    setSearchTerm("");
    setStockFilter("all");
    setSortBy("created_at");
  };

  const canEditProduct = auth.hasPermission([
    "Admin",
    "Manager", 
    "Inventory",
  ]);

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowProductView(true);
  };

  const handleCloseProductView = () => {
    setSelectedProduct(null);
    setShowProductView(false);
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
    <div className="space-y-6">
      {/* Header with Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Products</h2>
          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
            <span className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              In Stock: {filteredAndSortedProducts.filter((p) => p.stock_quantity > stockThresholds.low_stock).length}
            </span>
            <span className="flex items-center">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
              Low Stock: {filteredAndSortedProducts.filter(
                (p) => p.stock_quantity <= stockThresholds.low_stock && p.stock_quantity > 0
              ).length}
            </span>
            <span className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              Out of Stock: {filteredAndSortedProducts.filter((p) => p.stock_quantity === 0).length}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              placeholder="Search products..."
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg border transition-colors ${
              showFilters || stockFilter !== "all" || sortBy !== "created_at"
                ? "bg-blue-50 border-blue-200 text-blue-600"
                : "bg-white border-gray-300 text-gray-600 hover:text-gray-900"
            }`}
            title="Toggle Filters"
          >
            <Filter className="w-4 h-4" />
          </button>

          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md transition-colors ${
                viewMode === "grid"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              title="Grid View"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md transition-colors ${
                viewMode === "list"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="stock-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Stock Status
              </label>
              <select
                id="stock-filter"
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value as StockFilter)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Products</option>
                <option value="in_stock">In Stock ({stockThresholds.low_stock + 1}+)</option>
                <option value="low_stock">Low Stock (1-{stockThresholds.low_stock})</option>
                <option value="out_of_stock">Out of Stock (0)</option>
              </select>
            </div>

            <div className="flex-1">
              <label htmlFor="sort-by" className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                id="sort-by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="created_at">Newest First</option>
                <option value="name">Name (A-Z)</option>
                <option value="price">Price (Low to High)</option>
                <option value="stock">Stock (High to Low)</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={resetFilters}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search Results Info */}
      {(searchTerm || stockFilter !== "all") && (
        <div className="text-sm text-gray-600">
          Showing {filteredAndSortedProducts.length} of {products.length} products
          {filteredAndSortedProducts.length !== products.length && (
            <button
              onClick={resetFilters}
              className="ml-2 text-blue-600 hover:text-blue-800 underline"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* No Results */}
      {filteredAndSortedProducts.length === 0 && (searchTerm || stockFilter !== "all") && (
        <div className="text-center py-12">
          <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No products found
          </h3>
          <p className="text-gray-500 mb-4">
            No products match your current filters.
          </p>
          <button
            onClick={resetFilters}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Clear filters to see all products
          </button>
        </div>
      )}

      {/* Grid View */}
      {viewMode === "grid" && filteredAndSortedProducts.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedProducts.map((product) => {
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
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stockStatus.bg} ${stockStatus.color}`}
                    >
                      {product.stock_quantity <= stockThresholds.low_stock && (
                        <AlertTriangle className="w-3 h-3 mr-1" />
                      )}
                      {stockStatus.label}
                    </span>
                    {canEditProduct && (
                      <button
                        onClick={() => handleViewProduct(product)}
                        className="p-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                        title="View Product"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                    )}
                  </div>
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
      )}

      {/* List View */}
      {viewMode === "list" && filteredAndSortedProducts.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pricing
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  {canEditProduct && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedProducts.map((product) => {
                  const stockStatus = getStockStatus(product.stock_quantity);
                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <Package className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {product.name}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <Hash className="w-3 h-3 mr-1" />
                              {product.sku}
                            </div>
                            {product.description && (
                              <div className="text-xs text-gray-400 mt-1 max-w-xs truncate">
                                {product.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center space-x-1 mb-1">
                            <span className="text-xs text-gray-500">R:</span>
                            <span>₦{product.retail_price.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-gray-500">W:</span>
                            <span>₦{product.wholesale_price.toLocaleString()}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${stockStatus.color}`}>
                          {product.stock_quantity}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stockStatus.bg} ${stockStatus.color}`}
                        >
                          {product.stock_quantity <= stockThresholds.low_stock && (
                            <AlertTriangle className="w-3 h-3 mr-1" />
                          )}
                          {stockStatus.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(product.created_at)}
                      </td>
                      {canEditProduct && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleViewProduct(product)}
                            className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors flex items-center"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Product View Modal */}
      {showProductView && selectedProduct && (
        <ProductView
          product={selectedProduct}
          onClose={handleCloseProductView}
          onProductUpdated={onProductUpdated}
        />
      )}
    </div>
  );
};

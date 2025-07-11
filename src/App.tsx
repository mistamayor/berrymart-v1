import React, { useState, useEffect, useRef } from "react";
import { Customer, Product, SalesOrder, User, AuthState } from "./types";
import { db } from "./lib/database";
import { auth } from "./lib/auth";
import { Login } from "./components/Login";
import { CustomerForm } from "./components/CustomerForm";
import { ProductForm } from "./components/ProductForm";
import { OrderForm } from "./components/OrderForm";
import { OrderList } from "./components/OrderList";
import { CustomerList } from "./components/CustomerList";
import { ProductList } from "./components/ProductList";
import { Dashboard } from "./components/Dashboard";
import { UserManagement } from "./components/UserManagement";
import {
  Users,
  Package,
  ShoppingCart,
  BarChart3,
  Plus,
  Home,
  Settings,
  LogOut,
  User as UserIcon,
  Bell,
  Truck,
} from "lucide-react";
import ProfilePage from "./components/ProfilePage";
import TransportList from "./components/TransportList";

type ActiveView =
  | "dashboard"
  | "orders"
  | "customers"
  | "products"
  | "users"
  | "profile"
  | "transport";

function App() {
  const [authState, setAuthState] = useState<AuthState>(auth.getAuthState());
  const [activeView, setActiveView] = useState<ActiveView>("dashboard");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] =
    useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true);
  const [vehicles, setVehicles] = useState<TransportVehicle[]>([]);

  // Refs for dropdowns
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const notificationDropdownRef = useRef<HTMLDivElement>(null);

  // Click-away and Escape key handler for dropdowns
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (
        showProfileDropdown &&
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setShowProfileDropdown(false);
      }
      if (
        showNotificationDropdown &&
        notificationDropdownRef.current &&
        !notificationDropdownRef.current.contains(event.target as Node)
      ) {
        setShowNotificationDropdown(false);
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShowProfileDropdown(false);
        setShowNotificationDropdown(false);
      }
    }
    if (showProfileDropdown || showNotificationDropdown) {
      document.addEventListener("mousedown", handleClick);
      document.addEventListener("keydown", handleKey);
    }
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [showProfileDropdown, showNotificationDropdown]);

  useEffect(() => {
    // Subscribe to auth changes
    const unsubscribe = auth.subscribe(setAuthState);

    if (authState.isAuthenticated) {
      loadData();
    }

    return unsubscribe;
  }, [authState.isAuthenticated]);

  const loadData = () => {
    setCustomers(db.getAllCustomers());
    setProducts(db.getAllProducts());
    setOrders(db.getAllOrders());
    setUsers(db.getAllUsers());
    setVehicles(db.getAllTransportVehicles());
  };

  const handleCustomerAdded = (customer: Customer) => {
    setCustomers((prev) => [customer, ...prev]);
  };

  const handleProductAdded = (product: Product) => {
    setProducts((prev) => [product, ...prev]);
  };

  const handleOrderAdded = (order: SalesOrder) => {
    setOrders((prev) => [order, ...prev]);
    loadData(); // Refresh all data
  };

  const handleOrderStatusChange = () => {
    loadData(); // Refresh all data when order status changes
  };

  const handleUserChange = () => {
    setUsers(db.getAllUsers());
  };

  const handleLogin = () => {
    setAuthState(auth.getAuthState());
    loadData();
  };

  const handleLogout = () => {
    auth.logout();
    setActiveView("dashboard");
  };

  // Show login if not authenticated
  if (!authState.isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const navigationItems = [
    { key: "dashboard", label: "Dashboard", icon: Home },
    { key: "orders", label: "Orders", icon: ShoppingCart },
    { key: "customers", label: "Customers", icon: Users },
    { key: "products", label: "Products", icon: Package },
    { key: "transport", label: "Transport", icon: Truck },
    ...(auth.hasPermission(["Admin"])
      ? [{ key: "users", label: "Users", icon: Settings }]
      : []),
  ];

  const renderActiveView = () => {
    switch (activeView) {
      case "dashboard":
        return (
          <Dashboard
            customers={customers}
            products={products}
            orders={orders}
          />
        );
      case "orders":
        return (
          <OrderList
            orders={orders}
            onStatusChange={handleOrderStatusChange}
            currentUser={{
              id: authState.user!.id,
              first_name: authState.user!.first_name,
              last_name: authState.user!.last_name,
            }}
          />
        );
      case "customers":
        return (
          <CustomerList
            customers={customers}
            currentUser={authState.user!}
          />
        );
      case "products":
        return <ProductList products={products} />;
      case "users":
        return auth.hasPermission(["Admin"]) ? (
          <UserManagement
            users={users}
            onUserChange={handleUserChange}
          />
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">
              Access denied. Admin privileges required.
            </p>
          </div>
        );
      case "profile":
        return authState.user ? <ProfilePage user={authState.user} /> : null;
      case "transport":
        return (
          <TransportList
            vehicles={vehicles}
            users={users}
            onVehicleChange={loadData}
          />
        );
      default:
        return (
          <Dashboard
            customers={customers}
            products={products}
            orders={orders}
          />
        );
    }
  };

  const canAddNew = () => {
    return (
      (activeView === "orders" ||
        activeView === "customers" ||
        activeView === "products") &&
      (activeView !== "orders" ||
        auth.hasPermission(["Admin", "Manager", "Sales"])) &&
      (activeView !== "customers" ||
        auth.hasPermission(["Admin", "Management", "Manager"])) &&
      (activeView !== "products" ||
        auth.hasPermission(["Admin", "Manager", "Inventory"]))
    );
  };

  const handleAddNew = () => {
    switch (activeView) {
      case "orders":
        setShowOrderForm(true);
        break;
      case "customers":
        setShowCustomerForm(true);
        break;
      case "products":
        setShowProductForm(true);
        break;
    }
  };

  const getAddButtonText = () => {
    switch (activeView) {
      case "orders":
        return "New Order";
      case "customers":
        return "New Customer";
      case "products":
        return "New Product";
      default:
        return "Add New";
    }
  };

  // Notification logic
  const userId = authState.user?.id;
  const userRole = authState.user?.role;
  // Orders needing approval (for Admin/Manager/Sales)
  const ordersToApprove = orders.filter((o) => o.status === "pending");
  // Orders for this user (if user is not Admin)
  const userOrders = orders.filter((o) => o.created_by === userId);
  // Status updates for user's orders
  const userOrderUpdates = userOrders.filter((o) =>
    ["approved", "dispatched", "delivered", "rejected"].includes(o.status)
  );
  // Combine notifications
  const notifications = [];
  if (
    auth.hasPermission(["Admin", "Manager", "Sales"]) &&
    ordersToApprove.length > 0
  ) {
    notifications.push({
      type: "approval",
      message: `You have ${ordersToApprove.length} order(s) to approve.`,
    });
  }
  userOrderUpdates.forEach((o) => {
    notifications.push({
      type: o.status,
      message: `Your order #${o.id} has been ${o.status}.`,
    });
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <BarChart3 className="w-8 h-8 text-blue-600" />
              <h1 className="ml-2 text-xl font-bold text-gray-900">
                Sales Order Management
              </h1>
              {authState.user && (
                <span className="ml-4 text-sm text-gray-600">
                  Welcome, {authState.user.username} ({authState.user.role})
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4 relative">
              {canAddNew() && (
                <button
                  onClick={handleAddNew}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {getAddButtonText()}
                </button>
              )}
              {/* Notification Icon */}
              <div
                className="relative"
                ref={notificationDropdownRef}
              >
                <button
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 relative"
                  onClick={() => {
                    setShowNotificationDropdown((v) => !v);
                    setHasUnreadNotifications(false);
                  }}
                  aria-label="Notifications"
                >
                  <Bell className="w-6 h-6 text-blue-600" />
                  {hasUnreadNotifications && notifications.length > 0 && (
                    <span className="absolute top-2 right-2 block w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </button>
                {/* Notification Dropdown */}
                {showNotificationDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="py-2 max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-2 text-gray-500 text-sm">
                          No notifications
                        </div>
                      ) : (
                        notifications.map((n, idx) => (
                          <div
                            key={idx}
                            className="px-4 py-2 text-gray-700 text-sm border-b last:border-b-0 flex items-center"
                          >
                            {/* Icon for type */}
                            {n.type === "approval" && (
                              <Bell className="w-4 h-4 text-yellow-500 mr-2" />
                            )}
                            {n.type === "approved" && (
                              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                            )}
                            {n.type === "dispatched" && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                            )}
                            {n.type === "delivered" && (
                              <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                            )}
                            {n.type === "rejected" && (
                              <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                            )}
                            {n.message}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              {/* Profile Icon - now at top right */}
              <div
                ref={profileDropdownRef}
                className="relative"
              >
                <button
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 relative"
                  onClick={() => setShowProfileDropdown((v) => !v)}
                  aria-label="Profile"
                >
                  <UserIcon className="w-6 h-6 text-blue-600" />
                </button>
                {/* Dropdown - opens below the icon */}
                {showProfileDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="py-2">
                      <button
                        className="w-full flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                        onClick={() => {
                          setShowProfileDropdown(false);
                          setActiveView("profile");
                        }}
                      >
                        <UserIcon className="w-4 h-4 mr-2" />
                        Profile
                      </button>
                      <button
                        className="w-full flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                        onClick={() => {
                          setShowProfileDropdown(false);
                          setActiveView("users");
                        }}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </button>
                      <button
                        className="w-full flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                        onClick={() => {
                          setShowProfileDropdown(false);
                          handleLogout();
                        }}
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <nav className="mb-8">
          <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm">
            {navigationItems.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveView(key as ActiveView)}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeView === key
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {label}
              </button>
            ))}
          </div>
        </nav>

        {/* Main Content */}
        <main>{renderActiveView()}</main>
      </div>

      {/* Modals */}
      {showCustomerForm && (
        <CustomerForm
          onCustomerAdded={handleCustomerAdded}
          onClose={() => setShowCustomerForm(false)}
        />
      )}

      {showProductForm && (
        <ProductForm
          onProductAdded={handleProductAdded}
          onClose={() => setShowProductForm(false)}
        />
      )}

      {showOrderForm && (
        <OrderForm
          customers={customers}
          products={products}
          onOrderAdded={handleOrderAdded}
          onClose={() => setShowOrderForm(false)}
          currentUser={{
            id: authState.user!.id,
            first_name: authState.user!.first_name,
            last_name: authState.user!.last_name,
          }}
        />
      )}
    </div>
  );
}

export default App;

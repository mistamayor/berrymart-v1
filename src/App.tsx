import React, { useState, useEffect, useRef } from "react";
import { Customer, Product, SalesOrder, User, AuthState, TransportVehicle } from "./types";
import { supabaseDb } from "./lib/supabaseDatabase";
import { supabaseAuth } from "./lib/supabaseAuth";
import { activityLogger } from "./lib/activityLogger";
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
  Shield,
} from "lucide-react";
import ProfilePage from "./components/ProfilePage";
import TransportList from "./components/TransportList";
import SettingsPage from "./components/SettingsPage";
import { OrderDetailsPage } from "./components/OrderDetailsPage";
import { NotificationProvider, useNotificationHelpers } from "./components/NotificationSystem";
import TransportForm from "./components/TransportForm";

type ActiveView =
  | "dashboard"
  | "orders"
  | "order-details"
  | "customers"
  | "products"
  | "users"
  | "profile"
  | "transport"
  | "settings";

function App() {
  return (
    <NotificationProvider>
      <AppContent />
    </NotificationProvider>
  );
}

function AppContent() {
  const [authState, setAuthState] = useState<AuthState>(supabaseAuth.getAuthState());
  const notify = useNotificationHelpers();
  const [activeView, setActiveView] = useState<ActiveView>("dashboard");
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  // const [orderListState, setOrderListState] = useState<any>(null); // Store filters/pagination state - TODO: implement
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showTransportForm, setShowTransportForm] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] =
    useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true);
  const [lastNotificationCheck, setLastNotificationCheck] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<TransportVehicle[]>([]);

  // Navigation with logging
  const handleNavigation = (view: ActiveView, orderId?: number) => {
    setActiveView(view)
    if (view === 'order-details' && orderId) {
      setSelectedOrderId(orderId)
    } else {
      setSelectedOrderId(null)
    }
    
    // Log page views
    const viewDescriptions: Record<ActiveView, string> = {
      dashboard: 'Dashboard',
      customers: 'Customer List',
      products: 'Product List', 
      orders: 'Order List',
      'order-details': 'Order Details',
      users: 'User Management',
      profile: 'User Profile',
      transport: 'Transport Management',
      settings: 'Settings'
    }
    
    const description = view === 'order-details' && orderId 
      ? `Viewed order #${orderId} details`
      : `Navigated to ${viewDescriptions[view]}`
    
    activityLogger.logView(view, orderId?.toString(), description)
  }
  
  // Navigation helper for order details
  const handleViewOrderDetails = (orderId: number) => {
    handleNavigation('order-details', orderId)
  }
  
  // Navigation helper to return to orders list
  const handleBackToOrders = () => {
    handleNavigation('orders')
  }

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
    const unsubscribe = supabaseAuth.subscribe(setAuthState);

    if (authState.isAuthenticated) {
      loadData();
      // Load notification state from localStorage
      try {
        const lastCheck = localStorage.getItem(`notifications_last_check_${authState.user?.id}`);
        setLastNotificationCheck(lastCheck);
      } catch (error) {
        console.error('Error loading notification state:', error);
        setLastNotificationCheck(null);
      }
    }

    return unsubscribe;
  }, [authState.isAuthenticated]);

  const loadData = async () => {
    try {
      const [customersData, productsData, ordersData, usersData, vehiclesData] = await Promise.all([
        supabaseDb.getAllCustomers(),
        supabaseDb.getAllProducts(),
        supabaseDb.getAllOrders(),
        supabaseDb.getAllUsers(),
        supabaseDb.getAllVehicles()
      ]);
      
      setCustomers(customersData);
      setProducts(productsData);
      setOrders(ordersData);
      setUsers(usersData);
      setVehicles(vehiclesData);
    } catch (error) {
      console.error('Error loading data:', error);
      notify.error('Failed to load data', 'Some data could not be loaded. Please refresh the page.');
    }
  };

  const handleCustomerAdded = (customer: Customer) => {
    loadData(); // Refresh all data to ensure consistency
    notify.success('Customer added', `${customer.name} has been successfully added`);
  };

  const handleCustomerUpdated = (_customer: Customer) => {
    loadData(); // Refresh all data to ensure consistency
  };

  const handleProductAdded = (product: Product) => {
    loadData(); // Refresh all data to ensure consistency
    notify.success('Product added', `${product.name} has been successfully added`);
  };

  const handleProductUpdated = (_product: Product) => {
    loadData(); // Refresh all data to ensure consistency
  };

  const handleOrderAdded = (order: SalesOrder) => {
    setOrders((prev) => [order, ...prev]);
    loadData(); // Refresh all data
  };

  const handleOrderStatusChange = () => {
    loadData(); // Refresh all data when order status changes
  };

  const handleUserChange = async () => {
    try {
      const usersData = await supabaseDb.getAllUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
      notify.error('Failed to load users', 'User data could not be loaded');
    }
  };

  const handleLogin = () => {
    const authState = supabaseAuth.getAuthState();
    setAuthState(authState);
    if (authState.user) {
      notify.success('Welcome back!', `Good to see you, ${authState.user.first_name}`);
    }
    loadData();
  };

  const handleLogout = async () => {
    try {
      await supabaseAuth.signOut();
      notify.info('Signed out', 'You have been successfully signed out');
      handleNavigation("dashboard");
    } catch (_error) {
      notify.error('Sign out failed', 'An error occurred while signing out');
    }
  };

  // Notification logic with memoization (moved before early returns)
  const notifications = React.useMemo(() => {
    try {
      const userId = authState.user?.id;
      const notificationList: Array<{
        type: string;
        message: string;
        id: string;
        timestamp: number;
      }> = [];
    
      // Orders needing approval (for Admin/Manager/Sales)
      const ordersToApprove = orders.filter((o) => o.status === "pending");
      if (
        supabaseAuth.hasPermission(["Admin", "Manager", "Sales"]) &&
        ordersToApprove.length > 0
      ) {
        notificationList.push({
          type: "approval",
          message: `You have ${ordersToApprove.length} order(s) to approve.`,
          id: `approval-${ordersToApprove.length}`,
          timestamp: ordersToApprove.length > 0 
            ? Math.max(...ordersToApprove.map(o => new Date(o.created_at).getTime()))
            : Date.now(),
        });
      }
      
      // Orders for this user (if user is not Admin)
      const userOrders = orders.filter((o) => o.created_by === userId);
      // Status updates for user's orders
      const userOrderUpdates = userOrders.filter((o) =>
        ["approved", "dispatched", "delivered", "rejected"].includes(o.status)
      );
      
      userOrderUpdates.forEach((o) => {
        const timestamp = new Date(
          o.status === "approved" ? (o.approved_at || o.created_at) :
          o.status === "dispatched" ? (o.dispatched_at || o.created_at) :
          o.status === "delivered" ? (o.delivered_at || o.created_at) :
          o.status === "rejected" ? (o.cancelled_at || o.created_at) :
          o.created_at
        ).getTime();
        
        notificationList.push({
          type: o.status,
          message: `Your order #${o.id} has been ${o.status}.`,
          id: `order-${o.id}-${o.status}`,
          timestamp,
        });
      });
      
      return notificationList;
    } catch (error) {
      console.error('Error generating notifications:', error);
      return [];
    }
  }, [orders, authState.user?.id]);

  // Check if there are new notifications since last check
  useEffect(() => {
    try {
      if (lastNotificationCheck && notifications.length > 0) {
        const lastCheckTime = parseInt(lastNotificationCheck);
        if (!isNaN(lastCheckTime)) {
          const hasNewNotifications = notifications.some(n => n.timestamp > lastCheckTime);
          setHasUnreadNotifications(hasNewNotifications);
        } else {
          setHasUnreadNotifications(true);
        }
      } else if (notifications.length > 0) {
        setHasUnreadNotifications(true);
      } else {
        setHasUnreadNotifications(false);
      }
    } catch (error) {
      console.error('Error checking notifications:', error);
      setHasUnreadNotifications(notifications.length > 0);
    }
  }, [notifications, lastNotificationCheck]);

  const markNotificationsAsRead = () => {
    try {
      const now = Date.now().toString();
      if (authState.user?.id) {
        localStorage.setItem(`notifications_last_check_${authState.user.id}`, now);
        setLastNotificationCheck(now);
      }
      setHasUnreadNotifications(false);
    } catch (error) {
      console.error('Error saving notification state:', error);
      setHasUnreadNotifications(false);
    }
  };

  // Show loading state
  if (authState.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="p-4 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-sm font-medium">Loading BerryMart...</p>
            <p className="text-gray-400 text-xs mt-1">Please wait while we set things up</p>
          </div>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!authState.isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Login onLogin={handleLogin} />
      </div>
    );
  }

  const navigationItems = [
    { key: "dashboard", label: "Dashboard", icon: Home },
    { key: "orders", label: "Orders", icon: ShoppingCart },
    { key: "customers", label: "Customers", icon: Users },
    { key: "products", label: "Products", icon: Package },
    { key: "transport", label: "Transport", icon: Truck },
    ...(supabaseAuth.hasPermission(["Admin"])
      ? [{ key: "users", label: "User Management", icon: Shield }]
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
            onViewOrderDetails={handleViewOrderDetails}
            currentUser={{
              id: authState.user!.id,
              first_name: authState.user!.first_name,
              last_name: authState.user!.last_name,
            }}
          />
        );
      case "order-details":
        return selectedOrderId ? (
          <OrderDetailsPage
            orderId={selectedOrderId}
            onBack={handleBackToOrders}
            onOrderUpdated={handleOrderStatusChange}
            currentUser={{
              id: authState.user!.id,
              first_name: authState.user!.first_name,
              last_name: authState.user!.last_name,
              role: authState.user!.role,
            }}
          />
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">Order not found</p>
            <button
              onClick={handleBackToOrders}
              className="mt-2 text-blue-600 hover:text-blue-800 underline"
            >
              Back to Orders
            </button>
          </div>
        );
      case "customers":
        return (
          <CustomerList
            customers={customers}
            currentUser={authState.user!}
            onCustomerUpdated={handleCustomerUpdated}
          />
        );
      case "products":
        return <ProductList products={products} onProductUpdated={handleProductUpdated} />;
      case "users":
        return supabaseAuth.hasPermission(["Admin"]) ? (
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
        return authState.user ? (
          <ProfilePage 
            user={authState.user} 
            onUserUpdate={(updatedUser) => {
              setAuthState(prev => ({ ...prev, user: updatedUser }));
            }} 
          />
        ) : null;
      case "settings":
        return authState.user ? (
          <SettingsPage 
            user={authState.user}
            onNavigateToUsers={() => handleNavigation("users")}
            onNavigateToProfile={() => handleNavigation("profile")}
          />
        ) : null;
      case "transport":
        return (
          <TransportList
            vehicles={vehicles}
            users={users}
            onVehicleChange={loadData}
            showTransportForm={showTransportForm}
            onCloseTransportForm={() => setShowTransportForm(false)}
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
        activeView === "products" ||
        activeView === "transport") &&
      (activeView !== "orders" ||
        supabaseAuth.hasPermission(["Admin", "Manager", "Sales"])) &&
      (activeView !== "customers" ||
        supabaseAuth.hasPermission(["Admin", "Management", "Manager"])) &&
      (activeView !== "products" ||
        supabaseAuth.hasPermission(["Admin", "Manager", "Inventory"])) &&
      (activeView !== "transport" ||
        supabaseAuth.hasPermission(["Admin", "Manager"]))
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
      case "transport":
        setShowTransportForm(true);
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
      case "transport":
        return "New Transport";
      default:
        return "Add New";
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    BerryMart
                  </h1>
                  <p className="text-xs text-gray-500">Sales Order Management</p>
                </div>
              </div>
              
              {/* Breadcrumbs */}
              <div className="hidden md:flex items-center space-x-2 ml-8">
                <Home className="w-4 h-4 text-gray-400" />
                <span className="text-gray-400">/</span>
                {activeView === 'order-details' ? (
                  <>
                    <button 
                      onClick={handleBackToOrders}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      Orders
                    </button>
                    <span className="text-gray-400">/</span>
                    <span className="text-sm font-medium text-gray-700">
                      Order #{selectedOrderId}
                    </span>
                  </>
                ) : (
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {activeView === 'dashboard' ? 'Dashboard' : 
                     activeView === 'customers' ? 'Customers' :
                     activeView === 'products' ? 'Products' :
                     activeView === 'orders' ? 'Orders' :
                     activeView === 'users' ? 'User Management' :
                     activeView === 'transport' ? 'Transport' :
                     activeView === 'profile' ? 'Profile' :
                     activeView === 'settings' ? 'Settings' : activeView}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {/* User info - shown on larger screens */}
              {authState.user && (
                <div className="hidden lg:block text-right">
                  <p className="text-sm font-medium text-gray-700">
                    {authState.user.first_name} {authState.user.last_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {authState.user.role}
                  </p>
                </div>
              )}
              
              {canAddNew() && (
                <button
                  onClick={handleAddNew}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg hover:shadow-xl"
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
                  className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100/80 hover:bg-gray-200/80 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                  onClick={() => {
                    setShowNotificationDropdown((v) => !v);
                    if (!showNotificationDropdown) {
                      markNotificationsAsRead();
                    }
                  }}
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5 text-gray-600" />
                  {hasUnreadNotifications && notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
                      {notifications.length}
                    </span>
                  )}
                </button>
                {/* Notification Dropdown */}
                {showNotificationDropdown && (
                  <div className="absolute right-0 top-full mt-3 w-80 bg-white rounded-xl shadow-xl border border-gray-200/50 z-50 backdrop-blur-md">
                    <div className="p-4 border-b border-gray-100">
                      <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                      {notifications.length > 0 && (
                        <p className="text-xs text-gray-500">
                          {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center">
                          <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-500 text-sm">No notifications</p>
                        </div>
                      ) : (
                        notifications.map((n, idx) => (
                          <div
                            key={idx}
                            className="px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors duration-150"
                          >
                            <div className="flex items-start space-x-3">
                              {/* Icon for type */}
                              <div className="flex-shrink-0 mt-1">
                                {n.type === "approval" && (
                                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                )}
                                {n.type === "approved" && (
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                )}
                                {n.type === "dispatched" && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                )}
                                {n.type === "delivered" && (
                                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                )}
                                {n.type === "rejected" && (
                                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-700 leading-relaxed">{n.message}</p>
                                <p className="text-xs text-gray-400 mt-1">Just now</p>
                              </div>
                            </div>
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
                  className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-lg"
                  onClick={() => setShowProfileDropdown((v) => !v)}
                  aria-label="Profile"
                >
                  {authState.user?.profile_picture ? (
                    <img
                      src={authState.user.profile_picture}
                      alt="Profile"
                      className="w-8 h-8 rounded-lg object-cover"
                    />
                  ) : (
                    <UserIcon className="w-5 h-5 text-white" />
                  )}
                </button>
                {/* Dropdown - opens below the icon */}
                {showProfileDropdown && (
                  <div className="absolute right-0 top-full mt-3 w-56 bg-white rounded-xl shadow-xl border border-gray-200/50 z-50 backdrop-blur-md">
                    {/* User info header */}
                    {authState.user && (
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">
                          {authState.user.first_name} {authState.user.last_name}
                        </p>
                        <p className="text-xs text-gray-500">{authState.user.email}</p>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                          {authState.user.role}
                        </span>
                      </div>
                    )}
                    
                    <div className="py-2">
                      <button
                        className="w-full flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                        onClick={() => {
                          setShowProfileDropdown(false);
                          handleNavigation("profile");
                        }}
                      >
                        <UserIcon className="w-4 h-4 mr-3 text-gray-400" />
                        <span className="text-sm">My Profile</span>
                      </button>
                      <button
                        className="w-full flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                        onClick={() => {
                          setShowProfileDropdown(false);
                          handleNavigation("settings");
                        }}
                      >
                        <Settings className="w-4 h-4 mr-3 text-gray-400" />
                        <span className="text-sm">Settings</span>
                      </button>
                      <hr className="my-1" />
                      <button
                        className="w-full flex items-center px-4 py-2 text-red-600 hover:bg-red-50 transition-colors duration-150"
                        onClick={() => {
                          setShowProfileDropdown(false);
                          handleLogout();
                        }}
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        <span className="text-sm">Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Navigation */}
        <nav className="mb-8">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-2 shadow-lg border border-gray-200/50 overflow-x-auto scrollbar-hide">
            <div className="flex space-x-1 min-w-max">
              {navigationItems.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => handleNavigation(key as ActiveView)}
                  className={`flex items-center px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 flex-shrink-0 ${
                    activeView === key
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/70"
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="relative">
          <div className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 min-h-[calc(100vh-300px)]">
            <div className="p-6">
              {renderActiveView()}
            </div>
          </div>
        </main>
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

      {showTransportForm && (
        <TransportForm
          users={users}
          onAdded={loadData}
          onClose={() => setShowTransportForm(false)}
        />
      )}
    </div>
  );
}

export default App;

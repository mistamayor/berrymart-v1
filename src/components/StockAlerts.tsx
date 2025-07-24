import React, { useState, useEffect } from "react";
import { StockAlert, StockThreshold } from "../types";
import { db } from "../lib/database";
import { auth } from "../lib/auth";
import {
  AlertTriangle,
  XCircle,
  Package,
  Settings,
  Check,
  X,
  Bell
} from "lucide-react";

interface StockAlertsProps {
  onClose?: () => void;
  compact?: boolean; // For dashboard display
}

const getAlertColor = (level: string) => {
  switch (level) {
    case "out_of_stock":
      return {
        bg: "bg-red-100",
        text: "text-red-800",
        border: "border-red-200",
        icon: "text-red-600"
      };
    case "critical":
      return {
        bg: "bg-orange-100", 
        text: "text-orange-800",
        border: "border-orange-200",
        icon: "text-orange-600"
      };
    case "low":
      return {
        bg: "bg-yellow-100",
        text: "text-yellow-800", 
        border: "border-yellow-200",
        icon: "text-yellow-600"
      };
    default:
      return {
        bg: "bg-gray-100",
        text: "text-gray-800",
        border: "border-gray-200",
        icon: "text-gray-600"
      };
  }
};

const getAlertIcon = (level: string) => {
  switch (level) {
    case "out_of_stock":
      return <XCircle className="w-5 h-5" />;
    case "critical":
    case "low":
      return <AlertTriangle className="w-5 h-5" />;
    default:
      return <Bell className="w-5 h-5" />;
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

export const StockAlerts: React.FC<StockAlertsProps> = ({ onClose, compact = false }) => {
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [thresholds, setThresholds] = useState<StockThreshold>({ low_stock: 10, critical_stock: 5 });
  const [tempThresholds, setTempThresholds] = useState<StockThreshold>({ low_stock: 10, critical_stock: 5 });

  useEffect(() => {
    loadAlerts();
    loadThresholds();
  }, []);

  const loadAlerts = () => {
    if (compact) {
      setAlerts(db.getActiveStockAlerts().slice(0, 5)); // Show only top 5 for dashboard
    } else {
      setAlerts(db.getAllStockAlerts());
    }
  };

  const loadThresholds = () => {
    const currentThresholds = db.getStockThresholds();
    setThresholds(currentThresholds);
    setTempThresholds(currentThresholds);
  };

  const canManageInventory = auth.hasPermission(["Admin", "Manager", "Inventory"]);

  const handleAcknowledgeAlert = (alertId: number) => {
    const currentUser = auth.getAuthState().user;
    if (!currentUser) return;

    const success = db.acknowledgeStockAlert(
      alertId, 
      `${currentUser.first_name} ${currentUser.last_name}`
    );
    
    if (success) {
      loadAlerts();
    }
  };

  const handleUpdateThresholds = () => {
    db.updateStockThresholds(tempThresholds);
    setThresholds(tempThresholds);
    setShowSettings(false);
    
    // Regenerate alerts with new thresholds
    db.generateStockAlerts();
    loadAlerts();
  };

  const activeAlerts = alerts.filter(alert => !alert.acknowledged);
  const acknowledgedAlerts = alerts.filter(alert => alert.acknowledged);

  if (compact) {
    // Compact view for dashboard
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
            Stock Alerts
          </h3>
          {activeAlerts.length > 0 && (
            <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {activeAlerts.length}
            </span>
          )}
        </div>

        {activeAlerts.length === 0 ? (
          <div className="text-center py-4">
            <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No active stock alerts</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activeAlerts.map((alert) => {
              const colors = getAlertColor(alert.alert_level);
              const icon = getAlertIcon(alert.alert_level);
              
              return (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border ${colors.bg} ${colors.border}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-2">
                      <div className={colors.icon}>
                        {icon}
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${colors.text}`}>
                          {alert.product_name}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {alert.alert_level === "out_of_stock" 
                            ? "Out of stock" 
                            : `${alert.current_stock} units remaining`}
                        </p>
                      </div>
                    </div>
                    {canManageInventory && (
                      <button
                        onClick={() => handleAcknowledgeAlert(alert.id)}
                        className="ml-2 p-1 text-gray-400 hover:text-gray-600"
                        title="Acknowledge Alert"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Full view modal
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <AlertTriangle className="w-7 h-7 mr-2 text-orange-500" />
              Stock Alerts Management
            </h2>
            <div className="flex items-center space-x-2">
              {canManageInventory && (
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                  title="Alert Settings"
                >
                  <Settings className="w-5 h-5" />
                </button>
              )}
              {onClose && (
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  <X className="w-6 h-6" />
                </button>
              )}
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings && canManageInventory && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Alert Thresholds</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Low Stock Threshold
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={tempThresholds.low_stock}
                    onChange={(e) => setTempThresholds(prev => ({
                      ...prev,
                      low_stock: parseInt(e.target.value) || 10
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Alert when stock falls below this number</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Critical Stock Threshold
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={tempThresholds.low_stock - 1}
                    value={tempThresholds.critical_stock}
                    onChange={(e) => setTempThresholds(prev => ({
                      ...prev,
                      critical_stock: parseInt(e.target.value) || 5
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Critical alert when stock falls below this number</p>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setTempThresholds(thresholds);
                    setShowSettings(false);
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateThresholds}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* Active Alerts */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Active Alerts ({activeAlerts.length})
              </h3>
            </div>

            {activeAlerts.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Active Alerts</h4>
                <p className="text-gray-500">All products are adequately stocked</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {activeAlerts.map((alert) => {
                  const colors = getAlertColor(alert.alert_level);
                  const icon = getAlertIcon(alert.alert_level);
                  
                  return (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-lg border ${colors.bg} ${colors.border}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className={colors.icon}>
                            {icon}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <p className={`font-semibold ${colors.text}`}>
                                {alert.product_name}
                              </p>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors.bg} ${colors.text}`}>
                                {alert.alert_level.replace('_', ' ').toUpperCase()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {alert.alert_level === "out_of_stock" 
                                ? "Product is completely out of stock" 
                                : `Only ${alert.current_stock} units remaining (threshold: ${alert.threshold})`}
                            </p>
                            <p className="text-xs text-gray-500">
                              Alert created: {formatDate(alert.created_at)}
                            </p>
                          </div>
                        </div>
                        {canManageInventory && (
                          <button
                            onClick={() => handleAcknowledgeAlert(alert.id)}
                            className="ml-4 px-3 py-1 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 text-sm flex items-center"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Acknowledge
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Acknowledged Alerts */}
          {acknowledgedAlerts.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Recently Acknowledged ({acknowledgedAlerts.length})
              </h3>
              <div className="space-y-2">
                {acknowledgedAlerts.slice(0, 10).map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-gray-900">{alert.product_name}</span>
                        <span className="text-sm text-gray-500">
                          ({alert.alert_level.replace('_', ' ')})
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Acknowledged by {alert.acknowledged_by} on {formatDate(alert.acknowledged_at!)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockAlerts;
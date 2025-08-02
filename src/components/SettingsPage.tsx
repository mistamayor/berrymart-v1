import React, { useState } from 'react';
import { User } from '../types';
import { supabaseAuth } from '../lib/supabaseAuth';
import { activityLogger } from '../lib/activityLogger';
import ActivityLogViewer from './ActivityLogViewer';
import {
  Settings,
  User as UserIcon,
  Users,
  Shield,
  Bell,
  Database,
  Download,
  Upload,
  Palette,
  Globe,
  Clock,
  Save,
  FileText,
  Package,
} from 'lucide-react';

interface SettingsPageProps {
  user: User;
  onNavigateToUsers: () => void;
  onNavigateToProfile: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ 
  user, 
  onNavigateToUsers, 
  onNavigateToProfile 
}) => {
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      orderUpdates: true,
      lowStock: true,
    },
    display: {
      theme: 'light',
      language: 'en',
      timezone: 'Africa/Lagos',
      dateFormat: 'DD/MM/YYYY',
    },
    preferences: {
      defaultCurrency: 'NGN',
      autoSave: true,
      confirmActions: true,
    },
    stock: {
      thresholds: {
        critical_stock: 5,
        low_stock: 10,
      },
      behavior: {
        prevent_overselling: true,
        auto_generate_alerts: true,
        show_stock_in_orders: true,
      },
      notifications: {
        notify_on_low_stock: true,
        notify_on_critical_stock: true,
        notify_on_out_of_stock: true,
      },
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showActivityLogs, setShowActivityLogs] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const handleSettingChange = (category: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [key]: value
      }
    }));
  };

  const handleNestedSettingChange = (category: string, subcategory: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [subcategory]: {
          ...(prev[category as keyof typeof prev] as any)[subcategory],
          [key]: value
        }
      }
    }));
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, you'd save these to the database
      // For now, we'll just simulate a save
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaveMessage('Settings saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      setSaveMessage('Failed to save settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const settingSections = [
    {
      title: 'Account',
      icon: UserIcon,
      items: [
        {
          title: 'My Profile',
          description: 'Update your personal information and profile picture',
          action: (
            <button
              onClick={onNavigateToProfile}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Edit Profile
            </button>
          )
        },
        ...(supabaseAuth.hasPermission(['Admin']) ? [{
          title: 'User Management',
          description: 'Manage users, roles, and permissions',
          action: (
            <button
              onClick={onNavigateToUsers}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Manage Users
            </button>
          )
        }] : []),
        ...(supabaseAuth.hasPermission(['Admin']) ? [{
          title: 'Activity Logs',
          description: 'View system activity and user actions',
          action: (
            <button
              onClick={() => setShowActivityLogs(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <FileText size={16} />
              View Logs
            </button>
          )
        }] : [])
      ]
    },
    {
      title: 'Notifications',
      icon: Bell,
      items: [
        {
          title: 'Email Notifications',
          description: 'Receive updates via email',
          action: (
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.email}
                onChange={(e) => handleSettingChange('notifications', 'email', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          )
        },
        {
          title: 'Order Updates',
          description: 'Get notified when order status changes',
          action: (
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.orderUpdates}
                onChange={(e) => handleSettingChange('notifications', 'orderUpdates', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          )
        },
        {
          title: 'Low Stock Alerts',
          description: 'Receive alerts when inventory is running low',
          action: (
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.lowStock}
                onChange={(e) => handleSettingChange('notifications', 'lowStock', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          )
        }
      ]
    },
    {
      title: 'Display & Language',
      icon: Palette,
      items: [
        {
          title: 'Theme',
          description: 'Choose your preferred color theme',
          action: (
            <select
              value={settings.display.theme}
              onChange={(e) => handleSettingChange('display', 'theme', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto</option>
            </select>
          )
        },
        {
          title: 'Language',
          description: 'Select your preferred language',
          action: (
            <select
              value={settings.display.language}
              onChange={(e) => handleSettingChange('display', 'language', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="en">English</option>
              <option value="ha">Hausa</option>
              <option value="yo">Yoruba</option>
              <option value="ig">Igbo</option>
            </select>
          )
        },
        {
          title: 'Timezone',
          description: 'Set your local timezone',
          action: (
            <select
              value={settings.display.timezone}
              onChange={(e) => handleSettingChange('display', 'timezone', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Africa/Lagos">West Africa Time (WAT)</option>
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time</option>
            </select>
          )
        }
      ]
    },
    {
      title: 'Preferences',
      icon: Settings,
      items: [
        {
          title: 'Default Currency',
          description: 'Choose your default currency for orders',
          action: (
            <select
              value={settings.preferences.defaultCurrency}
              onChange={(e) => handleSettingChange('preferences', 'defaultCurrency', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="NGN">Nigerian Naira (₦)</option>
              <option value="USD">US Dollar ($)</option>
              <option value="EUR">Euro (€)</option>
              <option value="GBP">British Pound (£)</option>
            </select>
          )
        },
        {
          title: 'Auto-save',
          description: 'Automatically save changes as you type',
          action: (
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.preferences.autoSave}
                onChange={(e) => handleSettingChange('preferences', 'autoSave', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          )
        },
        {
          title: 'Confirm Actions',
          description: 'Show confirmation dialogs for important actions',
          action: (
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.preferences.confirmActions}
                onChange={(e) => handleSettingChange('preferences', 'confirmActions', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          )
        }
      ]
    },
    {
      title: 'Stock Management',
      icon: Package,
      items: [
        {
          title: 'Critical Stock Threshold',
          description: 'Alert when stock reaches this level (out of stock warning)',
          action: (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                value={settings.stock.thresholds.critical_stock}
                onChange={(e) => handleNestedSettingChange('stock', 'thresholds', 'critical_stock', parseInt(e.target.value) || 0)}
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">units</span>
            </div>
          )
        },
        {
          title: 'Low Stock Threshold',
          description: 'Alert when stock falls below this level (reorder warning)',
          action: (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="500"
                value={settings.stock.thresholds.low_stock}
                onChange={(e) => handleNestedSettingChange('stock', 'thresholds', 'low_stock', parseInt(e.target.value) || 0)}
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">units</span>
            </div>
          )
        },
        {
          title: 'Prevent Overselling',
          description: 'Block orders when insufficient stock is available',
          action: (
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.stock.behavior.prevent_overselling}
                onChange={(e) => handleNestedSettingChange('stock', 'behavior', 'prevent_overselling', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          )
        },
        {
          title: 'Auto-Generate Stock Alerts',
          description: 'Automatically create alerts when thresholds are reached',
          action: (
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.stock.behavior.auto_generate_alerts}
                onChange={(e) => handleNestedSettingChange('stock', 'behavior', 'auto_generate_alerts', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          )
        },
        {
          title: 'Show Stock in Orders',
          description: 'Display available stock quantities in order forms',
          action: (
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.stock.behavior.show_stock_in_orders}
                onChange={(e) => handleNestedSettingChange('stock', 'behavior', 'show_stock_in_orders', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          )
        },
        {
          title: 'Low Stock Notifications',
          description: 'Receive notifications when stock reaches low threshold',
          action: (
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.stock.notifications.notify_on_low_stock}
                onChange={(e) => handleNestedSettingChange('stock', 'notifications', 'notify_on_low_stock', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          )
        },
        {
          title: 'Critical Stock Notifications',
          description: 'Receive urgent notifications when stock reaches critical threshold',
          action: (
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.stock.notifications.notify_on_critical_stock}
                onChange={(e) => handleNestedSettingChange('stock', 'notifications', 'notify_on_critical_stock', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          )
        },
        {
          title: 'Out of Stock Notifications',
          description: 'Receive notifications when products are completely out of stock',
          action: (
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.stock.notifications.notify_on_out_of_stock}
                onChange={(e) => handleNestedSettingChange('stock', 'notifications', 'notify_on_out_of_stock', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          )
        }
      ]
    }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8 mt-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Settings className="w-8 h-8 mr-3 text-blue-600" />
            Settings
          </h1>
          <p className="text-gray-600 mt-2">Manage your account preferences and application settings</p>
        </div>
        <button
          onClick={handleSaveSettings}
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {isLoading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div className={`mb-6 p-4 rounded-lg ${
          saveMessage.includes('successfully') 
            ? 'bg-green-50 border border-green-200 text-green-700' 
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {saveMessage}
        </div>
      )}

      {/* Settings Sections */}
      <div className="space-y-8">
        {settingSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center mb-6">
              <section.icon className="w-6 h-6 text-blue-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">{section.title}</h2>
            </div>
            
            <div className="space-y-4">
              {section.items.map((item, itemIndex) => (
                <div key={itemIndex} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{item.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                  </div>
                  <div className="ml-4">
                    {item.action}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Account Information */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">Account Information</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>Name:</strong> {user.first_name} {user.last_name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Role:</strong> {user.role}</p>
          <p><strong>Member since:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Activity Log Modal */}
      {showActivityLogs && (
        <ActivityLogViewer onClose={() => setShowActivityLogs(false)} />
      )}
    </div>
  );
};

export default SettingsPage;
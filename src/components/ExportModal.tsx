import React, { useState } from "react";
import { SalesOrder, User } from "../types";
import { exportService, ExportOptions } from "../lib/exportService";
import {
  Download,
  X,
  FileText,
  Calendar,
  Users,
  Package,
  Settings,
  AlertTriangle,
  Info,
  Loader,
} from "lucide-react";

interface ExportModalProps {
  orders: SalesOrder[];
  scope: 'selected' | 'filtered' | 'all';
  onClose: () => void;
  currentUser: User;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  orders,
  scope,
  onClose,
  currentUser,
}) => {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    scope,
    includeItems: false,
    includeCustomerDetails: false,
    includeTimestamps: true,
  });
  const [isExporting, setIsExporting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const permissions = exportService.getExportPermissions(currentUser.role);

  const getScopeDescription = () => {
    switch (scope) {
      case 'selected':
        return `${orders.length} selected orders`;
      case 'filtered':
        return `${orders.length} filtered orders`;
      case 'all':
        return `${orders.length} total orders`;
      default:
        return `${orders.length} orders`;
    }
  };

  const getFormatDescription = (format: string) => {
    switch (format) {
      case 'csv':
        return 'Universal format compatible with Excel, Google Sheets, and most business tools';
      case 'excel':
        return 'Native Excel format with advanced formatting (Coming Soon)';
      case 'pdf':
        return 'Professional document format for reports and archiving (Coming Soon)';
      default:
        return '';
    }
  };

  const validateOptions = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (orders.length === 0) {
      newErrors.orders = 'No orders available for export';
    }

    if (orders.length > 10000) {
      newErrors.size = 'Large dataset detected. Consider filtering to reduce export size.';
    }

    if (!permissions.canExportCustomerDetails && exportOptions.includeCustomerDetails) {
      newErrors.permissions = 'You do not have permission to export customer details';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleExport = async () => {
    if (!validateOptions()) return;

    setIsExporting(true);
    try {
      let blob: Blob;
      
      switch (exportOptions.format) {
        case 'csv':
          blob = await exportService.exportToCSV(orders, exportOptions, currentUser);
          break;
        case 'excel':
          // TODO: Implement Excel export
          throw new Error('Excel export is not yet implemented');
        case 'pdf':
          // TODO: Implement PDF export
          throw new Error('PDF export is not yet implemented');
        default:
          throw new Error(`Unsupported export format: ${exportOptions.format}`);
      }

      const filename = exportService.generateFilename(exportOptions, scope);
      exportService.downloadFile(blob, filename);
      
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      setErrors({ export: 'Export failed. Please try again.' });
    } finally {
      setIsExporting(false);
    }
  };

  const totalAmount = orders.reduce((sum, order) => sum + order.total_amount, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center">
              <Download className="w-7 h-7 mr-2 text-blue-600" />
              Export Orders
            </h3>
            <button
              onClick={onClose}
              disabled={isExporting}
              className="text-gray-400 hover:text-gray-600 text-2xl disabled:cursor-not-allowed"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Export Summary */}
          <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-200">
            <div className="flex items-start">
              <Info className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h5 className="font-medium text-blue-800">Export Summary</h5>
                <p className="text-sm text-blue-700 mt-1">
                  Preparing to export {getScopeDescription()}
                </p>
                <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                  <div>
                    <span className="font-medium">Total Value:</span>
                    <span className="ml-2 font-semibold text-blue-800">
                      ₦{totalAmount.toLocaleString('en-NG', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Your Role:</span>
                    <span className="ml-2 font-semibold text-blue-800">{currentUser.role}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Export Options */}
          <div className="space-y-6">
            {/* Format Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Export Format
              </label>
              <div className="space-y-3">
                {(['csv', 'excel', 'pdf'] as const).map((format) => (
                  <label key={format} className="flex items-start space-x-3">
                    <input
                      type="radio"
                      name="format"
                      value={format}
                      checked={exportOptions.format === format}
                      onChange={(e) => 
                        setExportOptions(prev => ({ ...prev, format: e.target.value as any }))
                      }
                      disabled={format !== 'csv'} // Only CSV is implemented
                      className="w-4 h-4 text-blue-600 mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 mr-2 text-gray-400" />
                        <span className={`font-medium ${format !== 'csv' ? 'text-gray-400' : 'text-gray-900'}`}>
                          {format.toUpperCase()}
                          {format !== 'csv' && <span className="ml-2 text-xs text-gray-500">(Coming Soon)</span>}
                        </span>
                      </div>
                      <p className={`text-sm mt-1 ${format !== 'csv' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {getFormatDescription(format)}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Export Detail Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Package className="w-4 h-4 inline mr-1" />
                Detail Level
              </label>
              <div className="space-y-3">
                <label className="flex items-start space-x-3">
                  <input
                    type="radio"
                    name="includeItems"
                    checked={!exportOptions.includeItems}
                    onChange={() => 
                      setExportOptions(prev => ({ ...prev, includeItems: false }))
                    }
                    className="w-4 h-4 text-blue-600 mt-1"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Order Summary</div>
                    <p className="text-sm text-gray-600">One row per order with totals</p>
                  </div>
                </label>
                <label className="flex items-start space-x-3">
                  <input
                    type="radio"
                    name="includeItems"
                    checked={exportOptions.includeItems}
                    onChange={() => 
                      setExportOptions(prev => ({ ...prev, includeItems: true }))
                    }
                    className="w-4 h-4 text-blue-600 mt-1"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Detailed with Items</div>
                    <p className="text-sm text-gray-600">One row per order item (larger file)</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Additional Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Settings className="w-4 h-4 inline mr-1" />
                Additional Options
              </label>
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeTimestamps}
                    onChange={(e) => 
                      setExportOptions(prev => ({ ...prev, includeTimestamps: e.target.checked }))
                    }
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="text-gray-900">Include all timestamps</span>
                  </div>
                </label>
                
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeCustomerDetails}
                    onChange={(e) => 
                      setExportOptions(prev => ({ ...prev, includeCustomerDetails: e.target.checked }))
                    }
                    disabled={!permissions.canExportCustomerDetails}
                    className="w-4 h-4 text-blue-600 rounded disabled:opacity-50"
                  />
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-2 text-gray-400" />
                    <span className={`${!permissions.canExportCustomerDetails ? 'text-gray-400' : 'text-gray-900'}`}>
                      Include customer contact details
                      {!permissions.canExportCustomerDetails && 
                        <span className="ml-2 text-xs text-gray-500">(No permission)</span>
                      }
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Permission Warnings */}
            {!permissions.canExportAll && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <h5 className="font-medium text-amber-800">Limited Access</h5>
                    <p className="text-sm text-amber-700 mt-1">
                      Your role ({currentUser.role}) has restricted export permissions. 
                      {currentUser.role === 'Sales' && ' You can only export orders you created.'}
                      {permissions.maxHistoryMonths > 0 && 
                        ` Historical data is limited to ${permissions.maxHistoryMonths} months.`
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Messages */}
            {Object.entries(errors).map(([key, message]) => (
              <div key={key} className="text-red-600 text-sm flex items-center">
                <AlertTriangle className="w-4 h-4 mr-1" />
                {message}
              </div>
            ))}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                disabled={isExporting}
                className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting || Object.keys(errors).length > 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isExporting ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export {exportOptions.format.toUpperCase()}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
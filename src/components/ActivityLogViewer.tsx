import React, { useState, useEffect } from 'react'
import { activityLogger } from '../lib/activityLogger'
import { supabaseAuth } from '../lib/supabaseAuth'

interface ActivityLog {
  id: number
  user_id: number | null
  user_email: string
  user_name: string
  action_type: string
  resource_type: string | null
  resource_id: string | null
  action_description: string
  details: Record<string, any> | null
  ip_address: string | null
  user_agent: string | null
  session_id: string | null
  created_at: string
  users?: {
    first_name: string
    last_name: string
    email: string
    role: string
  } | null
}

interface ActivityLogViewerProps {
  onClose?: () => void
}

const ActivityLogViewer: React.FC<ActivityLogViewerProps> = ({ onClose }) => {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState({
    action_type: '',
    resource_type: '',
    user_id: '',
    start_date: '',
    end_date: '',
    search: ''
  })

  const pageSize = 50
  const isAdmin = supabaseAuth.getAuthState().user?.role === 'Admin'

  useEffect(() => {
    if (!isAdmin) {
      setError('Unauthorized: Admin access required')
      setLoading(false)
      return
    }
    
    fetchLogs()
  }, [currentPage, filters, isAdmin])

  const fetchLogs = async () => {
    if (!isAdmin) return

    setLoading(true)
    setError(null)

    try {
      const filterParams: any = {
        limit: pageSize,
        offset: (currentPage - 1) * pageSize
      }

      if (filters.action_type) filterParams.action_type = filters.action_type
      if (filters.resource_type) filterParams.resource_type = filters.resource_type
      if (filters.user_id) filterParams.user_id = parseInt(filters.user_id)
      if (filters.start_date) filterParams.start_date = new Date(filters.start_date)
      if (filters.end_date) filterParams.end_date = new Date(filters.end_date)

      const { data, error, count } = await activityLogger.getActivityLogs(filterParams)

      if (error) {
        setError(error.message || 'Failed to fetch activity logs')
        return
      }

      let filteredData = data || []

      // Apply client-side search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        filteredData = filteredData.filter(log => 
          log.action_description.toLowerCase().includes(searchLower) ||
          log.user_name.toLowerCase().includes(searchLower) ||
          log.user_email.toLowerCase().includes(searchLower) ||
          (log.resource_type && log.resource_type.toLowerCase().includes(searchLower))
        )
      }

      setLogs(filteredData)
      setTotalCount(count || 0)
    } catch (err) {
      setError('Failed to fetch activity logs')
      console.error('Activity log fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
    setCurrentPage(1) // Reset to first page when filters change
  }

  const clearFilters = () => {
    setFilters({
      action_type: '',
      resource_type: '',
      user_id: '',
      start_date: '',
      end_date: '',
      search: ''
    })
    setCurrentPage(1)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getActionTypeColor = (actionType: string) => {
    const colors: Record<string, string> = {
      login: 'bg-green-100 text-green-800',
      logout: 'bg-gray-100 text-gray-800',
      create: 'bg-blue-100 text-blue-800',
      update: 'bg-yellow-100 text-yellow-800',
      delete: 'bg-red-100 text-red-800',
      view: 'bg-purple-100 text-purple-800',
      export: 'bg-indigo-100 text-indigo-800',
      inactivity_timeout: 'bg-orange-100 text-orange-800',
      failed_login: 'bg-red-100 text-red-800',
      password_change: 'bg-teal-100 text-teal-800',
      profile_update: 'bg-cyan-100 text-cyan-800',
      invite_user: 'bg-emerald-100 text-emerald-800'
    }
    return colors[actionType] || 'bg-gray-100 text-gray-800'
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  if (!isAdmin) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-96">
          <h2 className="text-xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-700 mb-4">Only administrators can view activity logs.</p>
          <button
            onClick={onClose}
            className="w-full bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-7xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Activity Logs</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
            <input
              type="text"
              placeholder="Search..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            />
            
            <select
              value={filters.action_type}
              onChange={(e) => handleFilterChange('action_type', e.target.value)}
              className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Actions</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="view">View</option>
              <option value="export">Export</option>
              <option value="inactivity_timeout">Inactivity Timeout</option>
              <option value="failed_login">Failed Login</option>
              <option value="password_change">Password Change</option>
              <option value="profile_update">Profile Update</option>
              <option value="invite_user">Invite User</option>
            </select>

            <select
              value={filters.resource_type}
              onChange={(e) => handleFilterChange('resource_type', e.target.value)}
              className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Resources</option>
              <option value="customer">Customer</option>
              <option value="product">Product</option>
              <option value="order">Order</option>
              <option value="vehicle">Vehicle</option>
              <option value="user">User</option>
            </select>

            <input
              type="date"
              placeholder="Start Date"
              value={filters.start_date}
              onChange={(e) => handleFilterChange('start_date', e.target.value)}
              className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            />

            <input
              type="date"
              placeholder="End Date"
              value={filters.end_date}
              onChange={(e) => handleFilterChange('end_date', e.target.value)}
              className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            />

            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Clear Filters
            </button>
          </div>

          <div className="text-sm text-gray-600">
            Showing {logs.length} of {totalCount} total records
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-lg text-gray-600">Loading activity logs...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-lg text-red-600">{error}</div>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-lg text-gray-600">No activity logs found</div>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="bg-white border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionTypeColor(log.action_type)}`}>
                          {log.action_type.replace('_', ' ').toUpperCase()}
                        </span>
                        {log.resource_type && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                            {log.resource_type}
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          {formatDate(log.created_at)}
                        </span>
                      </div>
                      
                      <div className="text-sm font-medium text-gray-900 mb-1">
                        {log.action_description}
                      </div>
                      
                      <div className="text-xs text-gray-600">
                        <span className="font-medium">{log.user_name}</span> 
                        ({log.user_email})
                        {log.resource_id && (
                          <span className="ml-2">• ID: {log.resource_id}</span>
                        )}
                        {log.session_id && (
                          <span className="ml-2">• Session: {log.session_id.slice(-8)}</span>
                        )}
                      </div>

                      {log.details && Object.keys(log.details).length > 0 && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-xs text-blue-600 hover:text-blue-800">
                            View Details
                          </summary>
                          <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-6 border-t bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-gray-300 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-400"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 bg-gray-300 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-400"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ActivityLogViewer
import { supabase } from './supabase'
import { supabaseAuth } from './supabaseAuth'

export interface ActivityLogEntry {
  user_id?: number | null
  user_email: string
  user_name: string
  action_type: 'login' | 'logout' | 'create' | 'update' | 'delete' | 'view' | 'export' | 'inactivity_timeout' | 'password_change' | 'profile_update' | 'invite_user' | 'failed_login'
  resource_type?: string | null
  resource_id?: string | null
  action_description: string
  details?: Record<string, any> | null
  ip_address?: string | null
  user_agent?: string | null
  session_id?: string | null
}

class ActivityLogger {
  private sessionId: string | null = null
  private isEnabled: boolean = true

  constructor() {
    this.generateSessionId()
    this.setupAuthStateListener()
  }

  private generateSessionId(): void {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private setupAuthStateListener(): void {
    // Listen for auth state changes to generate new session IDs
    supabaseAuth.subscribe((authState) => {
      if (authState.isAuthenticated && !this.sessionId) {
        this.generateSessionId()
      } else if (!authState.isAuthenticated && this.sessionId) {
        this.sessionId = null
      }
    })
  }

  private getBrowserInfo(): { ip_address?: string; user_agent?: string } {
    try {
      return {
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        // IP address would be populated by backend/proxy headers in production
        ip_address: undefined
      }
    } catch {
      return {}
    }
  }

  private getCurrentUser(): { user_id?: number; user_email: string; user_name: string } {
    const authState = supabaseAuth.getAuthState()
    
    if (authState.user && authState.isAuthenticated) {
      return {
        user_id: authState.user.id,
        user_email: authState.user.email,
        user_name: `${authState.user.first_name} ${authState.user.last_name}`
      }
    }
    
    // For login attempts or other cases where user might not be authenticated yet
    return {
      user_email: 'unknown@system',
      user_name: 'System/Unknown User'
    }
  }

  async log(entry: Partial<ActivityLogEntry> & { action_type: ActivityLogEntry['action_type']; action_description: string }): Promise<void> {
    if (!this.isEnabled) return

    try {
      const currentUser = this.getCurrentUser()
      const browserInfo = this.getBrowserInfo()

      const logEntry: ActivityLogEntry = {
        ...currentUser,
        ...entry,
        ...browserInfo,
        session_id: this.sessionId,
        details: entry.details ? {
          ...entry.details,
          timestamp: new Date().toISOString(),
          url: typeof window !== 'undefined' ? window.location.pathname : undefined
        } : null
      }

      const { error } = await supabase
        .from('activity_logs')
        .insert(logEntry)

      if (error) {
        console.error('Failed to log activity:', error)
        // Don't throw error - logging failures shouldn't break the app
      }
    } catch (error) {
      console.error('Activity logging error:', error)
      // Don't throw error - logging failures shouldn't break the app
    }
  }

  // Convenience methods for common actions
  async logLogin(email: string, success: boolean = true): Promise<void> {
    await this.log({
      action_type: success ? 'login' : 'failed_login',
      action_description: success ? `User ${email} logged in successfully` : `Failed login attempt for ${email}`,
      user_email: email,
      user_name: email.split('@')[0], // Fallback name
      details: { success, login_method: 'email_password' }
    })
  }

  async logLogout(reason: 'manual' | 'inactivity' = 'manual'): Promise<void> {
    const actionType = reason === 'inactivity' ? 'inactivity_timeout' : 'logout'
    const description = reason === 'inactivity' 
      ? 'User logged out due to inactivity timeout' 
      : 'User logged out manually'

    await this.log({
      action_type: actionType,
      action_description: description,
      details: { logout_reason: reason }
    })
  }

  async logCreate(resourceType: string, resourceId: string, description: string, details?: Record<string, any>): Promise<void> {
    await this.log({
      action_type: 'create',
      resource_type: resourceType,
      resource_id: resourceId,
      action_description: description,
      details
    })
  }

  async logUpdate(resourceType: string, resourceId: string, description: string, details?: Record<string, any>): Promise<void> {
    await this.log({
      action_type: 'update',
      resource_type: resourceType,
      resource_id: resourceId,
      action_description: description,
      details
    })
  }

  async logDelete(resourceType: string, resourceId: string, description: string, details?: Record<string, any>): Promise<void> {
    await this.log({
      action_type: 'delete',
      resource_type: resourceType,
      resource_id: resourceId,
      action_description: description,
      details
    })
  }

  async logView(resourceType: string, resourceId?: string, description?: string): Promise<void> {
    await this.log({
      action_type: 'view',
      resource_type: resourceType,
      resource_id: resourceId,
      action_description: description || `Viewed ${resourceType}${resourceId ? ` (ID: ${resourceId})` : ' list'}`,
      details: { view_type: resourceId ? 'detail' : 'list' }
    })
  }

  async logExport(resourceType: string, description: string, details?: Record<string, any>): Promise<void> {
    await this.log({
      action_type: 'export',
      resource_type: resourceType,
      action_description: description,
      details: { ...details, export_timestamp: new Date().toISOString() }
    })
  }

  async logPasswordChange(success: boolean = true): Promise<void> {
    await this.log({
      action_type: 'password_change',
      action_description: success ? 'Password changed successfully' : 'Password change failed',
      details: { success }
    })
  }

  async logProfileUpdate(fields: string[], success: boolean = true): Promise<void> {
    await this.log({
      action_type: 'profile_update',
      resource_type: 'user',
      action_description: success 
        ? `Profile updated: ${fields.join(', ')}` 
        : 'Profile update failed',
      details: { updated_fields: fields, success }
    })
  }

  async logUserInvite(invitedEmail: string, role: string, success: boolean = true): Promise<void> {
    await this.log({
      action_type: 'invite_user',
      resource_type: 'user',
      action_description: success 
        ? `Invited user ${invitedEmail} with role ${role}` 
        : `Failed to invite user ${invitedEmail}`,
      details: { invited_email: invitedEmail, invited_role: role, success }
    })
  }

  // Admin-only method to retrieve activity logs
  async getActivityLogs(
    filters?: {
      user_id?: number
      action_type?: string
      resource_type?: string
      start_date?: Date
      end_date?: Date
      limit?: number
      offset?: number
    }
  ): Promise<{ data: any[] | null; error: any; count?: number }> {
    try {
      // Check if current user is admin
      const authState = supabaseAuth.getAuthState()
      if (!authState.user || authState.user.role !== 'Admin') {
        return { data: null, error: { message: 'Unauthorized: Admin access required' } }
      }

      let query = supabase
        .from('activity_logs')
        .select(`
          *,
          users:user_id (
            first_name,
            last_name,
            email,
            role
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters?.user_id) {
        query = query.eq('user_id', filters.user_id)
      }
      if (filters?.action_type) {
        query = query.eq('action_type', filters.action_type)
      }
      if (filters?.resource_type) {
        query = query.eq('resource_type', filters.resource_type)
      }
      if (filters?.start_date) {
        query = query.gte('created_at', filters.start_date.toISOString())
      }
      if (filters?.end_date) {
        query = query.lte('created_at', filters.end_date.toISOString())
      }

      // Apply pagination
      if (filters?.limit) {
        query = query.limit(filters.limit)
      }
      if (filters?.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 50)) - 1)
      }

      const result = await query

      return {
        data: result.data,
        error: result.error,
        count: result.count || 0
      }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Method to enable/disable logging (useful for maintenance)
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled
  }

  // Get current session ID
  getSessionId(): string | null {
    return this.sessionId
  }
}

// Export singleton instance
export const activityLogger = new ActivityLogger()
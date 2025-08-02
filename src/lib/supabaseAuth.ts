import { supabase } from './supabase'
import type { User } from '../types'
import { activityLogger } from './activityLogger'

export interface AuthState {
  isAuthenticated: boolean
  user: User | null
  loading: boolean
}

class SupabaseAuthManager {
  private authState: AuthState = {
    isAuthenticated: false,
    user: null,
    loading: true
  }

  private listeners: ((state: AuthState) => void)[] = []
  private inactivityTimer: NodeJS.Timeout | null = null
  private lastActivityTime: number = Date.now()
  private readonly INACTIVITY_TIMEOUT = 6 * 60 * 60 * 1000 // 6 hours in milliseconds

  constructor() {
    this.initialize()
    this.setupInactivityTracking()
  }

  private async initialize() {
    // Get initial session
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Error getting session:', error)
      this.setAuthState({ isAuthenticated: false, user: null, loading: false })
      return
    }

    if (session?.user) {
      await this.handleAuthenticatedUser(session.user.email!)
    } else {
      this.setAuthState({ isAuthenticated: false, user: null, loading: false })
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await this.handleAuthenticatedUser(session.user.email!)
      } else if (event === 'SIGNED_OUT') {
        this.setAuthState({ isAuthenticated: false, user: null, loading: false })
      }
    })
  }

  private setupInactivityTracking() {
    // Track user activity events
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    const updateActivity = () => {
      this.lastActivityTime = Date.now()
      this.resetInactivityTimer()
    }

    // Add event listeners for activity tracking
    activityEvents.forEach(event => {
      document.addEventListener(event, updateActivity, true)
    })

    // Check for inactivity every minute
    setInterval(() => {
      this.checkInactivity()
    }, 60000) // Check every minute
  }

  private resetInactivityTimer() {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer)
    }

    // Only set timer if user is authenticated
    if (this.authState.isAuthenticated) {
      this.inactivityTimer = setTimeout(() => {
        this.handleInactivityTimeout()
      }, this.INACTIVITY_TIMEOUT)
    }
  }

  private checkInactivity() {
    if (!this.authState.isAuthenticated) return

    const timeSinceLastActivity = Date.now() - this.lastActivityTime
    
    if (timeSinceLastActivity >= this.INACTIVITY_TIMEOUT) {
      this.handleInactivityTimeout()
    }
  }

  private async handleInactivityTimeout() {
    console.log('User inactive for 6 hours, signing out...')
    
    // Log the inactivity timeout
    await activityLogger.logLogout('inactivity')
    
    // Clear the timer
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer)
      this.inactivityTimer = null
    }

    // Sign out the user
    await this.signOut()
    
    // Optional: Show a notification to the user
    if (typeof window !== 'undefined') {
      alert('You have been signed out due to inactivity. Please sign in again.')
    }
  }

  private async handleAuthenticatedUser(email: string) {
    try {
      console.log('Fetching user profile for:', email)
      
      // Fetch user directly from Supabase to avoid circular dependency
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        
        // If it's a policy error, the user might exist but RLS is blocking access
        if (error.code === 'PGRST301' || error.message.includes('policy')) {
          console.error('RLS Policy blocking access - user may need proper permissions')
          // Don't sign out immediately, give user a chance to fix permissions
          this.setAuthState({ isAuthenticated: false, user: null, loading: false })
        } else {
          // Other errors, sign out
          await supabase.auth.signOut()
          this.setAuthState({ isAuthenticated: false, user: null, loading: false })
        }
        return
      }

      if (user && user.is_active) {
        console.log('User profile loaded successfully:', user.first_name, user.last_name, user.role)
        this.setAuthState({ isAuthenticated: true, user, loading: false })
        // Reset activity tracking for newly authenticated user
        this.lastActivityTime = Date.now()
        this.resetInactivityTimer()
        
        // Log successful authentication
        await activityLogger.logLogin(email, true)
      } else {
        // User not found in our users table or inactive
        console.error('User not found or inactive:', user)
        await supabase.auth.signOut()
        this.setAuthState({ isAuthenticated: false, user: null, loading: false })
      }
    } catch (error) {
      console.error('Error in handleAuthenticatedUser:', error)
      await supabase.auth.signOut()
      this.setAuthState({ isAuthenticated: false, user: null, loading: false })
    }
  }

  private setAuthState(newState: AuthState) {
    this.authState = newState
    this.listeners.forEach(listener => listener(newState))
  }

  // Public methods
  getAuthState(): AuthState {
    return this.authState
  }

  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener)
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  async signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Attempting to sign in with email:', email)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        console.error('Supabase auth error:', error)
        // Log failed login attempt
        await activityLogger.logLogin(email, false)
        return { success: false, error: error.message }
      }

      if (data.user) {
        console.log('Supabase auth successful, fetching user profile...')
        await this.handleAuthenticatedUser(email)
        console.log('User profile fetched, login complete')
        // Start inactivity tracking for newly signed in user
        this.lastActivityTime = Date.now()
        this.resetInactivityTimer()
        return { success: true }
      }

      console.error('No user data returned from Supabase')
      return { success: false, error: 'Authentication failed' }
    } catch (error) {
      console.error('Sign in error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  async signOut(): Promise<void> {
    // Log manual logout (if not already logged by inactivity timeout)
    if (this.authState.isAuthenticated) {
      await activityLogger.logLogout('manual')
    }
    
    // Clear inactivity timer on sign out
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer)
      this.inactivityTimer = null
    }
    
    await supabase.auth.signOut()
    this.setAuthState({ isAuthenticated: false, user: null, loading: false })
  }

  async signUp(email: string, password: string, userData: {
    first_name: string
    last_name: string
    role: string
  }): Promise<{ success: boolean; error?: string }> {
    try {
      // First create the auth user
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password
      })

      if (authError) {
        return { success: false, error: authError.message }
      }

      if (!data.user) {
        return { success: false, error: 'Failed to create user' }
      }

      // Then create the user record in our users table
      try {
        await supabaseDb.createUser({
          email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          role: userData.role as any,
          is_active: true
        })

        return { success: true }
      } catch (dbError) {
        console.error('Error creating user record:', dbError)
        // Clean up auth user if database creation fails
        await supabase.auth.admin.deleteUser(data.user.id)
        return { success: false, error: 'Failed to create user profile' }
      }
    } catch (error) {
      console.error('Sign up error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  async updateProfile(updates: Partial<User>): Promise<{ success: boolean; error?: string }> {
    if (!this.authState.user) {
      return { success: false, error: 'Not authenticated' }
    }

    try {
      const updatedUser = await supabaseDb.updateUser(this.authState.user.id, updates)
      this.setAuthState({
        ...this.authState,
        user: updatedUser
      })
      
      // Log profile update
      const updatedFields = Object.keys(updates)
      await activityLogger.logProfileUpdate(updatedFields, true)
      
      return { success: true }
    } catch (error) {
      console.error('Profile update error:', error)
      
      // Log failed profile update
      const updatedFields = Object.keys(updates)
      await activityLogger.logProfileUpdate(updatedFields, false)
      
      return { success: false, error: 'Failed to update profile' }
    }
  }

  async changePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        // Log failed password change
        await activityLogger.logPasswordChange(false)
        return { success: false, error: error.message }
      }

      // Log successful password change
      await activityLogger.logPasswordChange(true)
      return { success: true }
    } catch (error) {
      console.error('Password change error:', error)
      // Log failed password change
      await activityLogger.logPasswordChange(false)
      return { success: false, error: 'Failed to change password' }
    }
  }

  async inviteUser(email: string, userData: {
    first_name: string
    last_name: string
    role: string
    department?: string
    phone?: string
    manager_id?: number
  }): Promise<{ success: boolean; error?: string; userId?: number }> {
    try {
      // First create the user record in our database
      const { data: userRecord, error: dbError } = await supabase
        .from('users')
        .insert({
          email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          role: userData.role as any,
          is_active: true,
          department: userData.department || null,
          phone: userData.phone || null,
          manager_id: userData.manager_id || null,
        })
        .select()
        .single()

      if (dbError) {
        return { success: false, error: dbError.message }
      }

      // Send invitation email via Supabase Auth
      // Note: In production, you'd configure email templates in Supabase dashboard
      const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
        data: {
          first_name: userData.first_name,
          last_name: userData.last_name,
          role: userData.role,
          user_id: userRecord.id,
        },
        redirectTo: `${window.location.origin}/auth/accept-invite`
      })

      if (inviteError) {
        // If invitation fails, clean up the user record
        await supabase.from('users').delete().eq('id', userRecord.id)
        
        // Log failed user invitation
        await activityLogger.logUserInvite(email, userData.role, false)
        
        return { success: false, error: inviteError.message }
      }

      // Log successful user invitation
      await activityLogger.logUserInvite(email, userData.role, true)

      return { success: true, userId: userRecord.id }
    } catch (error) {
      console.error('User invitation error:', error)
      
      // Log failed user invitation
      await activityLogger.logUserInvite(email, userData.role, false)
      
      return { success: false, error: 'Failed to invite user' }
    }
  }

  // Permission methods (same as before, but using current user)
  hasPermission(allowedRoles: string[]): boolean {
    if (!this.authState.user) return false
    return allowedRoles.includes(this.authState.user.role)
  }

  canApproveOrders(): boolean {
    return this.hasPermission(['Admin', 'Manager'])
  }

  canManageInventory(): boolean {
    return this.hasPermission(['Admin', 'Manager', 'Inventory'])
  }

  canManageUsers(): boolean {
    return this.hasPermission(['Admin'])
  }

  canManageVehicles(): boolean {
    return this.hasPermission(['Admin', 'Manager'])
  }

  canViewAllOrders(): boolean {
    return this.hasPermission(['Admin', 'Manager', 'Accounts', 'Inventory'])
  }

  canEditOrder(order: { created_by: number; status: string }): boolean {
    if (!this.authState.user) return false
    
    // Admin and Manager can edit any order
    if (this.hasPermission(['Admin', 'Manager'])) return true
    
    // Sales can edit their own pending orders
    if (this.authState.user.role === 'Sales') {
      return order.created_by === this.authState.user.id && order.status === 'pending'
    }
    
    return false
  }

  canCancelOrder(order: { created_by: number; status: string }): boolean {
    if (!this.authState.user) return false
    
    // Admin and Manager can cancel any order
    if (this.hasPermission(['Admin', 'Manager'])) return true
    
    // Sales can cancel their own pending orders
    if (this.authState.user.role === 'Sales') {
      return order.created_by === this.authState.user.id && order.status === 'pending'
    }
    
    return false
  }

  canExportOrders(): boolean {
    return this.hasPermission(['Admin', 'Manager', 'Accounts', 'Sales', 'Inventory'])
  }

  getCurrentUserId(): number | null {
    return this.authState.user?.id || null
  }

  getCurrentUserRole(): string | null {
    return this.authState.user?.role || null
  }

  getCurrentUserName(): string {
    if (!this.authState.user) return 'Unknown'
    return `${this.authState.user.first_name} ${this.authState.user.last_name}`
  }

  // Development/testing methods
  getTimeUntilInactivityTimeout(): number {
    if (!this.authState.isAuthenticated) return 0
    const timeSinceLastActivity = Date.now() - this.lastActivityTime
    const remainingTime = this.INACTIVITY_TIMEOUT - timeSinceLastActivity
    return Math.max(0, remainingTime)
  }

  getLastActivityTime(): Date {
    return new Date(this.lastActivityTime)
  }

  // For testing - force inactivity timeout (only in development)
  forceInactivityTimeout(): void {
    if (process.env.NODE_ENV === 'development') {
      this.handleInactivityTimeout()
    }
  }
}

// Export singleton instance
export const supabaseAuth = new SupabaseAuthManager()
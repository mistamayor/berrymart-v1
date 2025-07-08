import { User, AuthState } from '../types';
import { db } from './database';

class AuthManager {
  private authState: AuthState = {
    isAuthenticated: false,
    user: null
  };

  private listeners: ((authState: AuthState) => void)[] = [];

  constructor() {
    // Check for existing session
    const savedAuth = localStorage.getItem('auth');
    if (savedAuth) {
      try {
        const parsed = JSON.parse(savedAuth);
        if (parsed.user && parsed.isAuthenticated) {
          this.authState = parsed;
        }
      } catch (error) {
        localStorage.removeItem('auth');
      }
    }
  }

  subscribe(listener: (authState: AuthState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener(this.authState));
  }

  private saveToStorage() {
    localStorage.setItem('auth', JSON.stringify(this.authState));
  }

  login(username: string, password: string): boolean {
    const user = db.authenticateUser(username, password);
    if (user) {
      this.authState = {
        isAuthenticated: true,
        user
      };
      this.saveToStorage();
      this.notify();
      return true;
    }
    return false;
  }

  logout() {
    this.authState = {
      isAuthenticated: false,
      user: null
    };
    localStorage.removeItem('auth');
    this.notify();
  }

  getAuthState(): AuthState {
    return this.authState;
  }

  hasPermission(requiredRoles: string[]): boolean {
    if (!this.authState.isAuthenticated || !this.authState.user) {
      return false;
    }
    
    // Admin and Management have access to everything
    if (this.authState.user.role === 'Admin' || this.authState.user.role === 'Management') {
      return true;
    }
    
    return requiredRoles.includes(this.authState.user.role);
  }
}

export const auth = new AuthManager();
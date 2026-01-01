import { apiClient, AuthResponse } from '../../api/client';
import { User, Branch } from '../../types';

export interface LoginCredentials {
  email: string;
  password: string;
  branchId?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  currentBranch: Branch | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

class AuthService {
  private currentUser: User | null = null;
  private currentBranch: Branch | null = null;

  async login(credentials: LoginCredentials): Promise<{ user: User; token: string; refreshToken: string }> {
    try {
      const response = await apiClient.login({
        email: credentials.email,
        password: credentials.password,
        branchId: credentials.branchId,
      });

      const { user, token, refreshToken } = response;
      
      this.currentUser = user;
      this.currentBranch = user.currentBranch || null;
      
      return { user, token, refreshToken };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
      // Even if server logout fails, we still clear local state
    } finally {
      this.currentUser = null;
      this.currentBranch = null;
      await apiClient.clearAuthToken();
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      if (!this.currentUser) {
        const response = await apiClient.getCurrentUser();
        if (response.success && response.data) {
          this.currentUser = response.data.user;
          this.currentBranch = response.data.user.currentBranch || null;
        }
      }
      return this.currentUser;
    } catch (error) {
      console.error('Get current user error:', error);
      // If we can't get the current user, we're probably not authenticated
      this.currentUser = null;
      this.currentBranch = null;
      return null;
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      await apiClient.changePassword(currentPassword, newPassword);
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }

  async refreshToken(): Promise<string> {
    try {
      return await apiClient.refreshToken();
    } catch (error) {
      console.error('Token refresh error:', error);
      // If refresh fails, we need to log out
      await this.logout();
      throw error;
    }
  }

  getCurrentUserSync(): User | null {
    return this.currentUser;
  }

  getCurrentBranchSync(): Branch | null {
    return this.currentBranch;
  }

  setCurrentBranch(branch: Branch): void {
    this.currentBranch = branch;
    if (this.currentUser) {
      this.currentUser.currentBranch = branch.id; // Store branch ID as string
    }
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  async validateSession(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      return user !== null;
    } catch {
      return false;
    }
  }

  // OAuth methods (if needed in future)
  async initiateOAuth(provider: 'google' | 'facebook' | 'apple'): Promise<string> {
    // This would typically open a browser for OAuth flow
    // For now, we'll just return a mock URL
    return `${apiClient.getBaseURL()}/auth/oauth/${provider}`;
  }

  async handleOAuthCallback(code: string, provider: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>(`/auth/oauth/callback/${provider}`, { code });
      if (response.success && response.data) {
        const { user, token, refreshToken } = response.data;
        this.currentUser = user;
        this.currentBranch = user.currentBranch || null;
        return { user, token, refreshToken, expiresIn: 3600 };
      }
      throw new Error('OAuth authentication failed');
    } catch (error) {
      console.error('OAuth callback error:', error);
      throw error;
    }
  }

  // Multi-factor authentication methods
  async requestTwoFactorCode(method: 'email' | 'sms' | 'authenticator'): Promise<void> {
    try {
      await apiClient.post('/auth/2fa/request', { method });
    } catch (error) {
      console.error('2FA request error:', error);
      throw error;
    }
  }

  async verifyTwoFactorCode(code: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/2fa/verify', { code });
      if (response.success && response.data) {
        const { user, token, refreshToken } = response.data;
        this.currentUser = user;
        this.currentBranch = user.currentBranch || null;
        return { user, token, refreshToken, expiresIn: 3600 };
      }
      throw new Error('2FA verification failed');
    } catch (error) {
      console.error('2FA verification error:', error);
      throw error;
    }
  }

  // Session management
  async extendSession(): Promise<void> {
    try {
      await apiClient.post('/auth/extend-session');
    } catch (error) {
      console.error('Session extension error:', error);
      throw error;
    }
  }

  // Branch management for multi-branch businesses
  async switchBranch(branchId: string): Promise<void> {
    try {
      await apiClient.post('/auth/switch-branch', { branchId });
      // Update current branch
      if (this.currentUser) {
        // This would typically come from the API response
        this.currentBranch = { id: branchId } as Branch;
        this.currentUser.currentBranch = this.currentBranch.id; // Store branch ID as string
      }
    } catch (error) {
      console.error('Branch switch error:', error);
      throw error;
    }
  }

  // Permission checking
  hasPermission(permission: string): boolean {
    if (!this.currentUser) return false;
    return this.currentUser.permissions?.includes(permission) || false;
  }

  hasAnyPermission(permissions: string[]): boolean {
    if (!this.currentUser) return false;
    return permissions.some(permission => this.hasPermission(permission));
  }

  hasAllPermissions(permissions: string[]): boolean {
    if (!this.currentUser) return false;
    return permissions.every(permission => this.hasPermission(permission));
  }

  // Role checking
  hasRole(role: string): boolean {
    if (!this.currentUser) return false;
    return this.currentUser.roles?.includes(role) || false;
  }

  hasAnyRole(roles: string[]): boolean {
    if (!this.currentUser) return false;
    return roles.some(role => this.hasRole(role));
  }

  // Clear all auth data (useful for debugging or testing)
  async clearAllData(): Promise<void> {
    this.currentUser = null;
    this.currentBranch = null;
    await apiClient.clearAuthToken();
  }
}

export const authService = new AuthService();
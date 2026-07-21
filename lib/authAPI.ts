/**
 * Authentication API Client
 * Handles all auth-related API calls with token management
 */
import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/+$/, '');

interface AuthResponse {
  success: boolean;
  message: string;
  tokens?: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
  user?: {
    userId: number;
    email: string;
    username: string;
    fullName: string;
    role: string;
  };
  userId?: number;
}

interface LoginRequest {
  email?: string;
  username?: string;
  password: string;
  rememberMe?: boolean;
}

interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  fullName?: string;
  phone?: string;
}

interface VerifyEmailRequest {
  userId: number;
  verificationCode: string;
}

interface ResetPasswordRequest {
  resetToken: string;
  newPassword: string;
  confirmPassword: string;
}

interface ForgotPasswordRequest {
  email: string;
}

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

class AuthAPI {
  private api: AxiosInstance;
  private refreshTokenPromise: Promise<string> | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use((config) => {
      const accessToken = this.getAccessToken();
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
      return config;
    });

    // Response interceptor for token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        // Handle 401 Unauthorized
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newAccessToken = await this.refreshAccessToken();
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return this.api(originalRequest);
          } catch (refreshError) {
            // Refresh failed, clear tokens and redirect to login
            this.clearTokens();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // ============================================================================
  // Token Management
  // ============================================================================

  /**
   * Store tokens in localStorage
   */
  private setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  /**
   * Get stored access token
   */
  private getAccessToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accessToken');
    }
    return null;
  }

  /**
   * Get stored refresh token
   */
  private getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('refreshToken');
    }
    return null;
  }

  /**
   * Clear all tokens
   */
  private clearTokens(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(): Promise<string> {
    // Prevent multiple simultaneous refresh requests
    if (this.refreshTokenPromise) {
      return this.refreshTokenPromise;
    }

    this.refreshTokenPromise = (async () => {
      try {
        const refreshToken = this.getRefreshToken();

        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await this.api.post<AuthResponse>('/auth/refresh-token', {
          refreshToken,
        });

        if (response.data.tokens) {
          this.setTokens(response.data.tokens.accessToken, response.data.tokens.refreshToken);
          return response.data.tokens.accessToken;
        }

        throw new Error('Failed to refresh token');
      } finally {
        this.refreshTokenPromise = null;
      }
    })();

    return this.refreshTokenPromise;
  }

  // ============================================================================
  // Authentication Endpoints
  // ============================================================================

  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await this.api.post<AuthResponse>('/auth/register', data);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Login user
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await this.api.post<AuthResponse>('/auth/login', data);

      if (response.data.tokens) {
        this.setTokens(response.data.tokens.accessToken, response.data.tokens.refreshToken);

        // Store user info
        if (response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }
      }

      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Verify email with verification code
   */
  async verifyEmail(data: VerifyEmailRequest): Promise<AuthResponse> {
    try {
      const response = await this.api.post<AuthResponse>('/api/auth/verify-email', data);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Resend email verification code
   */
  async resendVerification(email: string): Promise<AuthResponse> {
    try {
      const response = await this.api.post<AuthResponse>('/api/auth/resend-verification', {
        email,
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Request password reset
   */
  async forgotPassword(data: ForgotPasswordRequest): Promise<AuthResponse> {
    try {
      const response = await this.api.post<AuthResponse>('/api/auth/forgot-password', data);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(data: ResetPasswordRequest): Promise<AuthResponse> {
    try {
      const response = await this.api.post<AuthResponse>('/api/auth/reset-password', data);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(): Promise<any> {
    try {
      const response = await this.api.get('/api/auth/profile');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(data: any): Promise<AuthResponse> {
    try {
      const response = await this.api.put<AuthResponse>('/api/auth/profile', data);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Change password
   */
  async changePassword(data: ChangePasswordRequest): Promise<AuthResponse> {
    try {
      const response = await this.api.post<AuthResponse>('/api/auth/change-password', data);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      const refreshToken = this.getRefreshToken();
      if (refreshToken) {
        await this.api.post('/api/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearTokens();
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  /**
   * Get stored user info
   */
  getUser(): any {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  }

  // ============================================================================
  // Error Handling
  // ============================================================================

  /**
   * Handle API errors
   */
  private handleError(error: AxiosError<any>): Error {
    if (error.response?.data?.message) {
      return new Error(error.response.data.message);
    }

    if (error.message === 'Network Error') {
      return new Error('Network error. Please check your connection.');
    }

    if (error.code === 'ECONNABORTED') {
      return new Error('Request timeout. Please try again.');
    }

    return new Error(error.message || 'An error occurred');
  }
}

// Export singleton instance
export const authAPI = new AuthAPI();
export default authAPI;

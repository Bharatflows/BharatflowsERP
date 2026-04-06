// Authentication Service
import { apiService } from './api';
import type { AuthResponse, User, ApiResponse } from '../types';

export const authService = {
  // Login
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await apiService.post<ApiResponse<AuthResponse>>('/auth/login', {
      email,
      password,
    });

    if (response.data?.token) {
      apiService.setToken(response.data.token);
      if (response.data.refreshToken) {
        apiService.setRefreshToken(response.data.refreshToken);
      }
    }

    return response.data as AuthResponse;
  },

  // Register
  async register(data: {
    name: string;
    email: string;
    password: string;
    phone: string;
    companyName: string;
    gstin?: string;
    // New optional fields for onboarding
    legalType?: string;
    yearEstablished?: string;
    employeesCount?: string;
    primaryCategoryId?: string;
    industryIds?: string[];
    activityIds?: string[];
    capabilityIds?: string[];
    productNames?: string[];
  }): Promise<AuthResponse> {
    const response = await apiService.post<ApiResponse<AuthResponse>>('/auth/register', data);

    if (response.data?.token) {
      apiService.setToken(response.data.token);
      if (response.data.refreshToken) {
        apiService.setRefreshToken(response.data.refreshToken);
      }
    }

    return response.data as AuthResponse;
  },

  // OTP Login
  async sendOTP(phone: string): Promise<{ success: boolean; message: string }> {
    return await apiService.post('/auth/send-otp', { phone });
  },

  async verifyOTP(phone: string, otp: string): Promise<AuthResponse> {
    const response = await apiService.post<ApiResponse<AuthResponse>>('/auth/verify-otp', {
      phone,
      otp,
    });

    if (response.data?.token) {
      apiService.setToken(response.data.token);
      if (response.data.refreshToken) {
        apiService.setRefreshToken(response.data.refreshToken);
      }
    }

    return response.data as AuthResponse;
  },

  // Google Login
  async googleLogin(token: string): Promise<AuthResponse> {
    const response = await apiService.post<ApiResponse<AuthResponse>>('/auth/google', {
      token,
    });

    if (response.data?.token) {
      apiService.setToken(response.data.token);
      if (response.data.refreshToken) {
        apiService.setRefreshToken(response.data.refreshToken);
      }
    }

    return response.data as AuthResponse;
  },

  // Logout
  async logout(): Promise<void> {
    await apiService.post('/auth/logout', {});
    apiService.clearToken();
  },

  // Get current user
  async getCurrentUser(): Promise<User> {
    const response = await apiService.get<ApiResponse<{ user: User }>>('/auth/me');
    return response.data?.user as User;
  },

  // Forgot Password
  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    return await apiService.post('/auth/forgot-password', { email });
  },

  // Reset Password
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean }> {
    return await apiService.post('/auth/reset-password', { token, newPassword });
  },

  // Refresh Token
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await apiService.post<ApiResponse<AuthResponse>>('/auth/refresh', {
      refreshToken,
    });

    if (response.data?.token) {
      apiService.setToken(response.data.token);
      if (response.data.refreshToken) {
        apiService.setRefreshToken(response.data.refreshToken);
      }
    }

    return response.data as AuthResponse;
  },
  // Update Profile
  async updateProfile(data: { name?: string; phone?: string; preferences?: any }): Promise<{ user: User; message: string }> {
    const response = await apiService.put<ApiResponse<{ user: User }>>('/auth/update-profile', data);
    return {
      user: response.data?.user as User,
      message: response.message || 'Profile updated successfully'
    };
  },

  // Public GSTIN Lookup (for registration)
  async getPublicGSTINDetails(gstin: string): Promise<ApiResponse<any>> {
    return await apiService.get<ApiResponse<any>>(`/gstin/public/${gstin}`);
  },
};

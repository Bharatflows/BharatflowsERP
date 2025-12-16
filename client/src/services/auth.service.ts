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
  }): Promise<AuthResponse> {
    const response = await apiService.post<ApiResponse<AuthResponse>>('/auth/register', data);

    if (response.data?.token) {
      apiService.setToken(response.data.token);
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
    }

    return response.data as AuthResponse;
  },
};

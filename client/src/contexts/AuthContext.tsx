// Authentication Context Provider
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/auth.service';

import type { User } from '../types';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: any) => Promise<void>;
  verifyOTP: (phone: string, otp: string) => Promise<void>;
  googleLogin: (token: string) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (token) {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        localStorage.removeItem('authToken');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login(email, password);
      // Token is already set in authService.login
      setUser(response.user);
      toast.success(`Welcome back, ${response.user.name}!`);
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
      throw error;
    }
  };

  const register = async (data: any) => {
    try {
      const response = await authService.register(data);
      // Token is already set in authService.register
      setUser(response.user);
      toast.success(`Welcome to BharatFlow, ${response.user.name}!`);
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
      throw error;
    }
  };

  const verifyOTP = async (phone: string, otp: string) => {
    try {
      const response = await authService.verifyOTP(phone, otp);
      // Token is already set in authService.verifyOTP
      setUser(response.user);
      toast.success(`Welcome back, ${response.user.name}!`);
    } catch (error: any) {
      toast.error(error.message || 'OTP verification failed');
      throw error;
    }
  };

  const googleLogin = async (token: string) => {
    try {
      const response = await authService.googleLogin(token);
      setUser(response.user);
      toast.success(`Welcome back, ${response.user.name}!`);
    } catch (error: any) {
      toast.error(error.message || 'Google login failed');
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout on error
      localStorage.removeItem('authToken');
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    register,
    verifyOTP,
    googleLogin,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
// Authentication Context Provider
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/auth.service';
import apiService from '../services/api';

import type { User } from '../types';
import { toast } from 'sonner';

// P0-1: Company type for multi-company support
interface Company {
  id: string;
  businessName: string;
  gstin?: string | null;
  logo?: string | null;
  role?: string;  // Optional - may not exist on User.company
  isDefault?: boolean;  // Optional - may not exist on User.company
}

interface AuthContextType {
  user: User | null;
  company: Company | null;  // P0-1: Current active company
  companies: Company[];     // P0-1: All companies user belongs to
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: any) => Promise<void>;
  verifyOTP: (phone: string, otp: string) => Promise<void>;
  googleLogin: (token: string) => Promise<void>;
  setActiveCompany: (company: Company) => void;  // P0-1: Switch company
  updateUser: (user: User) => void;
  isAuthenticated: boolean;
}

const contextId = Math.random().toString(36).substring(7);
console.log('[AuthContext] Module initialized, ID:', contextId);

const AuthContext = createContext<AuthContextType | undefined>(undefined);
if (import.meta.env.DEV) {
  (AuthContext as any).displayName = 'AuthContext';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  console.log('[AuthContext] AuthProvider rendering, Module ID:', contextId);
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const refreshToken = localStorage.getItem('refreshToken');

        if (token) {
          try {
            const currentUser = await authService.getCurrentUser();
            setUser(currentUser);

            // P0-1: Set company from stored ID or user's company
            const storedCompanyId = apiService.getCurrentCompanyId();
            if (currentUser.company) {
              setCompany(currentUser.company);
              if (!storedCompanyId) {
                apiService.setCurrentCompanyId(currentUser.company.id);
              }
            }
            if (currentUser.companies) {
              setCompanies(currentUser.companies);
            }
          } catch (error: any) {
            // If token is expired and we have a refresh token, try to refresh
            if (refreshToken && (error.message?.includes('expired') || error.status === 401)) {
              try {
                await authService.refreshToken(refreshToken);
                const currentUser = await authService.getCurrentUser();
                setUser(currentUser);
              } catch (refreshError) {
                console.error('Refresh token failed:', refreshError);
                localStorage.removeItem('authToken');
                localStorage.removeItem('refreshToken');
                apiService.clearCurrentCompanyId();
              }
            } else {
              localStorage.removeItem('authToken');
              localStorage.removeItem('refreshToken');
              apiService.clearCurrentCompanyId();
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
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
      const userWithCompany = { ...response.user, company: (response as any).company };
      setUser(userWithCompany);

      // P0-1: Set companies from response
      const responseCompanies = (response as any).companies || [];
      setCompanies(responseCompanies);

      const currentCompany = (response as any).company || responseCompanies.find((c: Company) => c.isDefault) || responseCompanies[0];
      if (currentCompany) {
        setCompany(currentCompany);
        apiService.setCurrentCompanyId(currentCompany.id);
      }

      toast.success(`Welcome back, ${response.user.name}!`);
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
      throw error;
    }
  };

  const register = async (data: any) => {
    try {
      const response = await authService.register(data);
      const userWithCompany = { ...response.user, company: (response as any).company };
      setUser(userWithCompany);

      // P0-1: Set company after registration
      if ((response as any).company) {
        setCompany((response as any).company);
        setCompanies([(response as any).company]);
        apiService.setCurrentCompanyId((response as any).company.id);
      }

      toast.success(`Welcome to BharatFlow, ${response.user.name}!`);
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
      throw error;
    }
  };

  const verifyOTP = async (phone: string, otp: string) => {
    try {
      const response = await authService.verifyOTP(phone, otp);
      const userWithCompany = { ...response.user, company: (response as any).company };
      setUser(userWithCompany);
      toast.success(`Welcome back, ${response.user.name}!`);
    } catch (error: any) {
      toast.error(error.message || 'OTP verification failed');
      throw error;
    }
  };

  const googleLogin = async (token: string) => {
    try {
      const response = await authService.googleLogin(token);
      const userWithCompany = { ...response.user, company: (response as any).company };
      setUser(userWithCompany);
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
      setCompany(null);
      setCompanies([]);
      apiService.clearCurrentCompanyId();
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout on error
      localStorage.removeItem('authToken');
      setUser(null);
      setCompany(null);
      setCompanies([]);
      apiService.clearCurrentCompanyId();
    }
  };

  // P0-1: Switch active company
  const setActiveCompany = (newCompany: Company) => {
    setCompany(newCompany);
    apiService.setCurrentCompanyId(newCompany.id);
  };

  const value = {
    user,
    company,
    companies,
    loading,
    login,
    logout,
    register,
    verifyOTP,
    googleLogin,
    setActiveCompany,
    updateUser: (updatedUser: User) => setUser(updatedUser),
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  console.log('[AuthContext] useAuth called, Module ID:', contextId, 'Context found:', !!context);
  if (context === undefined) {
    console.error('[AuthContext] FATAL: Context is undefined inside useAuth. Module ID:', contextId);
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
// Mock Authentication Utility (Until backend is ready)
import type { User, AuthResponse } from '../types';

// Mock user database
const MOCK_USERS = [
  {
    id: '1',
    email: 'admin@bharatflow.com',
    password: 'admin123', // In production, this would be hashed
    name: 'Rajesh Kumar',
    role: 'ADMIN' as const,
    phone: '+91 98765 43210',
    companyId: '1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    email: 'demo@demo.com',
    password: 'demo123',
    name: 'Demo User',
    role: 'MANAGER' as const,
    phone: '+91 98765 43211',
    companyId: '1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Mock company data
const MOCK_COMPANY = {
  id: '1',
  businessName: 'ABC Traders Pvt Ltd',
  gstin: '27AABCU9603R1ZM',
  pan: 'AABCU9603R',
  address: '123, MG Road',
  city: 'Mumbai',
  state: 'Maharashtra',
  pincode: '400001',
  phone: '+91 22 1234 5678',
  email: 'info@abctraders.com',
};

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockAuthService = {
  // Mock login
  async login(email: string, password: string): Promise<AuthResponse> {
    await delay(800); // Simulate network delay

    const user = MOCK_USERS.find(u => u.email === email && u.password === password);

    if (!user) {
      throw new Error('Invalid email or password');
    }

    const { password: _, ...userWithoutPassword } = user;

    return {
      token: `mock_token_${Date.now()}`,
      user: userWithoutPassword,
      refreshToken: `mock_refresh_token_${Date.now()}`,
    };
  },

  // Mock register
  async register(data: {
    name: string;
    email: string;
    password: string;
    phone: string;
    companyName: string;
  }): Promise<AuthResponse> {
    await delay(1000);

    // Check if user exists
    if (MOCK_USERS.find(u => u.email === data.email)) {
      throw new Error('Email already registered');
    }

    const newUser: User = {
      id: String(MOCK_USERS.length + 1),
      email: data.email,
      name: data.name,
      role: 'ADMIN',
      phone: data.phone,
      companyId: '1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return {
      token: `mock_token_${Date.now()}`,
      user: newUser,
      refreshToken: `mock_refresh_token_${Date.now()}`,
    };
  },

  // Mock OTP verification
  async verifyOTP(phone: string, otp: string): Promise<AuthResponse> {
    await delay(500);

    if (otp !== '123456') {
      throw new Error('Invalid OTP');
    }

    const user = MOCK_USERS[0]; // Return first user for demo
    const { password: _, ...userWithoutPassword } = user;

    return {
      token: `mock_token_${Date.now()}`,
      user: userWithoutPassword,
      refreshToken: `mock_refresh_token_${Date.now()}`,
    };
  },

  // Mock get current user
  async getCurrentUser(token: string): Promise<User> {
    await delay(300);

    if (!token) {
      throw new Error('No token provided');
    }

    // Return mock user based on token
    const { password: _, ...userWithoutPassword } = MOCK_USERS[0];
    return userWithoutPassword;
  },

  // Get mock company data
  getCompanyData() {
    return MOCK_COMPANY;
  },
};

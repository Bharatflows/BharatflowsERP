// API Service Layer - All backend API calls go through here
import { CONTENT_TYPES } from '../constants/api-endpoints';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://www.bharatflows.com/api/v1';

// P0-1: Company ID storage key
const COMPANY_ID_KEY = 'currentCompanyId';

class ApiService {
  setToken(token: string) {
    localStorage.setItem('authToken', token);
  }

  setRefreshToken(token: string) {
    localStorage.setItem('refreshToken', token);
  }

  clearToken() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
  }

  // P0-1: Company management
  setCurrentCompanyId(companyId: string) {
    localStorage.setItem(COMPANY_ID_KEY, companyId);
  }

  getCurrentCompanyId(): string | null {
    return localStorage.getItem(COMPANY_ID_KEY);
  }

  clearCurrentCompanyId() {
    localStorage.removeItem(COMPANY_ID_KEY);
  }

  private getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retries: number = 3,
    timeout: number = 30000
  ): Promise<T> {
    const token = this.getToken();
    const companyId = this.getCurrentCompanyId();  // P0-1: Get current company

    const headers: HeadersInit = {
      'Content-Type': CONTENT_TYPES.JSON,
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(companyId && { 'x-company-id': companyId }),  // P0-1: Add company header
      ...options.headers,
    };

    const config: RequestInit = {
      ...options,
      headers,
    };

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      // D2: AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...config,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const error = await response.json().catch(() => ({ message: 'An error occurred' }));
          const errorInstance = new Error(error.message || `HTTP ${response.status}`) as Error & {
            status?: number;
            data?: unknown;
          };
          errorInstance.status = response.status;
          errorInstance.data = error;
          // Don't retry 4xx errors (client errors)
          if (response.status >= 400 && response.status < 500) {
            throw errorInstance;
          }
          // Retry 5xx errors (server errors)
          lastError = errorInstance;
          if (attempt < retries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
            continue;
          }
          throw lastError;
        }

        return await response.json();
      } catch (error: any) {
        clearTimeout(timeoutId);

        // Handle timeout specifically
        if (error.name === 'AbortError') {
          lastError = new Error('Request timed out');
        } else {
          lastError = error;
        }

        // Retry on network errors or timeouts
        if (attempt < retries && (error.name === 'AbortError' || error.name === 'TypeError')) {
          console.warn(`API request attempt ${attempt} failed, retrying...`, error.message);
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          continue;
        }

        console.error('API Request Error:', error);
        throw lastError;
      }
    }

    throw lastError || new Error('Request failed after retries');
  }

  // Generic CRUD methods
  async get<T>(endpoint: string, options: RequestInit & { responseType?: 'blob' } = {}): Promise<T> {
    const { responseType, ...fetchOptions } = options;
    const token = this.getToken();
    const config: RequestInit = {
      ...fetchOptions,
      method: 'GET',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        ...fetchOptions.headers,
      },
    };

    if (responseType === 'blob') {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.blob() as any;
    }

    // GET requests CAN retry (safe, idempotent)
    return this.request<T>(endpoint, fetchOptions, 3, 30000);
  }

  // FIX #3: Mutation endpoints MUST NOT retry to prevent duplicate records
  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    }, 1, 30000); // NO RETRIES for POST
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, 1, 30000); // NO RETRIES for PUT
  }

  async patch<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, 1, 30000); // NO RETRIES for PATCH
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' }, 1, 30000); // NO RETRIES for DELETE
  }

  // File download
  async getBlob(endpoint: string): Promise<Blob> {
    const token = this.getToken();
    const companyId = this.getCurrentCompanyId();

    const headers: HeadersInit = {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(companyId && { 'x-company-id': companyId }),
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.blob();
  }

  // File upload
  async uploadFile<T>(endpoint: string, file: File): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    const token = this.getToken();
    const headers: HeadersInit = {
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return await response.json();
  }
}

export const apiService = new ApiService();
export default apiService;

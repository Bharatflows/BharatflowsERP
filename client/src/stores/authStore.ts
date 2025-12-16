// Zustand Auth Store
import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { authService } from '../services/auth.service';

export interface User {
    id: string;
    email: string;
    name: string;
    role: 'ADMIN' | 'MANAGER' | 'ACCOUNTANT' | 'USER';
    companyId: string;
    company?: {
        id: string;
        name: string;
        gstin?: string;
    };
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    // Actions
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    setUser: (user: User) => void;
    setLoading: (loading: boolean) => void;
    clearError: () => void;
    checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    devtools(
        persist(
            (set) => ({
                user: null,
                token: null,
                isAuthenticated: false,
                isLoading: true,
                error: null,

                login: async (email: string, password: string) => {
                    set({ isLoading: true, error: null });
                    try {
                        const response = await authService.login(email, password);
                        // response is AuthResponse with user and token
                        localStorage.setItem('authToken', response.token);
                        set({
                            user: response.user as User,
                            token: response.token,
                            isAuthenticated: true,
                            isLoading: false,
                            error: null,
                        });
                    } catch (error: any) {
                        set({
                            isLoading: false,
                            error: error.message || 'Login failed',
                        });
                        throw error;
                    }
                },

                logout: () => {
                    localStorage.removeItem('authToken');
                    set({
                        user: null,
                        token: null,
                        isAuthenticated: false,
                        isLoading: false,
                        error: null,
                    });
                },

                setUser: (user: User) => set({ user }),

                setLoading: (loading: boolean) => set({ isLoading: loading }),

                clearError: () => set({ error: null }),

                checkAuth: async () => {
                    const token = localStorage.getItem('authToken');
                    if (!token) {
                        set({ isAuthenticated: false, isLoading: false });
                        return;
                    }

                    try {
                        set({ isLoading: true });
                        const user = await authService.getCurrentUser();
                        set({
                            user: user as User,
                            token,
                            isAuthenticated: true,
                            isLoading: false,
                        });
                    } catch {
                        localStorage.removeItem('authToken');
                        set({
                            user: null,
                            token: null,
                            isAuthenticated: false,
                            isLoading: false,
                        });
                    }
                },
            }),
            {
                name: 'auth-storage',
                partialize: (state) => ({
                    token: state.token,
                    user: state.user,
                    isAuthenticated: state.isAuthenticated,
                }),
            }
        ),
        { name: 'AuthStore' }
    )
);

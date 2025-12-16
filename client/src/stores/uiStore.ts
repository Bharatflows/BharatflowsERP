// Zustand UI Store - for global UI state
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface SidebarState {
    isCollapsed: boolean;
    isMobileOpen: boolean;
}

interface UIState {
    // Sidebar
    sidebar: SidebarState;
    toggleSidebar: () => void;
    collapseSidebar: () => void;
    expandSidebar: () => void;
    setMobileSidebar: (open: boolean) => void;

    // Theme
    theme: 'light' | 'dark' | 'system';
    setTheme: (theme: 'light' | 'dark' | 'system') => void;

    // Global loading overlay
    isGlobalLoading: boolean;
    globalLoadingMessage: string | null;
    setGlobalLoading: (loading: boolean, message?: string) => void;

    // Modal state (for global modals)
    activeModal: string | null;
    modalData: any;
    openModal: (modalId: string, data?: any) => void;
    closeModal: () => void;
}

export const useUIStore = create<UIState>()(
    devtools(
        (set) => ({
            // Sidebar state
            sidebar: {
                isCollapsed: false,
                isMobileOpen: false,
            },

            toggleSidebar: () =>
                set((state) => ({
                    sidebar: {
                        ...state.sidebar,
                        isCollapsed: !state.sidebar.isCollapsed,
                    },
                })),

            collapseSidebar: () =>
                set((state) => ({
                    sidebar: { ...state.sidebar, isCollapsed: true },
                })),

            expandSidebar: () =>
                set((state) => ({
                    sidebar: { ...state.sidebar, isCollapsed: false },
                })),

            setMobileSidebar: (open: boolean) =>
                set((state) => ({
                    sidebar: { ...state.sidebar, isMobileOpen: open },
                })),

            // Theme
            theme: 'system',
            setTheme: (theme) => set({ theme }),

            // Global loading
            isGlobalLoading: false,
            globalLoadingMessage: null,
            setGlobalLoading: (loading, message) =>
                set({
                    isGlobalLoading: loading,
                    globalLoadingMessage: message || null,
                }),

            // Modal
            activeModal: null,
            modalData: null,
            openModal: (modalId, data) =>
                set({ activeModal: modalId, modalData: data }),
            closeModal: () => set({ activeModal: null, modalData: null }),
        }),
        { name: 'UIStore' }
    )
);

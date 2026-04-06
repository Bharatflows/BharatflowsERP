// Zustand UI Store - for global UI state
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface SidebarState {
    isCollapsed: boolean;
    isMobileOpen: boolean;
    expandedCategories: string[]; // For Accordion Logic
}

interface UIState {
    // Sidebar
    sidebar: SidebarState;
    toggleSidebar: () => void;
    collapseSidebar: () => void;
    expandSidebar: () => void;
    setMobileSidebar: (open: boolean) => void;
    toggleSidebarCategory: (categoryId: string) => void;

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
        persist(
            (set) => ({
                // Sidebar state
                sidebar: {
                    isCollapsed: false,
                    isMobileOpen: false,
                    expandedCategories: ['finance', 'operations', 'people', 'reports'], // Default expanded
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

                toggleSidebarCategory: (categoryId: string) =>
                    set((state) => {
                        const current = state.sidebar.expandedCategories;
                        const isExpanded = current.includes(categoryId);
                        return {
                            sidebar: {
                                ...state.sidebar,
                                expandedCategories: isExpanded
                                    ? current.filter(id => id !== categoryId)
                                    : [...current, categoryId]
                            }
                        };
                    }),

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
            {
                name: 'ui-storage', // unique name
                partialize: (state) => ({
                    sidebar: state.sidebar,
                    theme: state.theme
                }), // Only persist sidebar and theme
            }
        ),
        { name: 'UIStore' }
    )
);

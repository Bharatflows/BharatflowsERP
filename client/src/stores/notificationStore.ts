// Zustand Notification Store
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface Notification {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
    duration?: number; // ms, 0 = persistent
    action?: {
        label: string;
        onClick: () => void;
    };
}

interface NotificationState {
    notifications: Notification[];
    addNotification: (notification: Omit<Notification, 'id'>) => string;
    removeNotification: (id: string) => void;
    clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>()(
    devtools(
        (set, get) => ({
            notifications: [],

            addNotification: (notification) => {
                const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                const newNotification: Notification = {
                    ...notification,
                    id,
                    duration: notification.duration ?? 5000,
                };

                set((state) => ({
                    notifications: [...state.notifications, newNotification],
                }));

                // Auto-remove after duration (if not persistent)
                if (newNotification.duration && newNotification.duration > 0) {
                    setTimeout(() => {
                        get().removeNotification(id);
                    }, newNotification.duration);
                }

                return id;
            },

            removeNotification: (id) =>
                set((state) => ({
                    notifications: state.notifications.filter((n) => n.id !== id),
                })),

            clearAll: () => set({ notifications: [] }),
        }),
        { name: 'NotificationStore' }
    )
);

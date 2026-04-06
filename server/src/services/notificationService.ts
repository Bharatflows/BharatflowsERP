/**
 * Notification Service
 * Handles creation, retrieval, and management of system notifications
 */
import prisma from '../config/prisma';
import logger from '../config/logger';
import { sendNotificationToUser } from '../socket';

export interface CreateNotificationInput {
    userId: string;
    companyId: string;
    type: string;
    title: string;
    message: string;
    data?: Record<string, unknown>;
}

class NotificationService {
    /**
     * Create a new notification
     */
    async create(input: CreateNotificationInput) {
        try {
            const notification = await prisma.notification.create({
                data: {
                    userId: input.userId,
                    companyId: input.companyId,
                    type: input.type,
                    title: input.title,
                    message: input.message,
                    data: (input.data as any) ?? null,
                },
            });

            logger.info(`Notification created: ${notification.id} for user ${input.userId}`);

            // Emit real-time notification via Socket.IO
            sendNotificationToUser(input.userId, notification);

            return notification;
        } catch (error) {
            logger.error('Error creating notification:', error);
            throw error;
        }
    }

    /**
     * Send notification to multiple users (e.g., all admins)
     */
    async createForMultipleUsers(userIds: string[], companyId: string, type: string, title: string, message: string, data?: Record<string, unknown>) {
        const notifications = await prisma.notification.createMany({
            data: userIds.map(userId => ({
                userId,
                companyId,
                type,
                title,
                message,
                data: (data as any) ?? null,
            })),
        });
        return notifications;
    }

    /**
     * Get notifications for a user
     */
    async getForUser(userId: string, companyId: string, options?: { limit?: number; offset?: number; unreadOnly?: boolean }) {
        const { limit = 20, offset = 0, unreadOnly = false } = options ?? {};

        const where = {
            userId,
            companyId,
            ...(unreadOnly && { read: false }),
        };

        const [notifications, total, unreadCount] = await Promise.all([
            prisma.notification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
            }),
            prisma.notification.count({ where }),
            prisma.notification.count({ where: { userId, companyId, read: false } }),
        ]);

        return {
            notifications,
            total,
            unreadCount,
            hasMore: offset + notifications.length < total,
        };
    }

    /**
     * Mark a single notification as read
     */
    async markAsRead(id: string, userId: string) {
        return prisma.notification.updateMany({
            where: { id, userId },
            data: { read: true, readAt: new Date() },
        });
    }

    /**
     * Mark all notifications as read for a user
     */
    async markAllAsRead(userId: string, companyId: string) {
        return prisma.notification.updateMany({
            where: { userId, companyId, read: false },
            data: { read: true, readAt: new Date() },
        });
    }

    /**
     * Delete a notification
     */
    async delete(id: string, userId: string) {
        return prisma.notification.deleteMany({
            where: { id, userId },
        });
    }

    /**
     * Delete old notifications (cleanup job)
     */
    async deleteOldNotifications(daysOld: number = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        return prisma.notification.deleteMany({
            where: {
                createdAt: { lt: cutoffDate },
                read: true,
            },
        });
    }
}

export const notificationService = new NotificationService();
export default notificationService;

/**
 * Notification Controller
 * Handles HTTP endpoints for notification management
 */
import { Request, Response } from 'express';
import { notificationService } from '../services/notificationService';

// Extended Request type with user info
interface AuthRequest extends Request {
    user?: {
        id: string;
        companyId: string;
    };
}

/**
 * Get notifications for current user
 * GET /api/v1/notifications
 */
export const getNotifications = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const companyId = req.user?.companyId;

        if (!userId || !companyId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const limit = parseInt(req.query.limit as string) || 20;
        const offset = parseInt(req.query.offset as string) || 0;
        const unreadOnly = req.query.unreadOnly === 'true';

        const result = await notificationService.getForUser(userId, companyId, {
            limit,
            offset,
            unreadOnly,
        });

        return res.json({
            success: true,
            data: result.notifications,
            pagination: {
                total: result.total,
                unreadCount: result.unreadCount,
                hasMore: result.hasMore,
            },
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
    }
};

/**
 * Get unread count
 * GET /api/v1/notifications/unread-count
 */
export const getUnreadCount = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const companyId = req.user?.companyId;

        if (!userId || !companyId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const result = await notificationService.getForUser(userId, companyId, { limit: 1 });

        return res.json({
            success: true,
            data: { unreadCount: result.unreadCount },
        });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch unread count' });
    }
};

/**
 * Mark notification as read
 * PATCH /api/v1/notifications/:id/read
 */
export const markAsRead = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        await notificationService.markAsRead(id, userId);

        return res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        return res.status(500).json({ success: false, message: 'Failed to mark as read' });
    }
};

/**
 * Mark all notifications as read
 * PATCH /api/v1/notifications/read-all
 */
export const markAllAsRead = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const companyId = req.user?.companyId;

        if (!userId || !companyId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        await notificationService.markAllAsRead(userId, companyId);

        return res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error marking all as read:', error);
        return res.status(500).json({ success: false, message: 'Failed to mark all as read' });
    }
};

/**
 * Delete a notification
 * DELETE /api/v1/notifications/:id
 */
export const deleteNotification = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        await notificationService.delete(id, userId);

        return res.json({ success: true, message: 'Notification deleted' });
    } catch (error) {
        console.error('Error deleting notification:', error);
        return res.status(500).json({ success: false, message: 'Failed to delete notification' });
    }
};

export default {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
};

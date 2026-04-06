/**
 * Notification Routes
 */
import { Router } from 'express';
import { protect } from '../middleware/auth';
import notificationController from '../controllers/notificationController';

const router = Router();

// All routes require authentication
router.use(protect);

// GET /api/v1/notifications - Get user's notifications
router.get('/', notificationController.getNotifications);

// GET /api/v1/notifications/unread-count - Get unread count
router.get('/unread-count', notificationController.getUnreadCount);

// PATCH /api/v1/notifications/read-all - Mark all as read
router.patch('/read-all', notificationController.markAllAsRead);

// PATCH /api/v1/notifications/:id/read - Mark single as read
router.patch('/:id/read', notificationController.markAsRead);

// DELETE /api/v1/notifications/:id - Delete notification
router.delete('/:id', notificationController.deleteNotification);

export default router;

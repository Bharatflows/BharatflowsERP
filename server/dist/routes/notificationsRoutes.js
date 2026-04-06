"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Notification Routes
 */
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const notificationController_1 = __importDefault(require("../controllers/notificationController"));
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.protect);
// GET /api/v1/notifications - Get user's notifications
router.get('/', notificationController_1.default.getNotifications);
// GET /api/v1/notifications/unread-count - Get unread count
router.get('/unread-count', notificationController_1.default.getUnreadCount);
// PATCH /api/v1/notifications/read-all - Mark all as read
router.patch('/read-all', notificationController_1.default.markAllAsRead);
// PATCH /api/v1/notifications/:id/read - Mark single as read
router.patch('/:id/read', notificationController_1.default.markAsRead);
// DELETE /api/v1/notifications/:id - Delete notification
router.delete('/:id', notificationController_1.default.deleteNotification);
exports.default = router;
//# sourceMappingURL=notificationsRoutes.js.map
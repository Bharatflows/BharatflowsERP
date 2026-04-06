/**
 * Admin Routes
 * User management, audit logs, system configuration
 */
import { Router } from 'express';
import { adminController } from '../controllers/adminController';

const router = Router();

// User Management
router.get('/users', adminController.listUsers);
router.get('/users/:id', adminController.getUser);
router.post('/users', adminController.createUser);
router.patch('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deactivateUser);

// Audit Logs
router.get('/audit-logs', adminController.listAuditLogs);

// System Stats
router.get('/stats', adminController.getSystemStats);

export default router;

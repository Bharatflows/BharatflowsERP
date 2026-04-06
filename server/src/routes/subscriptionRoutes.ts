/**
 * Subscription Routes
 * 
 * API routes for subscription management
 */

import { Router } from 'express';
import { protect } from '../middleware/auth';
import subscriptionController from '../controllers/subscriptionController';

const router = Router();

// Public routes
router.get('/plans', subscriptionController.getPlans);
router.post('/webhook/:provider', subscriptionController.handleWebhook);

// Protected routes
router.use(protect);

router.get('/current', subscriptionController.getCurrentSubscription);
router.get('/history', subscriptionController.getSubscriptionHistory);
router.get('/check', subscriptionController.checkSubscription);
router.get('/features/:feature', subscriptionController.checkFeature);
router.get('/limits/:limitKey', subscriptionController.checkUsageLimit);

router.post('/', subscriptionController.initiateSubscription);
router.post('/verify', subscriptionController.verifySubscriptionPayment);
router.post('/cancel', subscriptionController.cancelSubscription);

export default router;

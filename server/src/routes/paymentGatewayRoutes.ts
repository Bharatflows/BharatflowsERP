/**
 * Payment Gateway Routes
 * 
 * API routes for payment gateway configuration
 */

import { Router } from 'express';
import { protect } from '../middleware/auth';
import paymentGatewayController from '../controllers/paymentGatewayController';

const router = Router();

// All routes are protected
router.use(protect);

router.get('/providers', paymentGatewayController.getSupportedProviders);
router.get('/', paymentGatewayController.getGatewayConfigs);
router.get('/active', paymentGatewayController.getActiveGateway);
router.post('/', paymentGatewayController.saveGatewayConfig);
router.put('/:provider/activate', paymentGatewayController.setActiveGateway);
router.delete('/:provider', paymentGatewayController.deleteGatewayConfig);
router.post('/:provider/test', paymentGatewayController.testGatewayConnection);

export default router;

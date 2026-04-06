/**
 * Channel Hub Routes
 * 
 * API routes for e-commerce channel integration
 */

import { Router } from 'express';
import { protect } from '../middleware/auth';
import {
    getChannelConfigs,
    getAvailableChannels,
    configureChannel,
    testChannelConnection,
    toggleChannelStatus,
    deleteChannelConfig,
    getChannelOrders,
    getChannelOrder,
    syncChannelOrders,
    convertToInvoice,
    updateOrderStatus,
    getChannelDashboard,
} from '../controllers/channelHubController';

const router = Router();

// All routes require authentication
router.use(protect);

// ============ Dashboard ============
router.get('/dashboard', getChannelDashboard);

// ============ Channel Configuration ============
router.get('/channels', getAvailableChannels);
router.get('/configs', getChannelConfigs);
router.post('/configs', configureChannel);
router.post('/configs/:channel/test', testChannelConnection);
router.put('/configs/:channel/status', toggleChannelStatus);
router.delete('/configs/:channel', deleteChannelConfig);

// ============ Orders ============
router.get('/orders', getChannelOrders);
router.get('/orders/:id', getChannelOrder);
router.post('/sync/:channel', syncChannelOrders);
router.post('/orders/:id/convert', convertToInvoice);
router.put('/orders/:id/status', updateOrderStatus);

export default router;

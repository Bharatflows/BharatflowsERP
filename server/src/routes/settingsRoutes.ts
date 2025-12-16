import express from 'express';
import { protect } from '../middleware/auth';
import {
    getSequences,
    getSequence,
    updateSequence,
    previewSequence,
    getNextPreview,
} from '../controllers/settingsController';
import * as devicesController from '../controllers/settings/devicesController';
import * as ipWhitelistController from '../controllers/settings/ipWhitelistController';
import * as workflowsController from '../controllers/settings/workflowsController';

const router = express.Router();
router.use(protect);

// Sequence management routes
router.get('/sequences', getSequences);
router.post('/sequences/preview', previewSequence);
router.get('/sequences/:documentType/next', getNextPreview);
router.get('/sequences/:documentType', getSequence);
router.put('/sequences/:documentType', updateSequence);

// ============ Device Management ============
router.get('/devices/summary', devicesController.getDeviceSummary);
router.get('/devices', devicesController.getDevices);
router.get('/devices/:id', devicesController.getDevice);
router.post('/devices', devicesController.registerDevice);
router.put('/devices/:id', devicesController.updateDevice);
router.post('/devices/:id/block', devicesController.blockDevice);
router.post('/devices/:id/unblock', devicesController.unblockDevice);
router.delete('/devices/:id', devicesController.deleteDevice);

// ============ IP Whitelisting ============
router.get('/ip-whitelist/check/:ip', ipWhitelistController.checkIPWhitelist);
router.get('/ip-whitelist', ipWhitelistController.getIPWhitelist);
router.get('/ip-whitelist/:id', ipWhitelistController.getIPWhitelistEntry);
router.post('/ip-whitelist', ipWhitelistController.addIPToWhitelist);
router.put('/ip-whitelist/:id', ipWhitelistController.updateIPWhitelist);
router.post('/ip-whitelist/:id/toggle', ipWhitelistController.toggleIPWhitelist);
router.delete('/ip-whitelist/:id', ipWhitelistController.removeIPFromWhitelist);

// ============ Approval Workflows ============
router.get('/workflows/for-document', workflowsController.getWorkflowForDocument);
router.get('/workflows', workflowsController.getWorkflows);
router.get('/workflows/:id', workflowsController.getWorkflow);
router.post('/workflows', workflowsController.createWorkflow);
router.put('/workflows/:id', workflowsController.updateWorkflow);
router.post('/workflows/:id/toggle', workflowsController.toggleWorkflow);
router.delete('/workflows/:id', workflowsController.deleteWorkflow);

// General settings endpoint (for future expansion)
router.get('/', (req, res) => res.json({ success: true, message: 'Settings API' }));

export default router;

"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const settingsController_1 = require("../controllers/settingsController");
const devicesController = __importStar(require("../controllers/settings/devicesController"));
const ipWhitelistController = __importStar(require("../controllers/settings/ipWhitelistController"));
const workflowsController = __importStar(require("../controllers/settings/workflowsController"));
const router = express_1.default.Router();
router.use(auth_1.protect);
// Sequence management routes
router.get('/sequences', settingsController_1.getSequences);
router.post('/sequences/preview', settingsController_1.previewSequence);
router.get('/sequences/:documentType/next', settingsController_1.getNextPreview);
router.get('/sequences/:documentType', settingsController_1.getSequence);
router.put('/sequences/:documentType', settingsController_1.updateSequence);
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
exports.default = router;
//# sourceMappingURL=settingsRoutes.js.map
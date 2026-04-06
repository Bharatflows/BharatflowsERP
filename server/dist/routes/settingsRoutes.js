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
const roleAuth_1 = require("../middleware/roleAuth");
const settingsController_1 = require("../controllers/settingsController");
const devicesController = __importStar(require("../controllers/settings/devicesController"));
const ipWhitelistController = __importStar(require("../controllers/settings/ipWhitelistController"));
const workflowsController = __importStar(require("../controllers/settings/workflowsController"));
const companyController = __importStar(require("../controllers/companyController"));
const usersController = __importStar(require("../controllers/settings/userController"));
const rolesController = __importStar(require("../controllers/settings/roleController"));
const settingsDashboardController = __importStar(require("../controllers/settings/settingsDashboardController"));
const router = express_1.default.Router();
router.use(auth_1.protect);
// ============ Dashboard Stats ============
router.get('/dashboard/stats', settingsDashboardController.getSettingsDashboardStats);
// ============ Company Profile ============
router.get('/company', companyController.getCompany);
router.put('/company', roleAuth_1.requireAdmin, companyController.updateCompany);
// ============ User Profile (Self) ============
const profileController = __importStar(require("../controllers/settings/profileController"));
router.get('/profile', profileController.getProfile);
router.put('/profile', profileController.updateProfile);
router.put('/profile/password', profileController.changePassword);
router.put('/profile/preferences', profileController.updatePreferences);
router.put('/profile/notifications', profileController.updateNotificationSettings);
// ============ Sequence Management ============
router.get('/sequences', settingsController_1.getSequences);
router.post('/sequences/preview', settingsController_1.previewSequence);
router.get('/sequences/:documentType/next', settingsController_1.getNextPreview);
router.get('/sequences/:documentType', settingsController_1.getSequence);
router.put('/sequences/:documentType', roleAuth_1.requireAdmin, settingsController_1.updateSequence);
// ============ Device Management (Admin) ============
router.get('/devices/summary', devicesController.getDeviceSummary);
router.get('/devices', devicesController.getDevices);
router.get('/devices/:id', devicesController.getDevice);
router.post('/devices', devicesController.registerDevice);
router.put('/devices/:id', roleAuth_1.requireAdmin, devicesController.updateDevice);
router.post('/devices/:id/block', roleAuth_1.requireAdmin, devicesController.blockDevice);
router.post('/devices/:id/unblock', roleAuth_1.requireAdmin, devicesController.unblockDevice);
router.delete('/devices/:id', roleAuth_1.requireAdmin, devicesController.deleteDevice);
// ============ IP Whitelisting (Admin) ============
router.get('/ip-whitelist/check/:ip', ipWhitelistController.checkIPWhitelist);
router.get('/ip-whitelist', ipWhitelistController.getIPWhitelist);
router.get('/ip-whitelist/:id', ipWhitelistController.getIPWhitelistEntry);
router.post('/ip-whitelist', roleAuth_1.requireAdmin, ipWhitelistController.addIPToWhitelist);
router.put('/ip-whitelist/:id', roleAuth_1.requireAdmin, ipWhitelistController.updateIPWhitelist);
router.post('/ip-whitelist/:id/toggle', roleAuth_1.requireAdmin, ipWhitelistController.toggleIPWhitelist);
router.delete('/ip-whitelist/:id', roleAuth_1.requireAdmin, ipWhitelistController.removeIPFromWhitelist);
// ============ Approval Workflows (Admin) ============
router.get('/workflows/for-document', workflowsController.getWorkflowForDocument);
router.get('/workflows', workflowsController.getWorkflows);
router.get('/workflows/:id', workflowsController.getWorkflow);
router.post('/workflows', roleAuth_1.requireAdmin, workflowsController.createWorkflow);
router.put('/workflows/:id', roleAuth_1.requireAdmin, workflowsController.updateWorkflow);
router.post('/workflows/:id/toggle', roleAuth_1.requireAdmin, workflowsController.toggleWorkflow);
router.delete('/workflows/:id', roleAuth_1.requireAdmin, workflowsController.deleteWorkflow);
// ============ Role Management (Owner only) ============
router.get('/roles', rolesController.getRoles);
router.post('/roles', roleAuth_1.requireOwner, rolesController.createRole);
router.put('/roles/:id', roleAuth_1.requireOwner, rolesController.updateRole);
router.delete('/roles/:id', roleAuth_1.requireOwner, rolesController.deleteRole);
// ============ User Management (Admin) ============
router.get('/users', usersController.getUsers);
router.post('/users', roleAuth_1.requireAdmin, usersController.inviteUser);
router.put('/users/:id', roleAuth_1.requireAdmin, usersController.updateUser);
router.delete('/users/:id', roleAuth_1.requireAdmin, usersController.deleteUser);
// ============ Admin & Integrity (Admin) ============
const integrityCheckController = __importStar(require("../controllers/settings/integrityCheckController"));
router.post('/integrity-check', roleAuth_1.requireAdmin, integrityCheckController.runIntegrityCheck);
router.get('/integrity-check/history', integrityCheckController.getIntegrityCheckHistory);
router.get('/integrity-check/:id', integrityCheckController.getIntegrityCheckDetails);
// ============ App Configuration (Admin) ============
const appConfigController = __importStar(require("../controllers/settings/appConfigController"));
router.get('/app-config', appConfigController.getAppConfig);
router.put('/app-config', roleAuth_1.requireAdmin, appConfigController.updateAppConfig);
// ============ Industry Defaults (Admin/Owner) ============
router.post('/apply-industry-defaults', roleAuth_1.requireAdmin, settingsController_1.applyIndustryDefaults);
// ============ Security Summary ============
const securitySummaryController = __importStar(require("../controllers/settings/securitySummaryController"));
router.get('/security/summary', securitySummaryController.getSecuritySummary);
// ============ Bulk User Import (Admin) ============
const bulkUserImportController = __importStar(require("../controllers/settings/bulkUserImportController"));
router.post('/users/bulk-import', roleAuth_1.requireAdmin, bulkUserImportController.bulkImportUsers);
router.get('/users/import-template', bulkUserImportController.getImportTemplate);
// ============ Settings Export/Import (Owner) ============
const settingsExportController = __importStar(require("../controllers/settings/settingsExportController"));
router.get('/export', roleAuth_1.requireOwner, settingsExportController.exportSettings);
router.post('/import', roleAuth_1.requireOwner, settingsExportController.importSettings);
// ============ Settings Audit Log (Admin/Owner) ============
const auditLogController = __importStar(require("../controllers/settings/auditLogController"));
router.get('/audit-logs/stats', roleAuth_1.requireAdmin, auditLogController.getAuditLogStats);
router.get('/audit-logs/export', roleAuth_1.requireOwner, auditLogController.exportAuditLogs);
router.get('/audit-logs/:id', roleAuth_1.requireAdmin, auditLogController.getAuditLogDetail);
router.get('/audit-logs', roleAuth_1.requireAdmin, auditLogController.getAuditLogs);
// ============ Settings Approval Workflow (Admin/Owner) ============
const approvalController = __importStar(require("../controllers/settings/approvalController"));
router.get('/approvals/pending-count', roleAuth_1.requireAdmin, approvalController.getPendingCount);
router.get('/approvals', roleAuth_1.requireAdmin, approvalController.getApprovalRequests);
router.post('/approvals/request', approvalController.createApprovalRequest);
router.post('/approvals/:id/approve', roleAuth_1.requireOwner, approvalController.approveRequest);
router.post('/approvals/:id/reject', roleAuth_1.requireOwner, approvalController.rejectRequest);
// General settings endpoint
router.get('/', (req, res) => res.json({ success: true, message: 'Settings API' }));
exports.default = router;
//# sourceMappingURL=settingsRoutes.js.map
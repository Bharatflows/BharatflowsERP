import express from 'express';
import { protect } from '../middleware/auth';
import { requireAdmin, requireOwner, requireSensitiveAccess } from '../middleware/roleAuth';
import { uploadImage, handleUploadError } from '../middleware/upload';
import {
    getSequences,
    getSequence,
    updateSequence,
    previewSequence,
    getNextPreview,
    checkIntegrity,
    applyIndustryDefaults,
} from '../controllers/settingsController';
import * as devicesController from '../controllers/settings/devicesController';
import * as ipWhitelistController from '../controllers/settings/ipWhitelistController';
import * as workflowsController from '../controllers/settings/workflowsController';
import * as companyController from '../controllers/companyController';
import { uploadCompanyLogo } from '../controllers/companyController';
import * as usersController from '../controllers/settings/userController';
import * as rolesController from '../controllers/settings/roleController';
import * as settingsDashboardController from '../controllers/settings/settingsDashboardController';
import * as emailConfigController from '../controllers/settings/emailConfigController';

const router = express.Router();
router.use(protect);

// ============ Dashboard Stats ============
router.get('/dashboard/stats', settingsDashboardController.getSettingsDashboardStats);

// ============ Company Profile ============
router.get('/company', companyController.getCompany);
router.put('/company', requireAdmin, companyController.updateCompany);
router.post('/company/logo', requireAdmin, uploadImage.single('logo'), handleUploadError, uploadCompanyLogo);

// ============ Email Configuration (Per-Company SMTP) ============
router.get('/email-config', emailConfigController.getEmailConfig);
router.post('/email-config', requireAdmin, emailConfigController.saveEmailConfig);
router.post('/email-config/test', requireAdmin, emailConfigController.testEmailConfig);
router.get('/email-config/providers', emailConfigController.getProviderPresets);

// ============ User Profile (Self) ============
import * as profileController from '../controllers/settings/profileController';
router.get('/profile', profileController.getProfile);
router.put('/profile', profileController.updateProfile);
router.put('/profile/password', profileController.changePassword);
router.put('/profile/preferences', profileController.updatePreferences);
router.put('/profile/notifications', profileController.updateNotificationSettings);

// ============ Sequence Management ============
router.get('/sequences', getSequences);
router.post('/sequences/preview', previewSequence);
router.get('/sequences/:documentType/next', getNextPreview);
router.get('/sequences/:documentType', getSequence);
router.put('/sequences/:documentType', requireAdmin, updateSequence);

// ============ Device Management (Admin) ============
router.get('/devices/summary', devicesController.getDeviceSummary);
router.get('/devices', devicesController.getDevices);
router.get('/devices/:id', devicesController.getDevice);
router.post('/devices', devicesController.registerDevice);
router.put('/devices/:id', requireAdmin, devicesController.updateDevice);
router.post('/devices/:id/block', requireAdmin, devicesController.blockDevice);
router.post('/devices/:id/unblock', requireAdmin, devicesController.unblockDevice);
router.delete('/devices/:id', requireAdmin, devicesController.deleteDevice);

// ============ IP Whitelisting (Admin) ============
router.get('/ip-whitelist/check/:ip', ipWhitelistController.checkIPWhitelist);
router.get('/ip-whitelist', ipWhitelistController.getIPWhitelist);
router.get('/ip-whitelist/:id', ipWhitelistController.getIPWhitelistEntry);
router.post('/ip-whitelist', requireAdmin, ipWhitelistController.addIPToWhitelist);
router.put('/ip-whitelist/:id', requireAdmin, ipWhitelistController.updateIPWhitelist);
router.post('/ip-whitelist/:id/toggle', requireAdmin, ipWhitelistController.toggleIPWhitelist);
router.delete('/ip-whitelist/:id', requireAdmin, ipWhitelistController.removeIPFromWhitelist);

// ============ Approval Workflows (Admin) ============
router.get('/workflows/for-document', workflowsController.getWorkflowForDocument);
router.get('/workflows', workflowsController.getWorkflows);
router.get('/workflows/:id', workflowsController.getWorkflow);
router.post('/workflows', requireAdmin, workflowsController.createWorkflow);
router.put('/workflows/:id', requireAdmin, workflowsController.updateWorkflow);
router.post('/workflows/:id/toggle', requireAdmin, workflowsController.toggleWorkflow);
router.delete('/workflows/:id', requireAdmin, workflowsController.deleteWorkflow);

// ============ Role Management (Owner only) ============
router.get('/roles', rolesController.getRoles);
router.post('/roles', requireOwner, rolesController.createRole);
router.put('/roles/:id', requireOwner, rolesController.updateRole);
router.delete('/roles/:id', requireOwner, rolesController.deleteRole);

// ============ User Management (Admin) ============
router.get('/users', usersController.getUsers);
router.post('/users', requireAdmin, usersController.inviteUser);
router.put('/users/:id', requireAdmin, usersController.updateUser);
router.delete('/users/:id', requireAdmin, usersController.deleteUser);

// ============ Admin & Integrity (Admin) ============
import * as integrityCheckController from '../controllers/settings/integrityCheckController';
router.post('/integrity-check', requireAdmin, integrityCheckController.runIntegrityCheck);
router.get('/integrity-check/history', integrityCheckController.getIntegrityCheckHistory);
router.get('/integrity-check/:id', integrityCheckController.getIntegrityCheckDetails);

// ============ App Configuration (Admin) ============
import * as appConfigController from '../controllers/settings/appConfigController';
router.get('/app-config', appConfigController.getAppConfig);
router.put('/app-config', requireAdmin, appConfigController.updateAppConfig);

// ============ Industry Defaults (Admin/Owner) ============
router.post('/apply-industry-defaults', requireAdmin, applyIndustryDefaults);

// ============ Security Summary ============
import * as securitySummaryController from '../controllers/settings/securitySummaryController';
router.get('/security/summary', securitySummaryController.getSecuritySummary);

// ============ Bulk User Import (Admin) ============
import * as bulkUserImportController from '../controllers/settings/bulkUserImportController';
router.post('/users/bulk-import', requireAdmin, bulkUserImportController.bulkImportUsers);
router.get('/users/import-template', bulkUserImportController.getImportTemplate);

// ============ Settings Export/Import (Owner) ============
import * as settingsExportController from '../controllers/settings/settingsExportController';
router.get('/export', requireOwner, settingsExportController.exportSettings);
router.post('/import', requireOwner, settingsExportController.importSettings);

// ============ Settings Audit Log (Admin/Owner) ============
import * as auditLogController from '../controllers/settings/auditLogController';
router.get('/audit-logs/stats', requireAdmin, auditLogController.getAuditLogStats);
router.get('/audit-logs/export', requireOwner, auditLogController.exportAuditLogs);
router.get('/audit-logs/:id', requireAdmin, auditLogController.getAuditLogDetail);
router.get('/audit-logs', requireAdmin, auditLogController.getAuditLogs);

// ============ Settings Approval Workflow (Admin/Owner) ============
import * as approvalController from '../controllers/settings/approvalController';
router.get('/approvals/pending-count', requireAdmin, approvalController.getPendingCount);
router.get('/approvals', requireAdmin, approvalController.getApprovalRequests);
router.post('/approvals/request', approvalController.createApprovalRequest);
router.post('/approvals/:id/approve', requireOwner, approvalController.approveRequest);
router.post('/approvals/:id/reject', requireOwner, approvalController.rejectRequest);

// General settings endpoint
router.get('/', (req, res) => res.json({ success: true, message: 'Settings API' }));

export default router;


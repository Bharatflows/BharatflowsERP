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
const rateLimiter_1 = require("../middleware/rateLimiter");
const gstController = __importStar(require("../controllers/gstController"));
const gstPaymentsController = __importStar(require("../controllers/gst/gstPaymentsController"));
const eInvoiceController = __importStar(require("../controllers/gst/eInvoiceController"));
const eWaybillController = __importStar(require("../controllers/gst/eWaybillController"));
const gstAdditions = __importStar(require("../controllers/gstAdditionsController"));
const router = express_1.default.Router();
router.use(auth_1.protect);
router.use(rateLimiter_1.sensitiveOpsLimiter); // Apply strict rate limiting to all GST endpoints
// GSTR Reports
router.get('/dashboard', gstController.getGSTDashboard);
router.get('/history', gstController.getGSTHistory);
// Export Reports
router.get('/gstr1/excel', gstController.exportGSTR1Excel);
router.get('/gstr3b/excel', gstController.exportGSTR3BExcel);
router.get('/gstr1', gstController.generateGSTR1);
router.get('/gstr3b', gstController.generateGSTR3B);
// New Summary Endpoints for Dashboard
router.get('/reports/gstr1', gstController.getGSTR1ReportSummary);
router.get('/reports/gstr3b', gstController.getGSTR3BReportSummary);
// HSN/SAC Management
router.get('/hsn-summary', gstController.getHSNSummary);
// ITC Ledger
router.get('/itc-ledger', gstController.getITCLedger);
// File GST Return
router.post('/file-return', gstController.fileGSTReturn);
// ============ Live Portal Sync (PrimeSync+) ============
router.post('/sync-gstr2b', gstController.syncGSTR2B);
router.get('/gstr2b-records', gstController.getGSTR2BRecords);
router.post('/invoices/:id/einvoice', gstController.generateEInvoice);
// E-Way Bill (legacy endpoint)
router.post('/eway-bill', gstController.createEWayBill);
// ============ GST Payments ============
router.get('/payments/summary', gstPaymentsController.getPaymentSummary);
router.get('/payments', gstPaymentsController.getGSTPayments);
router.get('/payments/:id', gstPaymentsController.getGSTPayment);
router.post('/payments', gstPaymentsController.createGSTPayment);
router.put('/payments/:id', gstPaymentsController.updateGSTPayment);
router.delete('/payments/:id', gstPaymentsController.deleteGSTPayment);
// ============ E-Invoices ============
router.get('/e-invoices', eInvoiceController.getEInvoices);
router.get('/e-invoices/:id', eInvoiceController.getEInvoice);
router.post('/e-invoices/generate', eInvoiceController.generateEInvoice);
router.put('/e-invoices/:id/status', eInvoiceController.updateEInvoiceStatus);
router.post('/e-invoices/:id/cancel', eInvoiceController.cancelEInvoice);
router.delete('/e-invoices/:id', eInvoiceController.deleteEInvoice);
// ============ E-Waybills ============
router.get('/e-waybills', eWaybillController.getEWaybills);
router.get('/e-waybills/:id', eWaybillController.getEWaybill);
router.post('/e-waybills', eWaybillController.createEWaybill);
router.put('/e-waybills/:id', eWaybillController.updateEWaybill);
router.post('/e-waybills/:id/extend', eWaybillController.extendEWaybill);
router.post('/e-waybills/:id/cancel', eWaybillController.cancelEWaybill);
router.delete('/e-waybills/:id', eWaybillController.deleteEWaybill);
// ============ TDS/TCS ============
router.get('/tds-tcs', gstAdditions.getTDSTCSEntries);
router.post('/tds-tcs', gstAdditions.createTDSTCSEntry);
// ============ GSTR-2B Recon ============
router.get('/gstr-2b', gstAdditions.getGSTR2BRecords);
router.post('/gstr-2b/upload', gstAdditions.uploadGSTR2B);
router.put('/gstr-2b/:id/reconcile', gstAdditions.reconcileGSTR2B);
// ============ P2: GST Amendments ============
router.get('/amendments', gstController.getAmendments);
router.post('/amendments', gstController.createAmendment);
// ============ P2: B2C Large & Exports ============
router.get('/gstr1-extended', gstController.getGSTR1Extended);
exports.default = router;
//# sourceMappingURL=gstRoutes.js.map
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
const gstController = __importStar(require("../controllers/gstController"));
const gstPaymentsController = __importStar(require("../controllers/gst/gstPaymentsController"));
const eInvoiceController = __importStar(require("../controllers/gst/eInvoiceController"));
const eWaybillController = __importStar(require("../controllers/gst/eWaybillController"));
const router = express_1.default.Router();
router.use(auth_1.protect);
// GSTR Reports
router.get('/dashboard', gstController.getGSTDashboard);
router.get('/gstr1', gstController.generateGSTR1);
router.get('/gstr3b', gstController.generateGSTR3B);
// HSN/SAC Management
router.get('/hsn-summary', gstController.getHSNSummary);
// ITC Ledger
router.get('/itc-ledger', gstController.getITCLedger);
// File GST Return
router.post('/file-return', gstController.fileGSTReturn);
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
exports.default = router;
//# sourceMappingURL=gstRoutes.js.map
import express from 'express';
import { protect } from '../middleware/auth';
import { sensitiveOpsLimiter } from '../middleware/rateLimiter';
import * as gstController from '../controllers/gstController';
import * as gstPaymentsController from '../controllers/gst/gstPaymentsController';
import * as eInvoiceController from '../controllers/gst/eInvoiceController';
import * as eWaybillController from '../controllers/gst/eWaybillController';
import * as gstAdditions from '../controllers/gstAdditionsController';

const router = express.Router();
router.use(protect);
router.use(sensitiveOpsLimiter); // Apply strict rate limiting to all GST endpoints

// GSTR Reports
router.get('/dashboard', gstController.getGSTDashboard as any);
router.get('/history', gstController.getGSTHistory as any);
// Export Reports
router.get('/gstr1/excel', gstController.exportGSTR1Excel as any);
router.get('/gstr3b/excel', gstController.exportGSTR3BExcel as any);

router.get('/gstr1', gstController.generateGSTR1 as any);
router.get('/gstr3b', gstController.generateGSTR3B as any);

// New Summary Endpoints for Dashboard
router.get('/reports/gstr1', gstController.getGSTR1ReportSummary as any);
router.get('/reports/gstr3b', gstController.getGSTR3BReportSummary as any);

// HSN/SAC Management
router.get('/hsn-summary', gstController.getHSNSummary as any);

// ITC Ledger
router.get('/itc-ledger', gstController.getITCLedger as any);

// File GST Return
router.post('/file-return', gstController.fileGSTReturn as any);

// ============ Live Portal Sync (PrimeSync+) ============
router.post('/sync-gstr2b', gstController.syncGSTR2B as any);
router.get('/gstr2b-records', gstController.getGSTR2BRecords as any);
router.post('/invoices/:id/einvoice', gstController.generateEInvoice as any);

// E-Way Bill (legacy endpoint)
router.post('/eway-bill', gstController.createEWayBill as any);

// ============ GST Payments ============
router.get('/payments/summary', gstPaymentsController.getPaymentSummary as any);
router.get('/payments', gstPaymentsController.getGSTPayments as any);
router.get('/payments/:id', gstPaymentsController.getGSTPayment as any);
router.post('/payments', gstPaymentsController.createGSTPayment as any);
router.put('/payments/:id', gstPaymentsController.updateGSTPayment as any);
router.delete('/payments/:id', gstPaymentsController.deleteGSTPayment as any);

// ============ E-Invoices ============
router.get('/e-invoices', eInvoiceController.getEInvoices as any);
router.get('/e-invoices/:id', eInvoiceController.getEInvoice as any);
router.post('/e-invoices/generate', eInvoiceController.generateEInvoice as any);
router.put('/e-invoices/:id/status', eInvoiceController.updateEInvoiceStatus as any);
router.post('/e-invoices/:id/cancel', eInvoiceController.cancelEInvoice as any);
router.delete('/e-invoices/:id', eInvoiceController.deleteEInvoice as any);

// ============ E-Waybills ============
router.get('/e-waybills', eWaybillController.getEWaybills as any);
router.get('/e-waybills/:id', eWaybillController.getEWaybill as any);
router.post('/e-waybills', eWaybillController.createEWaybill as any);
router.put('/e-waybills/:id', eWaybillController.updateEWaybill as any);
router.post('/e-waybills/:id/extend', eWaybillController.extendEWaybill as any);
router.post('/e-waybills/:id/cancel', eWaybillController.cancelEWaybill as any);
router.delete('/e-waybills/:id', eWaybillController.deleteEWaybill as any);

// ============ TDS/TCS ============
router.get('/tds-tcs', gstAdditions.getTDSTCSEntries as any);
router.post('/tds-tcs', gstAdditions.createTDSTCSEntry as any);

// ============ GSTR-2B Recon ============
router.get('/gstr-2b', gstAdditions.getGSTR2BRecords as any);
router.post('/gstr-2b/upload', gstAdditions.uploadGSTR2B as any);
router.put('/gstr-2b/:id/reconcile', gstAdditions.reconcileGSTR2B as any);

// ============ P2: GST Amendments ============
router.get('/amendments', gstController.getAmendments as any);
router.post('/amendments', gstController.createAmendment as any);

// ============ P2: B2C Large & Exports ============
router.get('/gstr1-extended', gstController.getGSTR1Extended as any);

export default router;

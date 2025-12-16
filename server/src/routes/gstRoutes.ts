import express from 'express';
import { protect } from '../middleware/auth';
import * as gstController from '../controllers/gstController';
import * as gstPaymentsController from '../controllers/gst/gstPaymentsController';
import * as eInvoiceController from '../controllers/gst/eInvoiceController';
import * as eWaybillController from '../controllers/gst/eWaybillController';

const router = express.Router();
router.use(protect);

// GSTR Reports
router.get('/dashboard', gstController.getGSTDashboard);
// Export Reports
router.get('/gstr1/excel', gstController.exportGSTR1Excel);
router.get('/gstr3b/excel', gstController.exportGSTR3BExcel);
// router.get('/gstr1/json', gstController.exportGSTR1JSON); // Placeholder

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

export default router;

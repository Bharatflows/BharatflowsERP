import { Router } from 'express';
import { protect } from '../middleware/auth';
import { validateFinancialYear } from '../middleware/validateFinancialYear';  // P0: FY locking
import { checkCustomRole } from '../middleware/customRoleMiddleware';  // C3: Custom role enforcement
import validate from '../middleware/validate';  // Audit Fix: Zod validation
import { createSalesOrderSchema, updateSalesOrderSchema } from '../schemas/sales.schema';  // Audit Fix
import ensureOwnership from '../middleware/ensureOwnership';  // Audit Fix: Cross-tenant security
import * as salesController from '../controllers/sales';
import * as estimatesController from '../controllers/estimatesController';
import * as salesOrdersController from '../controllers/salesOrdersController';
import * as deliveryChallanController from '../controllers/deliveryChallanController';
import * as creditNoteController from '../controllers/sales/creditNoteController';
import * as invoiceOCRController from '../controllers/sales/invoiceOCRController'; // Import OCR controller

const router = Router();

// Apply auth middleware to all routes
router.use(protect);

// Invoice routes
// C3 FIX: Apply custom role permissions to all CRUD operations
router.post('/invoices/ocr', checkCustomRole('sales', 'create'), invoiceOCRController.scanInvoice); // OCR Endpoint
router.get('/invoices', checkCustomRole('sales', 'read'), salesController.getInvoices);
router.get('/invoices/search', checkCustomRole('sales', 'read'), salesController.searchInvoices);
router.get('/invoices/:id', checkCustomRole('sales', 'read'), salesController.getInvoice);
// P0: Validate FY before creating/updating invoices
router.post('/invoices', checkCustomRole('sales', 'create'), validateFinancialYear('invoiceDate'), salesController.createInvoice);
router.put('/invoices/:id', checkCustomRole('sales', 'update'), validateFinancialYear('invoiceDate'), salesController.updateInvoice);
router.delete('/invoices/:id', checkCustomRole('sales', 'delete'), salesController.deleteInvoice);
router.post('/invoices/:id/payment', checkCustomRole('sales', 'update'), salesController.recordPayment);
router.put('/invoices/:id/status', checkCustomRole('sales', 'update'), salesController.updateInvoiceStatus);
router.get('/invoices/:id/pdf', checkCustomRole('sales', 'export'), salesController.downloadInvoicePDF);
router.post('/invoices/:id/send', checkCustomRole('sales', 'update'), salesController.sendInvoiceEmail);

// Estimate routes
router.get('/estimates', estimatesController.getEstimates);
router.get('/estimates/:id', estimatesController.getEstimate);
router.post('/estimates', estimatesController.createEstimate);
router.put('/estimates/:id', estimatesController.updateEstimate);
router.delete('/estimates/:id', estimatesController.deleteEstimate);
router.post('/estimates/:id/convert', estimatesController.convertEstimateToInvoice);

// Sales Order routes - AUDIT FIX: Added Zod validation + Cross-tenant check
router.get('/orders', salesOrdersController.getSalesOrders);
router.get('/orders/:id', salesOrdersController.getSalesOrder);
router.post('/orders', validate(createSalesOrderSchema), ensureOwnership('Party', 'customerId'), salesOrdersController.createSalesOrder);
router.put('/orders/:id', validate(updateSalesOrderSchema), salesOrdersController.updateSalesOrder);
router.delete('/orders/:id', salesOrdersController.deleteSalesOrder);
router.post('/orders/:id/convert', salesOrdersController.convertSalesOrderToInvoice);

// Delivery Challan routes
router.get('/challans', deliveryChallanController.getDeliveryChallans);
router.get('/challans/search', deliveryChallanController.searchDeliveryChallans);
router.get('/challans/:id', deliveryChallanController.getDeliveryChallan);
router.post('/challans', deliveryChallanController.createDeliveryChallan);
router.put('/challans/:id', deliveryChallanController.updateDeliveryChallan);
router.delete('/challans/:id', deliveryChallanController.deleteDeliveryChallan);
router.post('/challans/:id/convert', deliveryChallanController.convertChallanToInvoice);

import * as quotationsController from '../controllers/quotationsController';

// Quotation routes
router.get('/quotations', quotationsController.getQuotations);
router.get('/quotations/:id', quotationsController.getQuotation);
router.post('/quotations', quotationsController.createQuotation);
router.put('/quotations/:id', quotationsController.updateQuotation);
router.delete('/quotations/:id', quotationsController.deleteQuotation);
router.post('/quotations/:id/convert', quotationsController.convertQuotationToSalesOrder);
router.get('/analytics', quotationsController.getSalesAnalytics);

// Credit Note routes
// P0: Validate FY before creating credit notes
router.get('/credit-notes', creditNoteController.getCreditNotes);
router.get('/credit-notes/:id', creditNoteController.getCreditNote);
router.post('/credit-notes', validateFinancialYear('creditNoteDate'), creditNoteController.createCreditNote);
router.delete('/credit-notes/:id', creditNoteController.deleteCreditNote);

export default router;


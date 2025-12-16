import { Router } from 'express';
import { protect } from '../middleware/auth';
import * as salesController from '../controllers/sales';
import * as estimatesController from '../controllers/estimatesController';
import * as salesOrdersController from '../controllers/salesOrdersController';
import * as deliveryChallanController from '../controllers/deliveryChallanController';
import * as creditNoteController from '../controllers/sales/creditNoteController';

const router = Router();

// Apply auth middleware to all routes
router.use(protect);

// Invoice routes
router.get('/invoices', salesController.getInvoices);
router.get('/invoices/search', salesController.searchInvoices);
router.get('/invoices/:id', salesController.getInvoice);
router.post('/invoices', salesController.createInvoice);
router.put('/invoices/:id', salesController.updateInvoice);
router.delete('/invoices/:id', salesController.deleteInvoice);
router.post('/invoices/:id/payment', salesController.recordPayment);
router.put('/invoices/:id/status', salesController.updateInvoiceStatus);
router.get('/invoices/:id/pdf', salesController.downloadInvoicePDF);
router.post('/invoices/:id/send', salesController.sendInvoiceEmail);

// Estimate routes
router.get('/estimates', estimatesController.getEstimates);
router.get('/estimates/:id', estimatesController.getEstimate);
router.post('/estimates', estimatesController.createEstimate);
router.put('/estimates/:id', estimatesController.updateEstimate);
router.delete('/estimates/:id', estimatesController.deleteEstimate);
router.post('/estimates/:id/convert', estimatesController.convertEstimateToInvoice);

// Sales Order routes
router.get('/orders', salesOrdersController.getSalesOrders);
router.get('/orders/:id', salesOrdersController.getSalesOrder);
router.post('/orders', salesOrdersController.createSalesOrder);
router.put('/orders/:id', salesOrdersController.updateSalesOrder);
router.delete('/orders/:id', salesOrdersController.deleteSalesOrder);
router.post('/orders/:id/convert', salesOrdersController.convertSalesOrderToInvoice);

// Delivery Challan routes
router.get('/challans', deliveryChallanController.getDeliveryChallans);
router.get('/challans/search', deliveryChallanController.searchDeliveryChallans);
router.get('/challans/:id', deliveryChallanController.getDeliveryChallan);
router.post('/challans', deliveryChallanController.createDeliveryChallan);
router.put('/challans/:id', deliveryChallanController.updateDeliveryChallan);
router.delete('/challans/:id', deliveryChallanController.deleteDeliveryChallan);

import * as quotationsController from '../controllers/quotationsController';

// Quotation routes
router.get('/quotations', quotationsController.getQuotations);
router.get('/quotations/:id', quotationsController.getQuotation);
router.post('/quotations', quotationsController.createQuotation);
router.put('/quotations/:id', quotationsController.updateQuotation);
router.delete('/quotations/:id', quotationsController.deleteQuotation);
router.post('/quotations/:id/convert', quotationsController.convertQuotationToSalesOrder);

// Credit Note routes
router.get('/credit-notes', creditNoteController.getCreditNotes);
router.get('/credit-notes/:id', creditNoteController.getCreditNote);
router.post('/credit-notes', creditNoteController.createCreditNote);
router.delete('/credit-notes/:id', creditNoteController.deleteCreditNote);

export default router;


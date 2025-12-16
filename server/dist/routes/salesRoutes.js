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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const salesController = __importStar(require("../controllers/sales"));
const estimatesController = __importStar(require("../controllers/estimatesController"));
const salesOrdersController = __importStar(require("../controllers/salesOrdersController"));
const deliveryChallanController = __importStar(require("../controllers/deliveryChallanController"));
const router = (0, express_1.Router)();
// Apply auth middleware to all routes
router.use(auth_1.protect);
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
const quotationsController = __importStar(require("../controllers/quotationsController"));
// Quotation routes
router.get('/quotations', quotationsController.getQuotations);
router.get('/quotations/:id', quotationsController.getQuotation);
router.post('/quotations', quotationsController.createQuotation);
router.put('/quotations/:id', quotationsController.updateQuotation);
router.delete('/quotations/:id', quotationsController.deleteQuotation);
router.post('/quotations/:id/convert', quotationsController.convertQuotationToSalesOrder);
exports.default = router;
//# sourceMappingURL=salesRoutes.js.map
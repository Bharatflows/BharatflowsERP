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
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const validateFinancialYear_1 = require("../middleware/validateFinancialYear"); // P0: FY locking
const customRoleMiddleware_1 = require("../middleware/customRoleMiddleware"); // C3: Custom role enforcement
const validate_1 = __importDefault(require("../middleware/validate")); // Audit Fix: Zod validation
const sales_schema_1 = require("../schemas/sales.schema"); // Audit Fix
const ensureOwnership_1 = __importDefault(require("../middleware/ensureOwnership")); // Audit Fix: Cross-tenant security
const salesController = __importStar(require("../controllers/sales"));
const estimatesController = __importStar(require("../controllers/estimatesController"));
const salesOrdersController = __importStar(require("../controllers/salesOrdersController"));
const deliveryChallanController = __importStar(require("../controllers/deliveryChallanController"));
const creditNoteController = __importStar(require("../controllers/sales/creditNoteController"));
const invoiceOCRController = __importStar(require("../controllers/sales/invoiceOCRController")); // Import OCR controller
const router = (0, express_1.Router)();
// Apply auth middleware to all routes
router.use(auth_1.protect);
// Invoice routes
// C3 FIX: Apply custom role permissions to all CRUD operations
router.post('/invoices/ocr', (0, customRoleMiddleware_1.checkCustomRole)('sales', 'create'), invoiceOCRController.scanInvoice); // OCR Endpoint
router.get('/invoices', (0, customRoleMiddleware_1.checkCustomRole)('sales', 'read'), salesController.getInvoices);
router.get('/invoices/search', (0, customRoleMiddleware_1.checkCustomRole)('sales', 'read'), salesController.searchInvoices);
router.get('/invoices/:id', (0, customRoleMiddleware_1.checkCustomRole)('sales', 'read'), salesController.getInvoice);
// P0: Validate FY before creating/updating invoices
router.post('/invoices', (0, customRoleMiddleware_1.checkCustomRole)('sales', 'create'), (0, validateFinancialYear_1.validateFinancialYear)('invoiceDate'), salesController.createInvoice);
router.put('/invoices/:id', (0, customRoleMiddleware_1.checkCustomRole)('sales', 'update'), (0, validateFinancialYear_1.validateFinancialYear)('invoiceDate'), salesController.updateInvoice);
router.delete('/invoices/:id', (0, customRoleMiddleware_1.checkCustomRole)('sales', 'delete'), salesController.deleteInvoice);
router.post('/invoices/:id/payment', (0, customRoleMiddleware_1.checkCustomRole)('sales', 'update'), salesController.recordPayment);
router.put('/invoices/:id/status', (0, customRoleMiddleware_1.checkCustomRole)('sales', 'update'), salesController.updateInvoiceStatus);
router.get('/invoices/:id/pdf', (0, customRoleMiddleware_1.checkCustomRole)('sales', 'export'), salesController.downloadInvoicePDF);
router.post('/invoices/:id/send', (0, customRoleMiddleware_1.checkCustomRole)('sales', 'update'), salesController.sendInvoiceEmail);
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
router.post('/orders', (0, validate_1.default)(sales_schema_1.createSalesOrderSchema), (0, ensureOwnership_1.default)('Party', 'customerId'), salesOrdersController.createSalesOrder);
router.put('/orders/:id', (0, validate_1.default)(sales_schema_1.updateSalesOrderSchema), salesOrdersController.updateSalesOrder);
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
const quotationsController = __importStar(require("../controllers/quotationsController"));
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
router.post('/credit-notes', (0, validateFinancialYear_1.validateFinancialYear)('creditNoteDate'), creditNoteController.createCreditNote);
router.delete('/credit-notes/:id', creditNoteController.deleteCreditNote);
exports.default = router;
//# sourceMappingURL=salesRoutes.js.map
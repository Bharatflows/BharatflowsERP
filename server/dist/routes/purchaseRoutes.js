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
const validateFinancialYear_1 = require("../middleware/validateFinancialYear"); // P0: FY locking
const customRoleMiddleware_1 = require("../middleware/customRoleMiddleware"); // C3: Custom role enforcement
const purchase_1 = require("../controllers/purchase");
const debitNoteController = __importStar(require("../controllers/purchase/debitNoteController"));
const router = express_1.default.Router();
router.use(auth_1.protect);
// Purchase Bills routes (must come BEFORE /:id route)
// P0: Validate FY before creating/updating bills
// C3 FIX: Apply custom role permissions
router.get('/bills', (0, customRoleMiddleware_1.checkCustomRole)('purchase', 'read'), purchase_1.getPurchaseBills);
router.post('/bills', (0, customRoleMiddleware_1.checkCustomRole)('purchase', 'create'), (0, validateFinancialYear_1.validateFinancialYear)('billDate'), purchase_1.createPurchaseBill);
router.get('/bills/:id', (0, customRoleMiddleware_1.checkCustomRole)('purchase', 'read'), purchase_1.getPurchaseBill);
router.put('/bills/:id', (0, customRoleMiddleware_1.checkCustomRole)('purchase', 'update'), (0, validateFinancialYear_1.validateFinancialYear)('billDate'), purchase_1.updatePurchaseBill);
router.delete('/bills/:id', (0, customRoleMiddleware_1.checkCustomRole)('purchase', 'delete'), purchase_1.deletePurchaseBill);
// GRN routes (must come BEFORE /:id route)
router.route('/grn')
    .get(purchase_1.getGRNs)
    .post(purchase_1.createGRN);
router.route('/grn/:id')
    .get(purchase_1.getGRN)
    .put(purchase_1.updateGRN)
    .delete(purchase_1.deleteGRN);
// Debit Note routes
// P0: Validate FY before creating debit notes
router.get('/debit-notes', debitNoteController.getDebitNotes);
router.post('/debit-notes', (0, validateFinancialYear_1.validateFinancialYear)('debitNoteDate'), debitNoteController.createDebitNote);
router.get('/debit-notes/:id', debitNoteController.getDebitNote);
router.delete('/debit-notes/:id', debitNoteController.deleteDebitNote);
// Purchase Orders routes (generic routes come LAST)
router.route('/')
    .get(purchase_1.getPurchaseOrders)
    .post(purchase_1.createPurchaseOrder);
// Status update route (must come before /:id)
router.patch('/:id/status', purchase_1.updatePurchaseOrderStatus);
// Conversion routes (must come before /:id)
router.post('/:id/convert-to-grn', purchase_1.convertPOToGRN);
router.post('/:id/convert-to-bill', purchase_1.convertPOToBill);
router.route('/:id')
    .get(purchase_1.getPurchaseOrder)
    .put(purchase_1.updatePurchaseOrder)
    .delete(purchase_1.deletePurchaseOrder);
exports.default = router;
//# sourceMappingURL=purchaseRoutes.js.map
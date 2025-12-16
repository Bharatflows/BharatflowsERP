"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const purchase_1 = require("../controllers/purchase");
const router = express_1.default.Router();
router.use(auth_1.protect);
// Purchase Bills routes (must come BEFORE /:id route)
router.route('/bills')
    .get(purchase_1.getPurchaseBills)
    .post(purchase_1.createPurchaseBill);
router.route('/bills/:id')
    .get(purchase_1.getPurchaseBill)
    .put(purchase_1.updatePurchaseBill)
    .delete(purchase_1.deletePurchaseBill);
// GRN routes (must come BEFORE /:id route)
router.route('/grn')
    .get(purchase_1.getGRNs)
    .post(purchase_1.createGRN);
router.route('/grn/:id')
    .get(purchase_1.getGRN)
    .put(purchase_1.updateGRN)
    .delete(purchase_1.deleteGRN);
// Purchase Orders routes (generic routes come LAST)
router.route('/')
    .get(purchase_1.getPurchaseOrders)
    .post(purchase_1.createPurchaseOrder);
// Status update route (must come before /:id)
router.patch('/:id/status', purchase_1.updatePurchaseOrderStatus);
router.route('/:id')
    .get(purchase_1.getPurchaseOrder)
    .put(purchase_1.updatePurchaseOrder)
    .delete(purchase_1.deletePurchaseOrder);
exports.default = router;
//# sourceMappingURL=purchaseRoutes.js.map
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
const productsController_1 = require("../controllers/productsController");
const inventoryController = __importStar(require("../controllers/inventory"));
const manufacturingController = __importStar(require("../controllers/inventory/manufacturingController"));
const inventoryAdditions = __importStar(require("../controllers/inventoryAdditionsController"));
const router = express_1.default.Router();
router.use(auth_1.protect);
// Product routes (existing)
router.route('/products')
    .get(productsController_1.getProducts)
    .post(productsController_1.createProduct);
router.get('/products/barcode/:barcode', productsController_1.getProductByBarcode);
router.route('/products/:id')
    .get(productsController_1.getProductById)
    .put(productsController_1.updateProduct);
// Stock adjustment
const stockAdjustmentController = __importStar(require("../controllers/inventory/stockAdjustmentController"));
const auth_2 = require("../middleware/auth");
router.post('/adjust-stock', (0, auth_2.checkCustomRole)('inventory.manage'), inventoryController.adjustStock); // Existing single-item
router.route('/stock-adjustments')
    .get((0, auth_2.checkCustomRole)('inventory.view'), stockAdjustmentController.getStockAdjustments)
    .post((0, auth_2.checkCustomRole)('inventory.manage'), stockAdjustmentController.createStockAdjustment);
router.route('/stock-adjustments/:id')
    .get((0, auth_2.checkCustomRole)('inventory.view'), stockAdjustmentController.getStockAdjustmentById)
    .delete((0, auth_2.checkCustomRole)('inventory.manage'), stockAdjustmentController.deleteStockAdjustment);
// Low stock alerts
router.get('/low-stock', (0, auth_2.checkCustomRole)('inventory.view'), inventoryController.getLowStock);
// Stock transfers
router.post('/transfer-stock', (0, auth_2.checkCustomRole)('inventory.manage'), inventoryController.transferStock);
// Stock history
router.get('/stock-history/:productId', (0, auth_2.checkCustomRole)('inventory.view'), inventoryController.getStockHistory);
router.get('/stock-movements', (0, auth_2.checkCustomRole)('inventory.view'), inventoryController.getStockMovements);
// Warehouse management
router.route('/warehouses')
    .get((0, auth_2.checkCustomRole)('inventory.view'), inventoryController.getWarehouses)
    .post((0, auth_2.checkCustomRole)('inventory.manage'), inventoryController.createWarehouse);
router.route('/warehouses/:id')
    .put((0, auth_2.checkCustomRole)('inventory.manage'), inventoryController.updateWarehouse)
    .delete((0, auth_2.checkCustomRole)('inventory.manage'), inventoryController.deleteWarehouse);
// Inventory valuation
router.get('/valuation', (0, auth_2.checkCustomRole)('inventory.view_valuation'), inventoryController.getInventoryValuation);
// Batch tracking
router.post('/stock/batches', (0, auth_2.checkCustomRole)('inventory.manage'), inventoryController.createBatch);
router.get('/stock/batches/:productId', (0, auth_2.checkCustomRole)('inventory.view'), inventoryController.getBatches);
// Manufacturing
router.post('/manufacturing/run', (0, auth_2.checkCustomRole)('manufacturing.manage'), manufacturingController.createManufacturingRun);
// Unit Conversion
router.route('/unit-conversions')
    .get((0, auth_2.checkCustomRole)('inventory.view'), inventoryAdditions.getUnitConversions)
    .post((0, auth_2.checkCustomRole)('inventory.manage'), inventoryAdditions.createUnitConversion);
router.delete('/unit-conversions/:id', (0, auth_2.checkCustomRole)('inventory.manage'), inventoryAdditions.deleteUnitConversion);
// Serial Tracking
router.get('/serial-numbers', (0, auth_2.checkCustomRole)('inventory.view'), inventoryAdditions.getSerialNumbers);
router.put('/serial-numbers/:id', (0, auth_2.checkCustomRole)('inventory.manage'), inventoryAdditions.updateSerialNumber);
exports.default = router;
//# sourceMappingURL=inventoryRoutes.js.map
import express, { RequestHandler } from 'express';
import { protect } from '../middleware/auth';
import { createProduct, getProducts, getProductById, updateProduct, getProductByBarcode } from '../controllers/productsController';
import * as inventoryController from '../controllers/inventory';
import * as manufacturingController from '../controllers/inventory/manufacturingController';
import * as inventoryAdditions from '../controllers/inventoryAdditionsController';

const router = express.Router();
router.use(protect);

// Product routes (existing)
router.route('/products')
    .get(getProducts as unknown as RequestHandler)
    .post(createProduct as unknown as RequestHandler);

router.get('/products/barcode/:barcode', getProductByBarcode as unknown as RequestHandler);

router.route('/products/:id')
    .get(getProductById as unknown as RequestHandler)
    .put(updateProduct as unknown as RequestHandler);

// Stock adjustment
import * as stockAdjustmentController from '../controllers/inventory/stockAdjustmentController';
import { checkCustomRole } from '../middleware/auth';

router.post('/adjust-stock', checkCustomRole('inventory.manage'), inventoryController.adjustStock as unknown as RequestHandler); // Existing single-item

router.route('/stock-adjustments')
    .get(checkCustomRole('inventory.view'), stockAdjustmentController.getStockAdjustments as unknown as RequestHandler)
    .post(checkCustomRole('inventory.manage'), stockAdjustmentController.createStockAdjustment as unknown as RequestHandler);

router.route('/stock-adjustments/:id')
    .get(checkCustomRole('inventory.view'), stockAdjustmentController.getStockAdjustmentById as unknown as RequestHandler)
    .delete(checkCustomRole('inventory.manage'), stockAdjustmentController.deleteStockAdjustment as unknown as RequestHandler);

// Low stock alerts
router.get('/low-stock', checkCustomRole('inventory.view'), inventoryController.getLowStock as unknown as RequestHandler);

// Stock transfers
router.post('/transfer-stock', checkCustomRole('inventory.manage'), inventoryController.transferStock as unknown as RequestHandler);

// Stock history
router.get('/stock-history/:productId', checkCustomRole('inventory.view'), inventoryController.getStockHistory as unknown as RequestHandler);
router.get('/stock-movements', checkCustomRole('inventory.view'), inventoryController.getStockMovements as unknown as RequestHandler);

// Warehouse management
router.route('/warehouses')
    .get(checkCustomRole('inventory.view'), inventoryController.getWarehouses as unknown as RequestHandler)
    .post(checkCustomRole('inventory.manage'), inventoryController.createWarehouse as unknown as RequestHandler);

router.route('/warehouses/:id')
    .put(checkCustomRole('inventory.manage'), inventoryController.updateWarehouse as unknown as RequestHandler)
    .delete(checkCustomRole('inventory.manage'), inventoryController.deleteWarehouse as unknown as RequestHandler);

// Inventory valuation
router.get('/valuation', checkCustomRole('inventory.view_valuation'), inventoryController.getInventoryValuation as unknown as RequestHandler);

// Batch tracking
router.post('/stock/batches', checkCustomRole('inventory.manage'), inventoryController.createBatch as unknown as RequestHandler);
router.get('/stock/batches/:productId', checkCustomRole('inventory.view'), inventoryController.getBatches as unknown as RequestHandler);

// Manufacturing
router.post('/manufacturing/run', checkCustomRole('manufacturing.manage'), manufacturingController.createManufacturingRun as unknown as RequestHandler);

// Unit Conversion
router.route('/unit-conversions')
    .get(checkCustomRole('inventory.view'), inventoryAdditions.getUnitConversions as unknown as RequestHandler)
    .post(checkCustomRole('inventory.manage'), inventoryAdditions.createUnitConversion as unknown as RequestHandler);

router.delete('/unit-conversions/:id', checkCustomRole('inventory.manage'), inventoryAdditions.deleteUnitConversion as unknown as RequestHandler);

// Serial Tracking
router.get('/serial-numbers', checkCustomRole('inventory.view'), inventoryAdditions.getSerialNumbers as unknown as RequestHandler);
router.put('/serial-numbers/:id', checkCustomRole('inventory.manage'), inventoryAdditions.updateSerialNumber as unknown as RequestHandler);

export default router;

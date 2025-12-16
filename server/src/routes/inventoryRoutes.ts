import express from 'express';
import { protect } from '../middleware/auth';
import { createProduct, getProducts, getProductById, updateProduct } from '../controllers/productsController';
import * as inventoryController from '../controllers/inventory';
import * as manufacturingController from '../controllers/inventory/manufacturingController';

const router = express.Router();
router.use(protect);

// Product routes (existing)
router.route('/products')
    .get(getProducts)
    .post(createProduct);

router.route('/products/:id')
    .get(getProductById)
    .put(updateProduct);

// Stock adjustment
router.post('/adjust-stock', inventoryController.adjustStock);

// Low stock alerts
router.get('/low-stock', inventoryController.getLowStock);

// Stock transfers
router.post('/transfer-stock', inventoryController.transferStock);

// Stock history
router.get('/stock-history/:productId', inventoryController.getStockHistory);
router.get('/stock-movements', inventoryController.getStockMovements);

// Warehouse management
router.route('/warehouses')
    .get(inventoryController.getWarehouses)
    .post(inventoryController.createWarehouse);

router.route('/warehouses/:id')
    .put(inventoryController.updateWarehouse)
    .delete(inventoryController.deleteWarehouse);

// Inventory valuation
router.get('/valuation', inventoryController.getInventoryValuation);

// Batch tracking
router.post('/stock/batches', inventoryController.createBatch);
router.get('/stock/batches/:productId', inventoryController.getBatches);

// Manufacturing
router.post('/manufacturing/run', manufacturingController.createManufacturingRun);

export default router;

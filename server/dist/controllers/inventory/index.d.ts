/**
 * Inventory Controllers - Re-exports
 *
 * This file re-exports all inventory-related controllers for backward compatibility.
 * The original inventoryController.ts has been split into:
 * - stockController.ts (adjustments, transfers, movements, valuation)
 * - warehouseController.ts (CRUD)
 */
export { adjustStock, getLowStock, transferStock, getStockHistory, getStockMovements, getInventoryValuation } from './stockController';
export { createWarehouse, getWarehouses, updateWarehouse, deleteWarehouse } from './warehouseController';
//# sourceMappingURL=index.d.ts.map
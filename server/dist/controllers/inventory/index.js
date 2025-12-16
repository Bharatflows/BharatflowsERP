"use strict";
/**
 * Inventory Controllers - Re-exports
 *
 * This file re-exports all inventory-related controllers for backward compatibility.
 * The original inventoryController.ts has been split into:
 * - stockController.ts (adjustments, transfers, movements, valuation)
 * - warehouseController.ts (CRUD)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteWarehouse = exports.updateWarehouse = exports.getWarehouses = exports.createWarehouse = exports.getInventoryValuation = exports.getStockMovements = exports.getStockHistory = exports.transferStock = exports.getLowStock = exports.adjustStock = void 0;
// Stock Operations
var stockController_1 = require("./stockController");
Object.defineProperty(exports, "adjustStock", { enumerable: true, get: function () { return stockController_1.adjustStock; } });
Object.defineProperty(exports, "getLowStock", { enumerable: true, get: function () { return stockController_1.getLowStock; } });
Object.defineProperty(exports, "transferStock", { enumerable: true, get: function () { return stockController_1.transferStock; } });
Object.defineProperty(exports, "getStockHistory", { enumerable: true, get: function () { return stockController_1.getStockHistory; } });
Object.defineProperty(exports, "getStockMovements", { enumerable: true, get: function () { return stockController_1.getStockMovements; } });
Object.defineProperty(exports, "getInventoryValuation", { enumerable: true, get: function () { return stockController_1.getInventoryValuation; } });
// Warehouse CRUD
var warehouseController_1 = require("./warehouseController");
Object.defineProperty(exports, "createWarehouse", { enumerable: true, get: function () { return warehouseController_1.createWarehouse; } });
Object.defineProperty(exports, "getWarehouses", { enumerable: true, get: function () { return warehouseController_1.getWarehouses; } });
Object.defineProperty(exports, "updateWarehouse", { enumerable: true, get: function () { return warehouseController_1.updateWarehouse; } });
Object.defineProperty(exports, "deleteWarehouse", { enumerable: true, get: function () { return warehouseController_1.deleteWarehouse; } });
//# sourceMappingURL=index.js.map
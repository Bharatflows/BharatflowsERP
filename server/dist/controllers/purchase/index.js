"use strict";
/**
 * Purchase Controllers - Re-exports
 *
 * This file re-exports all purchase-related controllers for backward compatibility.
 * The original purchaseController.ts has been split into:
 * - purchaseOrderController.ts
 * - purchaseBillController.ts
 * - grnController.ts
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteGRN = exports.updateGRN = exports.createGRN = exports.getGRN = exports.getGRNs = exports.deletePurchaseBill = exports.updatePurchaseBill = exports.createPurchaseBill = exports.getPurchaseBill = exports.getPurchaseBills = exports.updatePurchaseOrderStatus = exports.deletePurchaseOrder = exports.updatePurchaseOrder = exports.createPurchaseOrder = exports.getPurchaseOrder = exports.getPurchaseOrders = void 0;
// Purchase Orders
var purchaseOrderController_1 = require("./purchaseOrderController");
Object.defineProperty(exports, "getPurchaseOrders", { enumerable: true, get: function () { return purchaseOrderController_1.getPurchaseOrders; } });
Object.defineProperty(exports, "getPurchaseOrder", { enumerable: true, get: function () { return purchaseOrderController_1.getPurchaseOrder; } });
Object.defineProperty(exports, "createPurchaseOrder", { enumerable: true, get: function () { return purchaseOrderController_1.createPurchaseOrder; } });
Object.defineProperty(exports, "updatePurchaseOrder", { enumerable: true, get: function () { return purchaseOrderController_1.updatePurchaseOrder; } });
Object.defineProperty(exports, "deletePurchaseOrder", { enumerable: true, get: function () { return purchaseOrderController_1.deletePurchaseOrder; } });
Object.defineProperty(exports, "updatePurchaseOrderStatus", { enumerable: true, get: function () { return purchaseOrderController_1.updatePurchaseOrderStatus; } });
// Purchase Bills
var purchaseBillController_1 = require("./purchaseBillController");
Object.defineProperty(exports, "getPurchaseBills", { enumerable: true, get: function () { return purchaseBillController_1.getPurchaseBills; } });
Object.defineProperty(exports, "getPurchaseBill", { enumerable: true, get: function () { return purchaseBillController_1.getPurchaseBill; } });
Object.defineProperty(exports, "createPurchaseBill", { enumerable: true, get: function () { return purchaseBillController_1.createPurchaseBill; } });
Object.defineProperty(exports, "updatePurchaseBill", { enumerable: true, get: function () { return purchaseBillController_1.updatePurchaseBill; } });
Object.defineProperty(exports, "deletePurchaseBill", { enumerable: true, get: function () { return purchaseBillController_1.deletePurchaseBill; } });
// Goods Received Notes (GRN)
var grnController_1 = require("./grnController");
Object.defineProperty(exports, "getGRNs", { enumerable: true, get: function () { return grnController_1.getGRNs; } });
Object.defineProperty(exports, "getGRN", { enumerable: true, get: function () { return grnController_1.getGRN; } });
Object.defineProperty(exports, "createGRN", { enumerable: true, get: function () { return grnController_1.createGRN; } });
Object.defineProperty(exports, "updateGRN", { enumerable: true, get: function () { return grnController_1.updateGRN; } });
Object.defineProperty(exports, "deleteGRN", { enumerable: true, get: function () { return grnController_1.deleteGRN; } });
//# sourceMappingURL=index.js.map
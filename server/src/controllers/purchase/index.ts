/**
 * Purchase Controllers - Re-exports
 * 
 * This file re-exports all purchase-related controllers for backward compatibility.
 * The original purchaseController.ts has been split into:
 * - purchaseOrderController.ts
 * - purchaseBillController.ts
 * - grnController.ts
 */

// Purchase Orders
export {
    getPurchaseOrders,
    getPurchaseOrder,
    createPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,
    updatePurchaseOrderStatus
} from './purchaseOrderController';

// Purchase Bills
export {
    getPurchaseBills,
    getPurchaseBill,
    createPurchaseBill,
    updatePurchaseBill,
    deletePurchaseBill
} from './purchaseBillController';

// Goods Received Notes (GRN)
export {
    getGRNs,
    getGRN,
    createGRN,
    updateGRN,
    deleteGRN
} from './grnController';

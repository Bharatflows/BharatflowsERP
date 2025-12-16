/**
 * Purchase Order Controller
 *
 * Handles all purchase order-related operations.
 * Split from purchaseController.ts for better maintainability.
 */
import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
export declare const getPurchaseOrders: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getPurchaseOrder: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createPurchaseOrder: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updatePurchaseOrder: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deletePurchaseOrder: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updatePurchaseOrderStatus: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=purchaseOrderController.d.ts.map
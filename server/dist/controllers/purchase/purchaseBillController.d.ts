/**
 * Purchase Bill Controller
 *
 * Handles all purchase bill-related operations.
 * Split from purchaseController.ts for better maintainability.
 */
import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
export declare const getPurchaseBills: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getPurchaseBill: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createPurchaseBill: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updatePurchaseBill: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deletePurchaseBill: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=purchaseBillController.d.ts.map
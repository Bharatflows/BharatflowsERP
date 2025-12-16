/**
 * Goods Received Note (GRN) Controller
 *
 * Handles all GRN-related operations.
 * Split from purchaseController.ts for better maintainability.
 */
import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
export declare const getGRNs: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getGRN: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createGRN: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateGRN: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deleteGRN: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=grnController.d.ts.map
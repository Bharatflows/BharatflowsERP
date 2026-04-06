/**
 * Stock Controller
 *
 * Handles stock-related operations: adjustments, transfers, movements, valuation.
 * Split from inventoryController.ts for better maintainability.
 */
import { Response } from 'express';
import { ProtectedRequest } from '../../middleware/auth';
export declare const adjustStock: (req: ProtectedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getLowStock: (req: ProtectedRequest, res: Response) => Promise<void>;
export declare const transferStock: (req: ProtectedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getStockHistory: (req: ProtectedRequest, res: Response) => Promise<void>;
export declare const createBatch: (req: ProtectedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getBatches: (req: ProtectedRequest, res: Response) => Promise<void>;
export declare const getStockMovements: (req: ProtectedRequest, res: Response) => Promise<void>;
export declare const getInventoryValuation: (req: ProtectedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=stockController.d.ts.map
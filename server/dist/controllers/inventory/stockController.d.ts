/**
 * Stock Controller
 *
 * Handles stock-related operations: adjustments, transfers, movements, valuation.
 * Split from inventoryController.ts for better maintainability.
 */
import { Request, Response } from 'express';
export declare const adjustStock: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getLowStock: (req: Request, res: Response) => Promise<void>;
export declare const transferStock: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getStockHistory: (req: Request, res: Response) => Promise<void>;
export declare const getStockMovements: (req: Request, res: Response) => Promise<void>;
export declare const getInventoryValuation: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=stockController.d.ts.map
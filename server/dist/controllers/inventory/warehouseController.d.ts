/**
 * Warehouse Controller
 *
 * Handles warehouse CRUD operations.
 * Split from inventoryController.ts for better maintainability.
 */
import { Request, Response } from 'express';
export declare const createWarehouse: (req: Request, res: Response) => Promise<void>;
export declare const getWarehouses: (req: Request, res: Response) => Promise<void>;
export declare const updateWarehouse: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteWarehouse: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=warehouseController.d.ts.map
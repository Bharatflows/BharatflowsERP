/**
 * Warehouse Controller
 *
 * Handles warehouse CRUD operations.
 * Split from inventoryController.ts for better maintainability.
 */
import { Response } from 'express';
import { ProtectedRequest } from '../../middleware/auth';
export declare const createWarehouse: (req: ProtectedRequest, res: Response) => Promise<void>;
export declare const getWarehouses: (req: ProtectedRequest, res: Response) => Promise<void>;
export declare const updateWarehouse: (req: ProtectedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteWarehouse: (req: ProtectedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=warehouseController.d.ts.map
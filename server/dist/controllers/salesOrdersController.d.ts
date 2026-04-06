import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getSalesOrders: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getSalesOrder: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createSalesOrder: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateSalesOrder: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteSalesOrder: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const convertSalesOrderToInvoice: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const convertSalesOrderToChallan: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=salesOrdersController.d.ts.map
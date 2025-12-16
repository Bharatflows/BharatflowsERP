import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getQuotations: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getQuotation: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createQuotation: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateQuotation: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteQuotation: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const convertQuotationToSalesOrder: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=quotationsController.d.ts.map
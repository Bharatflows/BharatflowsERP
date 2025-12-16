import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
export declare const getEInvoices: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getEInvoice: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const generateEInvoice: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateEInvoiceStatus: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const cancelEInvoice: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteEInvoice: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=eInvoiceController.d.ts.map
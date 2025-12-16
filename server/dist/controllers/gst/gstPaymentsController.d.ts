import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
export declare const getGSTPayments: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getGSTPayment: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createGSTPayment: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateGSTPayment: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteGSTPayment: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getPaymentSummary: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=gstPaymentsController.d.ts.map
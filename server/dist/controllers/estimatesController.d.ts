import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getEstimates: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getEstimate: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createEstimate: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateEstimate: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteEstimate: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const convertEstimateToInvoice: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=estimatesController.d.ts.map
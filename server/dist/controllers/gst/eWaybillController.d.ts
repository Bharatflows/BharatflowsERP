import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
export declare const getEWaybills: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getEWaybill: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createEWaybill: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateEWaybill: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const extendEWaybill: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const cancelEWaybill: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteEWaybill: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=eWaybillController.d.ts.map
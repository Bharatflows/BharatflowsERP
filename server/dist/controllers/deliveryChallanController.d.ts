import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getDeliveryChallans: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getDeliveryChallan: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createDeliveryChallan: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateDeliveryChallan: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteDeliveryChallan: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const searchDeliveryChallans: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=deliveryChallanController.d.ts.map
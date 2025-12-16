import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
export declare const getDevices: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getDevice: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const registerDevice: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateDevice: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const blockDevice: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const unblockDevice: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteDevice: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getDeviceSummary: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=devicesController.d.ts.map
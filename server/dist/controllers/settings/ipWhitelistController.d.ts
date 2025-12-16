import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
export declare const getIPWhitelist: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getIPWhitelistEntry: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const addIPToWhitelist: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateIPWhitelist: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const toggleIPWhitelist: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const removeIPFromWhitelist: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const checkIPWhitelist: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=ipWhitelistController.d.ts.map
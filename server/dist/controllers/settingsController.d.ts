import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getSequences: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getSequence: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateSequence: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const previewSequence: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getNextPreview: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const checkIntegrity: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const applyIndustryDefaults: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=settingsController.d.ts.map
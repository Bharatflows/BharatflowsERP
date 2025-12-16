import { Request, Response } from 'express';
export declare const generateGSTR1: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const generateGSTR3B: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createEWayBill: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getHSNSummary: (req: Request, res: Response) => Promise<void>;
export declare const getITCLedger: (req: Request, res: Response) => Promise<void>;
export declare const fileGSTReturn: (req: Request, res: Response) => Promise<void>;
export declare const getGSTDashboard: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=gstController.d.ts.map
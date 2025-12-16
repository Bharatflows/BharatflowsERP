import { Request, Response, NextFunction } from 'express';
export interface AuthRequest extends Request {
    user?: any;
    companyId?: string;
}
export declare const protect: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void | Response>;
export declare const authorize: (...roles: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => void | Response;
export declare const verifyCompanyAccess: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void | Response>;
//# sourceMappingURL=auth.d.ts.map
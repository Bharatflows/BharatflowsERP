import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const register: (req: Request, res: Response) => Promise<Response>;
export declare const login: (req: Request, res: Response) => Promise<Response>;
export declare const logout: (req: AuthRequest, res: Response) => Promise<Response>;
export declare const getMe: (req: AuthRequest, res: Response) => Promise<Response>;
export declare const updateProfile: (req: AuthRequest, res: Response) => Promise<Response>;
export declare const forgotPassword: (req: Request, res: Response) => Promise<Response>;
export declare const resetPassword: (req: Request, res: Response) => Promise<Response>;
export declare const verifyEmail: (req: Request, res: Response) => Promise<Response>;
export declare const verifyOTP: (req: Request, res: Response) => Promise<Response>;
export declare const resendOTP: (req: Request, res: Response) => Promise<Response>;
export declare const googleLogin: (req: Request, res: Response) => Promise<Response>;
//# sourceMappingURL=authController.d.ts.map
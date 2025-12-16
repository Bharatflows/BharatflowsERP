import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getEmployees: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getEmployee: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createEmployee: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateEmployee: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deleteEmployee: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=hrController.d.ts.map
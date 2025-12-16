import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getUnits: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createUnit: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateUnit: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deleteUnit: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getCategories: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createCategory: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateCategory: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deleteCategory: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=masterdataController.d.ts.map
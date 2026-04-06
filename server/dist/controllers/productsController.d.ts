import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const createProduct: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getProducts: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getProductById: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateProduct: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getProductByBarcode: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=productsController.d.ts.map
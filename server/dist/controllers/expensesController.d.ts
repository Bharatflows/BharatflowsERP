import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getExpenses: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getExpense: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createExpense: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateExpense: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deleteExpense: (req: AuthRequest, res: Response) => Promise<void>;
export declare const approveExpense: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=expensesController.d.ts.map
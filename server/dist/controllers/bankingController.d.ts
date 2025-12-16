import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getAccounts: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getAccount: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createAccount: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateAccount: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deleteAccount: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getTransactions: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createTransaction: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deleteTransaction: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getDashboardSummary: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getPaymentReminders: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createPaymentReminder: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updatePaymentReminder: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deletePaymentReminder: (req: AuthRequest, res: Response) => Promise<void>;
export declare const sendReminder: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=bankingController.d.ts.map
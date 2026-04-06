/**
 * Financial Reports Controller
 *
 * Handles Profit & Loss and Balance Sheet reports.
 * Split from reportsController.ts for better maintainability.
 *
 * FIX: Now uses accountingService for ledger-based accuracy.
 */
import { Response } from 'express';
import { ProtectedRequest } from '../../middleware/auth';
export declare const getProfitLoss: (req: ProtectedRequest, res: Response) => Promise<void>;
export declare const getBalanceSheet: (req: ProtectedRequest, res: Response) => Promise<void>;
export declare const getDashboardSummary: (req: ProtectedRequest, res: Response) => Promise<void>;
export declare const getProfitLossTrends: (req: ProtectedRequest, res: Response) => Promise<void>;
export declare const getCashFlowForecast: (req: ProtectedRequest, res: Response) => Promise<void>;
export declare const getBudgetVsActual: (req: ProtectedRequest, res: Response) => Promise<void>;
export declare const saveBudget: (req: ProtectedRequest, res: Response) => Promise<void>;
export declare const getBudgetAlerts: (req: ProtectedRequest, res: Response) => Promise<void>;
export declare const getExchangeRates: (req: ProtectedRequest, res: Response) => Promise<void>;
export declare const convertCurrency: (req: ProtectedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=financialReportsController.d.ts.map
/**
 * Transaction Reports Controller
 *
 * Handles Sales, Purchase, Inventory, and Party Statement reports.
 * Split from reportsController.ts for better maintainability.
 */
import { Response } from 'express';
import { ProtectedRequest } from '../../middleware/auth';
export declare const getSalesReport: (req: ProtectedRequest, res: Response) => Promise<void>;
export declare const getPurchaseReport: (req: ProtectedRequest, res: Response) => Promise<void>;
export declare const getInventoryReport: (req: ProtectedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getPartyStatement: (req: ProtectedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const analyzeConcentration: (req: ProtectedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=transactionReportsController.d.ts.map
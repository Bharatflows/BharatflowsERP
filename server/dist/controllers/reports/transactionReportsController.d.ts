/**
 * Transaction Reports Controller
 *
 * Handles Sales, Purchase, Inventory, and Party Statement reports.
 * Split from reportsController.ts for better maintainability.
 */
import { Request, Response } from 'express';
export declare const getSalesReport: (req: Request, res: Response) => Promise<void>;
export declare const getPurchaseReport: (req: Request, res: Response) => Promise<void>;
export declare const getInventoryReport: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getPartyStatement: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=transactionReportsController.d.ts.map
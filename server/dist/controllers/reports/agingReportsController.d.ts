/**
 * Aging Reports Controller
 *
 * Handles Aging Receivables and Aging Payables reports.
 * Split from reportsController.ts for better maintainability.
 */
import { Response } from 'express';
import { ProtectedRequest } from '../../middleware/auth';
export declare const getAgingReceivables: (req: ProtectedRequest, res: Response) => Promise<void>;
export declare const getAgingPayables: (req: ProtectedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=agingReportsController.d.ts.map
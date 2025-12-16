/**
 * Invoice Actions Controller
 *
 * Handles invoice actions: payments, status updates, PDF download, email sending.
 * Split from salesController.ts for better maintainability.
 */
import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
export declare const recordPayment: (req: AuthRequest, res: Response) => Promise<Response>;
export declare const updateInvoiceStatus: (req: AuthRequest, res: Response) => Promise<Response>;
export declare const downloadInvoicePDF: (req: AuthRequest, res: Response) => Promise<Response | void>;
export declare const sendInvoiceEmail: (req: AuthRequest, res: Response) => Promise<Response>;
//# sourceMappingURL=invoiceActionsController.d.ts.map
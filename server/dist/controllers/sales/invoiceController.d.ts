/**
 * Invoice Controller
 *
 * Handles core invoice CRUD operations.
 * Split from salesController.ts for better maintainability.
 * Fixed syntax errors and duplicates.
 */
import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
export declare const getInvoices: (req: AuthRequest, res: Response) => Promise<Response>;
export declare const getInvoice: (req: AuthRequest, res: Response) => Promise<Response>;
export declare const createInvoice: (req: AuthRequest, res: Response) => Promise<Response>;
export declare const updateInvoice: (req: AuthRequest, res: Response) => Promise<Response>;
export declare const deleteInvoice: (req: AuthRequest, res: Response) => Promise<Response>;
export declare const searchInvoices: (req: AuthRequest, res: Response) => Promise<Response>;
//# sourceMappingURL=invoiceController.d.ts.map
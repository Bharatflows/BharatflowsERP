import { Response } from 'express';
import { ProtectedRequest } from '../middleware/auth';
export declare const generateGSTR1: (req: ProtectedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const generateGSTR3B: (req: ProtectedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createEWayBill: (req: ProtectedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getHSNSummary: (req: ProtectedRequest, res: Response) => Promise<void>;
export declare const getITCLedger: (req: ProtectedRequest, res: Response) => Promise<void>;
export declare const fileGSTReturn: (req: ProtectedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getGSTDashboard: (req: ProtectedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getGSTR1ReportSummary: (req: ProtectedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getGSTR3BReportSummary: (req: ProtectedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const exportGSTR1Excel: (req: ProtectedRequest, res: Response) => Promise<void>;
export declare const exportGSTR3BExcel: (req: ProtectedRequest, res: Response) => Promise<void>;
export declare const exportGSTR1JSON: (req: Request, res: Response) => Promise<void>;
export declare const getGSTHistory: (req: ProtectedRequest, res: Response) => Promise<void>;
export declare const generateEInvoice: (req: ProtectedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const syncGSTR2B: (req: ProtectedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getGSTR2BRecords: (req: ProtectedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * @desc    Get GST Amendments for a period
 * @route   GET /api/v1/gst/amendments
 * @access  Private
 */
export declare const getAmendments: (req: ProtectedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * @desc    Create GST Amendment
 * @route   POST /api/v1/gst/amendments
 * @access  Private
 */
export declare const createAmendment: (req: ProtectedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * @desc    Get Extended GSTR1 (B2C Large, Exports, etc.)
 * @route   GET /api/v1/gst/gstr1-extended
 * @access  Private
 */
export declare const getGSTR1Extended: (req: ProtectedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=gstController.d.ts.map
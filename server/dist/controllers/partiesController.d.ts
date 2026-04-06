import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const createParty: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getParties: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getParty: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateParty: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteParty: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * @desc    Get Party Trust Score (Stub)
 * @route   GET /api/v1/parties/:id/trust-score
 * @access  Private
 */
export declare const getTrustScore: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * @desc    Verify Business (Stub)
 * @route   POST /api/v1/parties/verify-business
 * @access  Private
 */
export declare const verifyBusiness: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=partiesController.d.ts.map
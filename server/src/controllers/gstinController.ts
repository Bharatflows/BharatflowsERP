import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import gstinService from '../services/gstinService';

/**
 * Lookup GSTIN and return party details
 * GET /api/gstin/:gstin
 */
export const lookupGSTIN = async (req: Request, res: Response) => {
    try {
        const { gstin } = req.params;

        if (!gstin) {
            return res.status(400).json({
                success: false,
                message: 'GSTIN is required'
            });
        }

        // Validate format first
        if (!gstinService.validateGSTINFormat(gstin)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid GSTIN format. GSTIN must be 15 characters (e.g., 27AABCU9603R1ZM)'
            });
        }

        // Lookup GSTIN details
        const gstinDetails = await gstinService.lookupGSTIN(gstin);

        if (!gstinDetails) {
            return res.status(404).json({
                success: false,
                message: 'GSTIN not found or unable to verify'
            });
        }

        return res.json({
            success: true,
            data: gstinDetails
        });
    } catch (error: any) {
        console.error('GSTIN lookup error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to lookup GSTIN'
        });
    }
};

/**
 * Validate GSTIN format only (no API call)
 * GET /api/gstin/validate/:gstin
 */
export const validateGSTIN = async (req: Request, res: Response) => {
    try {
        const { gstin } = req.params;

        if (!gstin) {
            return res.status(400).json({
                success: false,
                message: 'GSTIN is required'
            });
        }

        const isValid = gstinService.validateGSTINFormat(gstin);
        const stateInfo = isValid ? gstinService.getStateFromGSTIN(gstin) : null;
        const pan = isValid ? gstinService.extractPANFromGSTIN(gstin) : null;

        return res.json({
            success: true,
            data: {
                gstin: gstin.toUpperCase(),
                isValid,
                stateCode: stateInfo?.code || null,
                stateName: stateInfo?.name || null,
                pan
            }
        });
    } catch (error: any) {
        console.error('GSTIN validation error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to validate GSTIN'
        });
    }
};

export default {
    lookupGSTIN,
    validateGSTIN
};

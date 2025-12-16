import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as sequenceService from '../services/sequenceService';
import logger from '../config/logger';

// @desc    Get all sequences for company
// @route   GET /api/v1/settings/sequences
// @access  Private
export const getSequences = async (req: AuthRequest, res: Response) => {
    try {
        const sequences = await sequenceService.getSequences(req.user.companyId);
        return res.json({
            success: true,
            data: sequences,
        });
    } catch (error: any) {
        logger.error('Get sequences error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch sequences',
            error: error.message,
        });
    }
};

// @desc    Get sequence for a document type
// @route   GET /api/v1/settings/sequences/:documentType
// @access  Private
export const getSequence = async (req: AuthRequest, res: Response) => {
    try {
        const { documentType } = req.params;
        const sequence = await sequenceService.getSequence(
            req.user.companyId,
            documentType.toUpperCase()
        );
        return res.json({
            success: true,
            data: sequence,
        });
    } catch (error: any) {
        logger.error('Get sequence error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch sequence',
            error: error.message,
        });
    }
};

// @desc    Update sequence configuration
// @route   PUT /api/v1/settings/sequences/:documentType
// @access  Private
export const updateSequence = async (req: AuthRequest, res: Response) => {
    try {
        const { documentType } = req.params;
        const { prefix, nextNumber, format } = req.body;

        // Validate input
        if (prefix && (typeof prefix !== 'string' || prefix.length > 10)) {
            return res.status(400).json({
                success: false,
                message: 'Prefix must be a string of max 10 characters',
            });
        }

        if (nextNumber !== undefined && (typeof nextNumber !== 'number' || nextNumber < 1)) {
            return res.status(400).json({
                success: false,
                message: 'Next number must be a positive integer',
            });
        }

        const sequence = await sequenceService.updateSequence(
            req.user.companyId,
            documentType.toUpperCase(),
            { prefix, nextNumber, format }
        );

        return res.json({
            success: true,
            message: 'Sequence updated successfully',
            data: sequence,
        });
    } catch (error: any) {
        logger.error('Update sequence error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update sequence',
            error: error.message,
        });
    }
};

// @desc    Preview next document number
// @route   POST /api/v1/settings/sequences/preview
// @access  Private
export const previewSequence = async (req: AuthRequest, res: Response) => {
    try {
        const { prefix, nextNumber, format } = req.body;

        if (!prefix || !nextNumber || !format) {
            return res.status(400).json({
                success: false,
                message: 'Prefix, nextNumber, and format are required',
            });
        }

        const preview = sequenceService.previewNextNumber(prefix, nextNumber, format);
        return res.json({
            success: true,
            data: { preview },
        });
    } catch (error: any) {
        logger.error('Preview sequence error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to preview sequence',
            error: error.message,
        });
    }
};

// @desc    Get next document number preview (without incrementing)
// @route   GET /api/v1/settings/sequences/:documentType/next
// @access  Private
export const getNextPreview = async (req: AuthRequest, res: Response) => {
    try {
        const { documentType } = req.params;
        const sequence = await sequenceService.getSequence(
            req.user.companyId,
            documentType.toUpperCase()
        );

        // Generate the preview number using current sequence values
        const nextNumber = sequenceService.previewNextNumber(
            sequence.prefix,
            sequence.nextNumber,
            sequence.format || '{PREFIX}-{YEAR}-{SEQ:3}'
        );

        return res.json({
            success: true,
            data: {
                nextNumber,
                sequence
            },
        });
    } catch (error: any) {
        logger.error('Get next preview error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get next number preview',
            error: error.message,
        });
    }
};

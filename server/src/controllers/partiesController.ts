import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import { ValidationUtils } from '../services/validationService';
import { AuditService } from '../services/auditService';
import eventBus, { EventTypes } from '../services/eventBus';  // P0: Domain events
import logger from '../config/logger';
// TrustService removed - domains folder deleted

export const createParty = async (req: AuthRequest, res: Response) => {
    try {
        const {
            name,
            type,
            gstin,
            pan,
            email,
            phone,
            address,
            city,
            state,
            pincode,
            openingBalance,
            msmeType,
            udyamNumber
        } = req.body;

        const companyId = req.user.companyId;

        // Validation: GSTIN
        if (gstin && !ValidationUtils.isValidGSTIN(gstin)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid GSTIN format'
            });
        }

        // Auto-extract PAN if not provided
        let finalPan = pan;
        if (gstin && !pan) {
            finalPan = ValidationUtils.extractPAN(gstin);
        }

        // Construct address object
        const addressObj = {
            address,
            city,
            state,
            pincode
        };

        const party = await prisma.party.create({
            data: {
                name,
                type: type ? type.toUpperCase() : 'CUSTOMER',
                gstin,
                pan: finalPan,
                email,
                phone,
                billingAddress: JSON.stringify(addressObj),
                shippingAddress: JSON.stringify(addressObj),
                openingBalance: openingBalance || 0,
                currentBalance: openingBalance || 0,
                companyId,
                msmeType,
                udyamNumber
            }
        });

        // Audit Log
        await AuditService.logChange(
            companyId,
            req.user.id,
            'PARTY',
            party.id,
            'CREATE',
            null,
            party,
            req.ip,
            req.headers['user-agent'] || 'UNKNOWN',
            'PARTIES'
        );

        // P0: Emit domain event for cross-domain processing
        try {
            await eventBus.emit({
                companyId,
                eventType: EventTypes.PARTY_CREATED,
                aggregateType: 'Party',
                aggregateId: party.id,
                payload: {
                    partyId: party.id,
                    name: party.name,
                    type: party.type,
                    gstin: party.gstin,
                    openingBalance: Number(party.openingBalance)
                },
                metadata: {
                    userId: req.user.id,
                    source: 'api'
                }
            });
        } catch (eventError) {
            logger.warn('Failed to emit PARTY_CREATED event:', eventError);
        }

        return res.status(201).json({
            success: true,
            data: party
        });
    } catch (error: any) {
        logger.error('Create party error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error creating party'
        });
    }
};

export const getParties = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user.companyId;
        const { type } = req.query;

        const where: any = { companyId, isActive: true };
        if (type) {
            // Convert to uppercase for case-insensitive matching
            where.type = (type as string).toUpperCase();
        }

        const parties = await prisma.party.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });

        return res.json({
            success: true,
            data: parties
        });
    } catch (error: any) {
        logger.error('Get parties error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error fetching parties'
        });
    }
};

export const getParty = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user.companyId;
        const { id } = req.params;

        const party = await prisma.party.findFirst({
            where: { id, companyId }
        });

        if (!party) {
            return res.status(404).json({
                success: false,
                message: 'Party not found'
            });
        }

        return res.json({
            success: true,
            data: party
        });
    } catch (error: any) {
        logger.error('Get party error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error fetching party'
        });
    }
};

export const updateParty = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user.companyId;
        const { id } = req.params;
        const {
            name,
            type,
            gstin,
            pan,
            email,
            phone,
            address,
            city,
            state,
            pincode,
            openingBalance,
            msmeType,
            udyamNumber
        } = req.body;

        const existingParty = await prisma.party.findFirst({
            where: { id, companyId }
        });

        if (!existingParty) {
            return res.status(404).json({
                success: false,
                message: 'Party not found'
            });
        }

        // Validation: GSTIN
        if (gstin && !ValidationUtils.isValidGSTIN(gstin)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid GSTIN format'
            });
        }

        // Construct address object
        const addressObj = {
            address,
            city,
            state,
            pincode
        };

        const updatedParty = await prisma.party.update({
            where: { id , companyId: req.user.companyId },
            data: {
                name,
                type: type ? type.toUpperCase() : undefined,
                gstin,
                pan,
                email,
                phone,
                billingAddress: JSON.stringify(addressObj),
                shippingAddress: JSON.stringify(addressObj),
                openingBalance: openingBalance !== undefined ? Number(openingBalance) : undefined,
                msmeType,
                udyamNumber
            }
        });

        // Audit Log
        await AuditService.logChange(
            companyId,
            req.user.id,
            'PARTY',
            id,
            'UPDATE',
            existingParty,
            updatedParty,
            req.ip,
            req.headers['user-agent'] || 'UNKNOWN',
            'PARTIES'
        );

        // P0: Emit domain event for cross-domain processing
        try {
            await eventBus.emit({
                companyId,
                eventType: EventTypes.PARTY_UPDATED,
                aggregateType: 'Party',
                aggregateId: id,
                payload: {
                    partyId: id,
                    name: updatedParty.name,
                    type: updatedParty.type,
                    gstin: updatedParty.gstin,
                    currentBalance: Number(updatedParty.currentBalance)
                },
                metadata: {
                    userId: req.user.id,
                    source: 'api'
                }
            });
        } catch (eventError) {
            logger.warn('Failed to emit PARTY_UPDATED event:', eventError);
        }

        return res.json({
            success: true,
            data: updatedParty
        });
    } catch (error: any) {
        logger.error('Update party error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error updating party'
        });
    }
};

export const deleteParty = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user.companyId;
        const { id } = req.params;

        const party = await prisma.party.findFirst({
            where: { id, companyId }
        });

        if (!party) {
            return res.status(404).json({
                success: false,
                message: 'Party not found'
            });
        }

        // Soft delete
        const deletedParty = await prisma.party.update({
            where: { id , companyId: req.user.companyId },
            data: { isActive: false }
        });

        // Audit Log
        await AuditService.logChange(
            companyId,
            req.user.id,
            'PARTY',
            id,
            'DELETE',
            party,
            { isActive: false },
            req.ip,
            req.headers['user-agent'] || 'UNKNOWN',
            'PARTIES'
        );

        return res.json({
            success: true,
            message: 'Party deleted successfully'
        });
    } catch (error: any) {
        logger.error('Delete party error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error deleting party'
        });
    }
};

/**
 * @desc    Get Party Trust Score (Stub)
 * @route   GET /api/v1/parties/:id/trust-score
 * @access  Private
 */
export const getTrustScore = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;

        // Stub implementation - TrustService was in deleted domains folder
        logger.warn('[TrustScore] Service is a stub. Full implementation pending.');

        return res.json({
            success: true,
            data: {
                partyId: id,
                score: 0,
                message: 'Trust score service not yet implemented'
            }
        });
    } catch (error: any) {
        logger.error('Get trust score error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error fetching trust score'
        });
    }
};

/**
 * @desc    Verify Business (Stub)
 * @route   POST /api/v1/parties/verify-business
 * @access  Private
 */
export const verifyBusiness = async (req: AuthRequest, res: Response) => {
    try {
        // Stub implementation
        logger.warn('[VerifyBusiness] Service is a stub. Full implementation pending.');

        return res.json({
            success: true,
            data: {
                verified: false,
                message: 'Business verification service not yet implemented'
            }
        });
    } catch (error: any) {
        logger.error('Verify business error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error verifying business'
        });
    }
};

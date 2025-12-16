import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import { ValidationUtils } from '../services/validationService';
import { AuditService } from '../services/auditService';

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
                billingAddress: addressObj,
                shippingAddress: addressObj,
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

        return res.status(201).json({
            success: true,
            data: party
        });
    } catch (error: any) {
        console.error('Create party error:', error);
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
        console.error('Get parties error:', error);
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
        console.error('Get party error:', error);
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
            where: { id },
            data: {
                name,
                type: type ? type.toUpperCase() : undefined,
                gstin,
                pan,
                email,
                phone,
                billingAddress: addressObj,
                shippingAddress: addressObj,
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

        return res.json({
            success: true,
            data: updatedParty
        });
    } catch (error: any) {
        console.error('Update party error:', error);
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
            where: { id },
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
        console.error('Delete party error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error deleting party'
        });
    }
};

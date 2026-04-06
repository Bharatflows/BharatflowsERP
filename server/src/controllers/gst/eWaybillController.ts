import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import prisma from '../../config/prisma';
import logger from '../../config/logger';
import { GSTEWayBillService } from '../../services/gst/eWayBillService';

// @desc    Get all E-Waybills
// @route   GET /api/v1/gst/e-waybills
// @access  Private
export const getEWaybills = async (req: AuthRequest, res: Response) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const companyId = req.user.companyId;

        const where: any = { companyId };
        if (status) where.status = status;

        const skip = (Number(page) - 1) * Number(limit);

        const [eWaybills, total] = await Promise.all([
            prisma.eWaybill.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: Number(limit),
            }),
            prisma.eWaybill.count({ where }),
        ]);

        return res.json({
            success: true,
            data: {
                items: eWaybills,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit)),
                },
            },
        });
    } catch (error: any) {
        logger.error('Get E-Waybills error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch E-Waybills',
            error: error.message,
        });
    }
};

// @desc    Get single E-Waybill
// @route   GET /api/v1/gst/e-waybills/:id
// @access  Private
export const getEWaybill = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;

        const eWaybill = await prisma.eWaybill.findFirst({
            where: { id, companyId },
        });

        if (!eWaybill) {
            return res.status(404).json({
                success: false,
                message: 'E-Waybill not found',
            });
        }

        return res.json({
            success: true,
            data: eWaybill,
        });
    } catch (error: any) {
        logger.error('Get E-Waybill error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch E-Waybill',
            error: error.message,
        });
    }
};

// @desc    Create/Generate E-Waybill
// @route   POST /api/v1/gst/e-waybills
// @access  Private
export const createEWaybill = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user.companyId;
        const {
            documentNumber, // Usually invoice number
            documentType = 'Invoice',
            invoiceId,
            transporterName,
            transporterId,
            vehicleNumber,
            vehicleType = 'Regular',
            distance,
            transactionType = 'Outward',
            supplyType = 'Outward Supply',
            subSupplyType,
            value,
            mode
        } = req.body;

        // 1. Generate EWayBill Payload (Part A + B)
        const payload = await GSTEWayBillService.generatePayload(
            invoiceId,
            {
                transporterId,
                transporterName,
                vehicleNumber,
                distance: Number(distance),
                mode
            },
            companyId
        );

        // 2. Validate and Mock Submit
        const ewbResponse = await GSTEWayBillService.validateAndMockSubmit(payload);

        // 3. Save to DB
        // @ts-ignore - jsonPayload might be missing if migration failed
        const eWaybill = await prisma.eWaybill.create({
            data: {
                documentNumber: payload.docNo, // Use payload derived docNo
                documentType,
                invoiceId,
                ewaybillNumber: ewbResponse.ewayBillNo,
                validUpto: new Date(ewbResponse.validUpto),
                generatedDate: new Date(ewbResponse.ewayBillDate),

                fromGstin: payload.fromGstin,
                toGstin: payload.toGstin || null,
                fromPlace: payload.fromPlace,
                toPlace: payload.toPlace,
                distance: Number(payload.transDistance),

                transporterName,
                transporterId,
                vehicleNumber: payload.vehicleNo,
                vehicleType,

                transactionType,
                supplyType,
                subSupplyType,
                value: payload.totalValue,

                status: 'active', // Successfully generated
                companyId,
                jsonPayload: payload as any
            },
        });

        return res.status(201).json({
            success: true,
            message: 'E-Waybill generated successfully',
            data: eWaybill,
        });
    } catch (error: any) {
        logger.error('Create E-Waybill error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to create E-Waybill',
            error: error.message,
        });
    }
};

// @desc    Update E-Waybill (Vehicle/Transporter details)
// @route   PUT /api/v1/gst/e-waybills/:id
// @access  Private
export const updateEWaybill = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;
        const updateData = req.body;

        const existing = await prisma.eWaybill.findFirst({
            where: { id, companyId },
        });

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'E-Waybill not found',
            });
        }

        if (existing.status === 'cancelled' || existing.status === 'expired') {
            return res.status(400).json({
                success: false,
                message: `Cannot update a ${existing.status} E-Waybill`,
            });
        }

        const eWaybill = await prisma.eWaybill.update({
            where: { id , companyId: req.user.companyId },
            data: updateData,
        });

        return res.json({
            success: true,
            message: 'E-Waybill updated successfully',
            data: eWaybill,
        });
    } catch (error: any) {
        logger.error('Update E-Waybill error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update E-Waybill',
            error: error.message,
        });
    }
};

// @desc    Extend E-Waybill validity
// @route   POST /api/v1/gst/e-waybills/:id/extend
// @access  Private
export const extendEWaybill = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;
        const { reason, newVehicleNumber, newValidUpto } = req.body;

        const existing = await prisma.eWaybill.findFirst({
            where: { id, companyId },
        });

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'E-Waybill not found',
            });
        }

        if (existing.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: 'Can only extend active E-Waybills',
            });
        }

        // In production, this would call the E-Way Bill extension API
        const eWaybill = await prisma.eWaybill.update({
            where: { id , companyId: req.user.companyId },
            data: {
                validUpto: new Date(newValidUpto),
                vehicleNumber: newVehicleNumber || existing.vehicleNumber,
            },
        });

        return res.json({
            success: true,
            message: 'E-Waybill extended successfully',
            data: eWaybill,
        });
    } catch (error: any) {
        logger.error('Extend E-Waybill error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to extend E-Waybill',
            error: error.message,
        });
    }
};

// @desc    Cancel E-Waybill
// @route   POST /api/v1/gst/e-waybills/:id/cancel
// @access  Private
export const cancelEWaybill = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;
        const { reason } = req.body;

        const existing = await prisma.eWaybill.findFirst({
            where: { id, companyId },
        });

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'E-Waybill not found',
            });
        }

        if (existing.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'E-Waybill is already cancelled',
            });
        }

        // In production, check if within 24 hours and call cancellation API
        const eWaybill = await prisma.eWaybill.update({
            where: { id , companyId: req.user.companyId },
            data: {
                status: 'cancelled',
                errorMessage: reason || 'Cancelled by user',
            },
        });

        return res.json({
            success: true,
            message: 'E-Waybill cancelled successfully',
            data: eWaybill,
        });
    } catch (error: any) {
        logger.error('Cancel E-Waybill error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to cancel E-Waybill',
            error: error.message,
        });
    }
};

// @desc    Delete E-Waybill (only pending ones)
// @route   DELETE /api/v1/gst/e-waybills/:id
// @access  Private
export const deleteEWaybill = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;

        const existing = await prisma.eWaybill.findFirst({
            where: { id, companyId },
        });

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'E-Waybill not found',
            });
        }

        if (existing.status === 'active' && existing.ewaybillNumber) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete an active E-Waybill. Use cancel instead.',
            });
        }

        await prisma.eWaybill.delete({
            where: { id , companyId: req.user.companyId },
        });

        return res.json({
            success: true,
            message: 'E-Waybill deleted successfully',
        });
    } catch (error: any) {
        logger.error('Delete E-Waybill error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete E-Waybill',
            error: error.message,
        });
    }
};

// @desc    Get E-Waybill statistics
// @route   GET /api/v1/gst/ewaybill/stats
// @access  Private
export const getEWaybillStats = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user.companyId;

        const [active, pending, cancelled, expired] = await Promise.all([
            prisma.eWaybill.count({ where: { companyId, status: 'active' } }),
            prisma.eWaybill.count({ where: { companyId, status: 'pending' } }),
            prisma.eWaybill.count({ where: { companyId, status: 'cancelled' } }),
            prisma.eWaybill.count({ where: { companyId, status: 'expired' } }),
        ]);

        return res.json({
            success: true,
            data: {
                generated: active,
                pending,
                expired: cancelled + expired // Mapping cancelled + expired to expired
            },
        });
    } catch (error: any) {
        logger.error('Get E-Waybill stats error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch E-Waybill stats',
            error: error.message,
        });
    }
};

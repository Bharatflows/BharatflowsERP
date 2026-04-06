/**
 * Settings Approval Controller
 * Handles approval workflow for sensitive settings changes
 */

import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import prisma from '../../config/prisma';
import logger from '../../config/logger';
import { logSettingsChange } from '../../services/settingsAuditService';

/**
 * @desc    Create approval request for sensitive setting change
 * @route   POST /api/v1/settings/approvals/request
 * @access  Private
 */
export const createApprovalRequest = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const userId = req.user!.id;
        const { settingType, changeData, reason } = req.body;

        // Validation
        if (!settingType || !changeData || !reason) {
            return res.status(400).json({
                success: false,
                message: 'Setting type, change data, and reason are required'
            });
        }

        const validTypes = ['GSTIN_CHANGE', 'BANK_DETAILS', 'FY_UNLOCK', 'ROLE_CHANGE', 'PAN_CHANGE'];
        if (!validTypes.includes(settingType)) {
            return res.status(400).json({
                success: false,
                message: `Invalid setting type. Must be one of: ${validTypes.join(', ')}`
            });
        }

        if (reason.length < 20) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a detailed reason (at least 20 characters)'
            });
        }

        // Check for existing pending request
        const existingRequest = await prisma.settingsApprovalRequest.findFirst({
            where: {
                companyId,
                settingType,
                status: 'PENDING'
            }
        });

        if (existingRequest) {
            return res.status(400).json({
                success: false,
                message: 'A pending approval request already exists for this setting type',
                existingRequestId: existingRequest.id
            });
        }

        // Set expiry to 7 days from now
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const request = await prisma.settingsApprovalRequest.create({
            data: {
                companyId,
                requestedById: userId,
                settingType,
                changeData,
                reason,
                expiresAt
            },
            include: {
                requestedBy: {
                    select: { id: true, name: true, email: true }
                }
            }
        });

        // Log audit event
        await logSettingsChange({
            companyId,
            userId,
            settingType: 'APPROVAL_REQUEST',
            action: 'CREATE',
            entityId: request.id,
            entityName: settingType,
            newValue: { reason, status: 'PENDING' }
        });

        logger.info(`Approval request created`, { requestId: request.id, settingType });

        return res.status(201).json({
            success: true,
            data: request,
            message: 'Approval request submitted successfully'
        });
    } catch (error: any) {
        logger.error('Create approval request error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create approval request',
            error: error.message
        });
    }
};

/**
 * @desc    Get pending approval requests
 * @route   GET /api/v1/settings/approvals
 * @access  Private (Admin, Owner)
 */
export const getApprovalRequests = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const { status, page = '1', limit = '20' } = req.query;

        const where: any = { companyId };
        if (status) where.status = status;

        const [requests, total] = await Promise.all([
            prisma.settingsApprovalRequest.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (parseInt(page as string) - 1) * parseInt(limit as string),
                take: parseInt(limit as string),
                include: {
                    requestedBy: {
                        select: { id: true, name: true, email: true, avatar: true }
                    },
                    approvedBy: {
                        select: { id: true, name: true, email: true }
                    }
                }
            }),
            prisma.settingsApprovalRequest.count({ where })
        ]);

        return res.json({
            success: true,
            data: requests,
            pagination: {
                page: parseInt(page as string),
                limit: parseInt(limit as string),
                total,
                pages: Math.ceil(total / parseInt(limit as string))
            }
        });
    } catch (error: any) {
        logger.error('Get approval requests error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch approval requests',
            error: error.message
        });
    }
};

/**
 * @desc    Approve a settings change request
 * @route   POST /api/v1/settings/approvals/:id/approve
 * @access  Private (Owner only)
 */
export const approveRequest = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const userId = req.user!.id;
        const userRole = req.user!.role;
        const { id } = req.params;

        // Only OWNER can approve
        if (userRole !== 'OWNER') {
            return res.status(403).json({
                success: false,
                message: 'Only the Owner can approve settings change requests'
            });
        }

        const request = await prisma.settingsApprovalRequest.findFirst({
            where: { id, companyId }
        });

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Approval request not found'
            });
        }

        if (request.status !== 'PENDING') {
            return res.status(400).json({
                success: false,
                message: `Request has already been ${request.status.toLowerCase()}`
            });
        }

        // Check expiry
        if (request.expiresAt && new Date() > request.expiresAt) {
            await prisma.settingsApprovalRequest.update({
                where: { id , companyId: req.user.companyId },
                data: { status: 'EXPIRED' }
            });
            return res.status(400).json({
                success: false,
                message: 'This approval request has expired'
            });
        }

        // Cannot approve own request
        if (request.requestedById === userId) {
            return res.status(400).json({
                success: false,
                message: 'You cannot approve your own request'
            });
        }

        const updatedRequest = await prisma.settingsApprovalRequest.update({
            where: { id , companyId: req.user.companyId },
            data: {
                status: 'APPROVED',
                approvedById: userId,
                approvedAt: new Date()
            },
            include: {
                requestedBy: { select: { id: true, name: true, email: true } },
                approvedBy: { select: { id: true, name: true, email: true } }
            }
        });

        // Log audit event
        await logSettingsChange({
            companyId,
            userId,
            settingType: 'APPROVAL_REQUEST',
            action: 'APPROVE',
            entityId: id,
            entityName: request.settingType,
            oldValue: { status: 'PENDING' },
            newValue: { status: 'APPROVED', approvedBy: userId }
        });

        logger.info(`Approval request approved`, { requestId: id, approvedBy: userId });

        return res.json({
            success: true,
            data: updatedRequest,
            message: 'Request approved successfully. The change can now be applied.'
        });
    } catch (error: any) {
        logger.error('Approve request error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to approve request',
            error: error.message
        });
    }
};

/**
 * @desc    Reject a settings change request
 * @route   POST /api/v1/settings/approvals/:id/reject
 * @access  Private (Owner only)
 */
export const rejectRequest = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const userId = req.user!.id;
        const userRole = req.user!.role;
        const { id } = req.params;
        const { rejectionReason } = req.body;

        // Only OWNER can reject
        if (userRole !== 'OWNER') {
            return res.status(403).json({
                success: false,
                message: 'Only the Owner can reject settings change requests'
            });
        }

        if (!rejectionReason) {
            return res.status(400).json({
                success: false,
                message: 'Rejection reason is required'
            });
        }

        const request = await prisma.settingsApprovalRequest.findFirst({
            where: { id, companyId }
        });

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Approval request not found'
            });
        }

        if (request.status !== 'PENDING') {
            return res.status(400).json({
                success: false,
                message: `Request has already been ${request.status.toLowerCase()}`
            });
        }

        const updatedRequest = await prisma.settingsApprovalRequest.update({
            where: { id , companyId: req.user.companyId },
            data: {
                status: 'REJECTED',
                approvedById: userId,
                approvedAt: new Date(),
                rejectionReason
            },
            include: {
                requestedBy: { select: { id: true, name: true, email: true } },
                approvedBy: { select: { id: true, name: true, email: true } }
            }
        });

        // Log audit event
        await logSettingsChange({
            companyId,
            userId,
            settingType: 'APPROVAL_REQUEST',
            action: 'REJECT',
            entityId: id,
            entityName: request.settingType,
            oldValue: { status: 'PENDING' },
            newValue: { status: 'REJECTED', rejectionReason }
        });

        logger.info(`Approval request rejected`, { requestId: id, rejectedBy: userId });

        return res.json({
            success: true,
            data: updatedRequest,
            message: 'Request rejected'
        });
    } catch (error: any) {
        logger.error('Reject request error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to reject request',
            error: error.message
        });
    }
};

/**
 * @desc    Get pending count for badge
 * @route   GET /api/v1/settings/approvals/pending-count
 * @access  Private (Admin, Owner)
 */
export const getPendingCount = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;

        const count = await prisma.settingsApprovalRequest.count({
            where: { companyId, status: 'PENDING' }
        });

        return res.json({
            success: true,
            data: { count }
        });
    } catch (error: any) {
        logger.error('Get pending count error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get pending count',
            error: error.message
        });
    }
};

export default {
    createApprovalRequest,
    getApprovalRequests,
    approveRequest,
    rejectRequest,
    getPendingCount
};

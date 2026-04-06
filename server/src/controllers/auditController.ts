import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import { AuditService } from '../services/auditService';
import logger from '../config/logger';

/**
 * Get Audit Logs for a specific entity
 */
export const getEntityLogs = async (req: AuthRequest, res: Response) => {
    try {
        const { entityType, entityId } = req.params;
        const companyId = req.user.companyId;

        const logs = await prisma.auditLog.findMany({
            where: {
                companyId,
                entityType,
                entityId
            },
            orderBy: { changedAt: 'desc' },
            take: 100 // Limit for performance
        });

        // Verify integrity of the latest few logs on read (optional, can be heavy)
        // const isChainValid = await AuditService.verifyChain(companyId);

        return res.json({
            success: true,
            data: logs
        });
    } catch (error: any) {
        logger.error('Get entity logs error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching audit logs'
        });
    }
};

/**
 * Get Global Audit Logs (Admin Dashboard)
 */
export const getGlobalLogs = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user.companyId;
        const { page = 1, limit = 20, entityType, action, search } = req.query;

        const where: any = { companyId };

        if (entityType) where.entityType = entityType;
        if (action) where.action = action;
        if (search) {
            // Basic search implementation for now
            // In real app, we might need full text search on values
            where.OR = [
                { entityId: { contains: search as string } },
                { changedBy: { contains: search as string } }
            ];
        }

        const logs = await prisma.auditLog.findMany({
            where,
            orderBy: { changedAt: 'desc' },
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit),
            include: {
                // If we want to show user names, we might need relation or fetch separately
                // company: true 
            }
        });

        const total = await prisma.auditLog.count({ where });

        return res.json({
            success: true,
            data: {
                logs,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
                }
            }
        });
    } catch (error: any) {
        logger.error('Get global logs error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching global logs'
        });
    }
};

/**
 * Verify Audit Log Integrity
 */
export const verifyIntegrity = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user.companyId;

        // Only Admin should be able to run this?
        // if (req.user.role !== 'ADMIN') ...

        const result = await AuditService.verifyChain(companyId);

        if (result === true) {
            return res.json({
                success: true,
                message: 'Audit Log Integrity Verified. Chain is valid.'
            });
        } else {
            return res.status(409).json({ // 409 Conflict for tampering
                success: false,
                message: 'Integrity Check Failed! Tampering detected.',
                tamperedLogId: result
            });
        }
    } catch (error: any) {
        logger.error('Verify integrity error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error verifying integrity'
        });
    }
};

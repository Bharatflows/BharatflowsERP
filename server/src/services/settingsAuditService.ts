/**
 * Settings Audit Service
 * Logs all settings changes for audit trail
 */

import prisma from '../config/prisma';
import { maskObjectSensitiveFields } from '../utils/maskSensitiveData';
import logger from '../config/logger';

interface AuditLogParams {
    companyId: string;
    userId: string;
    settingType: string;
    action: string;
    entityId?: string;
    entityName?: string;
    fieldName?: string;
    oldValue?: any;
    newValue?: any;
    ipAddress?: string;
    userAgent?: string;
}

/**
 * Log a settings change to the audit log
 */
export async function logSettingsChange(params: AuditLogParams): Promise<void> {
    try {
        // Mask sensitive data before storing
        const maskedOldValue = params.oldValue
            ? maskObjectSensitiveFields(params.oldValue)
            : null;
        const maskedNewValue = params.newValue
            ? maskObjectSensitiveFields(params.newValue)
            : null;

        await prisma.settingsAuditLog.create({
            data: {
                companyId: params.companyId,
                userId: params.userId,
                settingType: params.settingType,
                action: params.action,
                entityId: params.entityId,
                entityName: params.entityName,
                fieldName: params.fieldName,
                oldValue: maskedOldValue as any,
                newValue: maskedNewValue as any,
                ipAddress: params.ipAddress,
                userAgent: params.userAgent,
            }
        });

        logger.info(`Settings audit log created`, {
            settingType: params.settingType,
            action: params.action,
            userId: params.userId
        });
    } catch (error) {
        // Don't throw - audit logging should not block the main operation
        logger.error('Failed to create settings audit log', { error, params });
    }
}

/**
 * Get audit logs with filters
 */
export async function getAuditLogs(
    companyId: string,
    filters: {
        settingType?: string;
        action?: string;
        userId?: string;
        startDate?: Date;
        endDate?: Date;
        search?: string;
        page?: number;
        limit?: number;
    }
) {
    const {
        settingType, action, userId,
        startDate, endDate, search,
        page = 1, limit = 20
    } = filters;

    const where: any = { companyId };

    if (settingType) where.settingType = settingType;
    if (action) where.action = action;
    if (userId) where.userId = userId;

    if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) where.timestamp.gte = startDate;
        if (endDate) where.timestamp.lte = endDate;
    }

    if (search) {
        where.OR = [
            { entityName: { contains: search } },
            { fieldName: { contains: search } }
        ];
    }

    const [logs, total] = await Promise.all([
        prisma.settingsAuditLog.findMany({
            where,
            orderBy: { timestamp: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
            include: {
                user: {
                    select: { id: true, name: true, email: true, avatar: true }
                }
            }
        }),
        prisma.settingsAuditLog.count({ where })
    ]);

    return {
        logs,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    };
}

/**
 * Get single audit log detail
 */
export async function getAuditLogDetail(id: string, companyId: string) {
    return prisma.settingsAuditLog.findFirst({
        where: { id, companyId },
        include: {
            user: {
                select: { id: true, name: true, email: true, avatar: true }
            }
        }
    });
}

/**
 * Get audit log summary statistics
 */
export async function getAuditLogStats(companyId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [byType, byAction, byUser, total] = await Promise.all([
        prisma.settingsAuditLog.groupBy({
            by: ['settingType'],
            where: { companyId, timestamp: { gte: startDate } },
            _count: true
        }),
        prisma.settingsAuditLog.groupBy({
            by: ['action'],
            where: { companyId, timestamp: { gte: startDate } },
            _count: true
        }),
        prisma.settingsAuditLog.groupBy({
            by: ['userId'],
            where: { companyId, timestamp: { gte: startDate } },
            _count: true,
            orderBy: { _count: { userId: 'desc' } },
            take: 5
        }),
        prisma.settingsAuditLog.count({
            where: { companyId, timestamp: { gte: startDate } }
        })
    ]);

    return {
        byType,
        byAction,
        byUser,
        total,
        period: `Last ${days} days`
    };
}

export default {
    logSettingsChange,
    getAuditLogs,
    getAuditLogDetail,
    getAuditLogStats
};

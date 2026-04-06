/**
 * Settings Audit Log Controller
 * Endpoints for viewing settings audit logs
 */

import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import * as settingsAuditService from '../../services/settingsAuditService';
import logger from '../../config/logger';

/**
 * @desc    Get settings audit logs with filters
 * @route   GET /api/v1/settings/audit-logs
 * @access  Private (Admin, Owner)
 */
export const getAuditLogs = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const {
            settingType,
            action,
            userId,
            startDate,
            endDate,
            search,
            page,
            limit
        } = req.query;

        const result = await settingsAuditService.getAuditLogs(companyId, {
            settingType: settingType as string,
            action: action as string,
            userId: userId as string,
            startDate: startDate ? new Date(startDate as string) : undefined,
            endDate: endDate ? new Date(endDate as string) : undefined,
            search: search as string,
            page: page ? parseInt(page as string, 10) : 1,
            limit: limit ? parseInt(limit as string, 10) : 20
        });

        return res.json({
            success: true,
            data: result.logs,
            pagination: result.pagination
        });
    } catch (error: any) {
        logger.error('Get audit logs error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch audit logs',
            error: error.message
        });
    }
};

/**
 * @desc    Get single audit log detail
 * @route   GET /api/v1/settings/audit-logs/:id
 * @access  Private (Admin, Owner)
 */
export const getAuditLogDetail = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const { id } = req.params;

        const log = await settingsAuditService.getAuditLogDetail(id, companyId);

        if (!log) {
            return res.status(404).json({
                success: false,
                message: 'Audit log not found'
            });
        }

        return res.json({
            success: true,
            data: log
        });
    } catch (error: any) {
        logger.error('Get audit log detail error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch audit log detail',
            error: error.message
        });
    }
};

/**
 * @desc    Get audit log statistics
 * @route   GET /api/v1/settings/audit-logs/stats
 * @access  Private (Admin, Owner)
 */
export const getAuditLogStats = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;

        const stats = await settingsAuditService.getAuditLogStats(companyId, days);

        return res.json({
            success: true,
            data: stats
        });
    } catch (error: any) {
        logger.error('Get audit log stats error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch audit log statistics',
            error: error.message
        });
    }
};

/**
 * @desc    Export audit logs to CSV
 * @route   GET /api/v1/settings/audit-logs/export
 * @access  Private (Owner only)
 */
export const exportAuditLogs = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const {
            settingType,
            action,
            startDate,
            endDate
        } = req.query;

        // Get all logs matching filters (no pagination for export)
        const result = await settingsAuditService.getAuditLogs(companyId, {
            settingType: settingType as string,
            action: action as string,
            startDate: startDate ? new Date(startDate as string) : undefined,
            endDate: endDate ? new Date(endDate as string) : undefined,
            limit: 10000 // Max export limit
        });

        // Convert to CSV
        const headers = ['Timestamp', 'User', 'Setting Type', 'Action', 'Entity', 'Field', 'Old Value', 'New Value', 'IP Address'];
        const rows = result.logs.map(log => [
            new Date(log.timestamp).toISOString(),
            (log.user as any)?.name || 'Unknown',
            log.settingType,
            log.action,
            log.entityName || log.entityId || '-',
            log.fieldName || '-',
            JSON.stringify(log.oldValue || '-'),
            JSON.stringify(log.newValue || '-'),
            log.ipAddress || '-'
        ]);

        const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
        return res.send(csv);
    } catch (error: any) {
        logger.error('Export audit logs error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to export audit logs',
            error: error.message
        });
    }
};

export default {
    getAuditLogs,
    getAuditLogDetail,
    getAuditLogStats,
    exportAuditLogs
};

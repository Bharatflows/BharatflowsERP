import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import prisma from '../../config/prisma';
import logger from '../../config/logger';

/**
 * @desc    Get Settings Dashboard statistics
 * @route   GET /api/v1/settings/dashboard/stats
 * @access  Private
 */
export const getSettingsDashboardStats = async (req: AuthRequest, res: Response) => {
    try {
        const { companyId } = req.user;

        // 1. Active Users Count
        const activeUsersCount = await prisma.user.count({
            where: {
                companyId,
                status: 'ACTIVE'
            }
        });

        // 2. Enabled Modules list and counts
        const company = await prisma.company.findUnique({
            where: { id: companyId },
            select: { enabledModules: true }
        });

        const enabledModulesRaw = company?.enabledModules;
        let enabledModules: Record<string, boolean> = {};
        try {
            if (typeof enabledModulesRaw === 'string') {
                enabledModules = JSON.parse(enabledModulesRaw);
            } else if (typeof enabledModulesRaw === 'object' && enabledModulesRaw !== null) {
                enabledModules = enabledModulesRaw as Record<string, boolean>;
            }
        } catch (e) {
            enabledModules = {};
        }
        const activeModulesCount = Object.values(enabledModules).filter(v => v === true).length;
        const totalModulesCount = Object.keys(enabledModules).length || 9; // Default to 9 if empty

        // 3. Recent Activity (Latest 10 audit logs)
        const recentLogs = await prisma.auditLog.findMany({
            where: { companyId },
            take: 10,
            orderBy: { changedAt: 'desc' },
            select: {
                action: true,
                entityType: true,
                changedBy: true,
                changedAt: true
            }
        });

        // Fetch user names for the IDs in the logs
        const userIds = [...new Set(recentLogs.map(log => log.changedBy))];
        const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true }
        });

        const userMap = users.reduce((acc: Record<string, string>, user) => {
            acc[user.id] = user.name;
            return acc;
        }, {});

        // 4. Security Score (Simplistic calculation for now)
        // Check for IP Whitelisting, workflows, and multiple users
        const ipWhitelistCount = await prisma.iPWhitelist.count({ where: { companyId, enabled: true } });
        const workflowsCount = await prisma.approvalWorkflow.count({ where: { companyId, isActive: true } });

        let securityScore = 70; // Base score
        if (ipWhitelistCount > 0) securityScore += 15;
        if (workflowsCount > 0) securityScore += 10;
        if (activeUsersCount > 1) securityScore += 5;
        securityScore = Math.min(securityScore, 100);

        // 5. Storage Used (Placeholder estimation - total document counts X 10KB)
        const invoiceCount = await prisma.invoice.count({ where: { companyId } });
        const productCount = await prisma.product.count({ where: { companyId } });
        const estimatedStorageMB = ((invoiceCount + productCount) * 0.01).toFixed(2);

        return res.json({
            success: true,
            data: {
                quickStats: {
                    activeUsers: activeUsersCount.toString(),
                    activeModules: `${activeModulesCount}/${totalModulesCount}`,
                    storageUsed: `${estimatedStorageMB} MB`,
                    securityScore: `${securityScore}%`
                },
                recentActivity: recentLogs.map((log: any) => ({
                    action: `${log.action} on ${log.entityType}`,
                    user: userMap[log.changedBy] || log.changedBy, // Show name if found, else fallback to ID
                    time: log.changedAt
                }))
            }
        });
    } catch (error: any) {
        logger.error('Get Settings Dashboard Stats error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch settings dashboard statistics',
            error: error.message
        });
    }
};

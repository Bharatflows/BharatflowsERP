/**
 * Security Summary Controller
 * 
 * Provides security-focused analytics and summaries.
 */

import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import prisma from '../../config/prisma';

/**
 * Get security summary for the company
 */
export const getSecuritySummary = async (req: AuthRequest, res: Response) => {
    try {
        const { companyId } = req.user;

        // Get failed login attempts (from domain events)
        const failedLogins = await prisma.domainEvent.count({
            where: {
                companyId,
                eventType: 'LOGIN_FAILED',
                createdAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
                },
            },
        });

        // Get blocked devices count (devices don't have status field, using isTrusted=false as proxy)
        const blockedDevices = 0; // No blocked status in schema

        // Get trusted devices count
        const trustedDevices = await prisma.device.count({
            where: {
                companyId,
                isTrusted: true,
            },
        });

        // Get total devices
        const totalDevices = await prisma.device.count({
            where: { companyId },
        });

        // Get active IP whitelist entries
        const activeIPWhitelist = await prisma.iPWhitelist.count({
            where: {
                companyId,
                enabled: true,
            },
        });

        // Get recent security events
        const recentSecurityEvents = await prisma.domainEvent.findMany({
            where: {
                companyId,
                eventType: {
                    in: ['LOGIN_FAILED', 'DEVICE_BLOCKED', 'IP_BLOCKED', 'UNAUTHORIZED_ACCESS'],
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: {
                id: true,
                eventType: true,
                createdAt: true,
                payload: true,
            },
        });

        // Calculate security score (simple algorithm)
        let securityScore = 100;
        if (failedLogins > 10) securityScore -= 20;
        else if (failedLogins > 5) securityScore -= 10;
        if (activeIPWhitelist === 0) securityScore -= 15; // No IP restrictions
        if (trustedDevices < totalDevices * 0.5) securityScore -= 10; // Less than 50% trusted

        return res.status(200).json({
            success: true,
            data: {
                securityScore: Math.max(0, securityScore),
                failedLogins,
                devices: {
                    total: totalDevices,
                    trusted: trustedDevices,
                    blocked: blockedDevices,
                },
                ipWhitelist: {
                    active: activeIPWhitelist,
                },
                recentEvents: recentSecurityEvents,
            },
        });
    } catch (error: any) {
        console.error('Error fetching security summary:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch security summary',
            error: error.message,
        });
    }
};

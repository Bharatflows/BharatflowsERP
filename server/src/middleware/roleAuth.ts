/**
 * Role-Based Access Control Middleware
 * 
 * Provides role hierarchy enforcement and permission checking for settings routes.
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import logger from '../config/logger';

// Role hierarchy: OWNER > ADMIN > STAFF
const ROLE_HIERARCHY: Record<string, number> = {
    OWNER: 3,
    ADMIN: 2,
    MANAGER: 1,
    ACCOUNTANT: 1,
    STAFF: 0,
    USER: 0,
};

/**
 * Require minimum role level to access a route
 * @param minRole - Minimum role required (e.g., 'ADMIN', 'OWNER')
 */
export function requireRole(minRole: keyof typeof ROLE_HIERARCHY) {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const userRole = req.user.role;
        const userLevel = ROLE_HIERARCHY[userRole] ?? 0;
        const requiredLevel = ROLE_HIERARCHY[minRole] ?? 0;

        if (userLevel < requiredLevel) {
            logger.warn(`Access denied: User ${req.user.id} (${userRole}) attempted to access route requiring ${minRole}`);
            return res.status(403).json({
                success: false,
                message: `This action requires ${minRole.toLowerCase()} or higher privileges`
            });
        }

        next();
    };
}

/**
 * Require ADMIN or higher role
 */
export const requireAdmin = requireRole('ADMIN');

/**
 * Require OWNER role
 */
export const requireOwner = requireRole('OWNER');

/**
 * Check if user has specific permission from their custom role
 * @param module - Module name (e.g., 'SETTINGS', 'USERS')
 * @param action - Action type (e.g., 'view', 'create', 'edit', 'delete')
 */
export function requirePermission(module: string, action: 'view' | 'create' | 'edit' | 'delete' | 'approve') {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const userRole = req.user.role;

        // OWNER and ADMIN have full permissions
        if (userRole === 'OWNER' || userRole === 'ADMIN') {
            return next();
        }

        // For STAFF, check custom role permissions
        const customRoleId = req.user.customRoleId;
        if (!customRoleId) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to perform this action'
            });
        }

        try {
            const prisma = (await import('../config/prisma')).default;
            const customRole = await prisma.customRole.findUnique({
                where: { id: customRoleId }
            });

            if (!customRole || !customRole.permissions) {
                return res.status(403).json({
                    success: false,
                    message: 'You do not have permission to perform this action'
                });
            }

            // Parse permissions - stored as JSON string in SQLite
            let permissions: Record<string, any>[] = [];
            try {
                permissions = typeof customRole.permissions === 'string'
                    ? JSON.parse(customRole.permissions)
                    : (customRole.permissions as Record<string, any>[] || []);
            } catch {
                permissions = [];
            }

            const modulePermission = permissions.find(
                (p: any) => p.module?.toLowerCase() === module.toLowerCase()
            );

            if (!modulePermission || !modulePermission[action]) {
                logger.warn(`Permission denied: User ${req.user.id} lacks ${action} permission for ${module}`);
                return res.status(403).json({
                    success: false,
                    message: `You do not have ${action} permission for ${module.toLowerCase()}`
                });
            }

            next();
        } catch (error: any) {
            logger.error('Permission check error:', error);
            return res.status(500).json({
                success: false,
                message: 'Error checking permissions'
            });
        }
    };
}

/**
 * Middleware to check if user can access sensitive settings
 * (e.g., bank details, financial year management)
 */
export function requireSensitiveAccess(settingType: 'BANK' | 'FINANCIAL_YEAR' | 'GSTIN' | 'USERS' | 'ROLES') {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const userRole = req.user.role;

        // Define which roles can access which sensitive settings
        const accessMatrix: Record<string, string[]> = {
            BANK: ['OWNER'],
            FINANCIAL_YEAR: ['OWNER'],
            GSTIN: ['OWNER'],
            USERS: ['OWNER', 'ADMIN'],
            ROLES: ['OWNER'],
        };

        const allowedRoles = accessMatrix[settingType] || ['OWNER'];

        if (!allowedRoles.includes(userRole)) {
            logger.warn(`Sensitive access denied: User ${req.user.id} (${userRole}) attempted to access ${settingType}`);
            return res.status(403).json({
                success: false,
                message: `Only ${allowedRoles.join(' or ').toLowerCase()}s can access ${settingType.toLowerCase()} settings`
            });
        }

        next();
    };
}

/**
 * Check if user owns the resource or is admin
 * Useful for profile/settings that users can only edit for themselves
 */
export function requireOwnershipOrAdmin(userIdParam = 'id') {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const targetUserId = req.params[userIdParam];
        const requestingUserId = req.user.id;
        const requestingUserRole = req.user.role;

        // Allow if user owns the resource or is ADMIN/OWNER
        if (
            targetUserId === requestingUserId ||
            requestingUserRole === 'ADMIN' ||
            requestingUserRole === 'OWNER'
        ) {
            return next();
        }

        return res.status(403).json({
            success: false,
            message: 'You can only modify your own data'
        });
    };
}

export default {
    requireRole,
    requireAdmin,
    requireOwner,
    requirePermission,
    requireSensitiveAccess,
    requireOwnershipOrAdmin,
};

/**
 * Custom Role Enforcement Middleware
 * 
 * P1: Checks CustomRole permissions for granular access control
 */

import { Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from './auth';
import { ROLES } from '../constants/roles';

interface PermissionObject {
    [module: string]: {
        read?: boolean;
        create?: boolean;
        update?: boolean;
        delete?: boolean;
        approve?: boolean;
        export?: boolean;
    };
}

/**
 * Middleware to check if user has required permission via CustomRole
 * 
 * @param module - The module to check (e.g., 'sales', 'purchase', 'inventory')
 * @param action - The action to check (e.g., 'read', 'create', 'update', 'delete')
 */
export function checkCustomRole(module: string, action: string) {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const user = req.user;

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            // Admin and Owner bypass custom role checks
            if (user.role === ROLES.ADMIN || user.role === ROLES.OWNER) {
                return next();
            }

            // Check if user has a custom role assigned
            const customRoleId = (user as any).customRoleId;

            if (!customRoleId) {
                // No custom role - use default role-based access
                // Default roles have access to most operations
                return next();
            }

            // Fetch the custom role
            const customRole = await prisma.customRole.findUnique({
                where: { id: customRoleId }
            });

            if (!customRole || !customRole.isActive) {
                return res.status(403).json({
                    success: false,
                    message: 'Your custom role is inactive or not found'
                });
            }

            // Parse permissions JSON - stored as string in SQLite
            const permissions: PermissionObject = typeof customRole.permissions === 'string'
                ? JSON.parse(customRole.permissions)
                : customRole.permissions as PermissionObject;

            // Check if the module exists in permissions
            if (!permissions[module]) {
                return res.status(403).json({
                    success: false,
                    message: `You do not have access to the ${module} module`
                });
            }

            // Check if the action is allowed
            const modulePermissions = permissions[module];
            const hasPermission = modulePermissions[action as keyof typeof modulePermissions];

            if (!hasPermission) {
                return res.status(403).json({
                    success: false,
                    message: `You do not have permission to ${action} in ${module}`
                });
            }

            // Permission granted
            next();
        } catch (error: any) {
            console.error('Custom role check error:', error);
            return res.status(500).json({
                success: false,
                message: 'Error checking permissions'
            });
        }
    };
}

/**
 * Helper to get all permissions for a user
 */
export async function getUserPermissions(userId: string): Promise<PermissionObject | null> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            role: true,
            customRoleId: true
        }
    });

    if (!user) return null;

    // Admin/Owner have all permissions
    if (user.role === ROLES.ADMIN || user.role === ROLES.OWNER) {
        return {
            sales: { read: true, create: true, update: true, delete: true, approve: true, export: true },
            purchase: { read: true, create: true, update: true, delete: true, approve: true, export: true },
            inventory: { read: true, create: true, update: true, delete: true, export: true },
            parties: { read: true, create: true, update: true, delete: true, export: true },
            accounting: { read: true, create: true, update: true, delete: true, approve: true, export: true },
            gst: { read: true, create: true, update: true, export: true },
            banking: { read: true, create: true, update: true, delete: true, approve: true, export: true },
            hr: { read: true, create: true, update: true, delete: true, approve: true, export: true },
            reports: { read: true, export: true },
            settings: { read: true, update: true }
        };
    }

    // Check custom role
    if (user.customRoleId) {
        const customRole = await prisma.customRole.findUnique({
            where: { id: user.customRoleId }
        });

        if (customRole && customRole.isActive) {
            // Parse JSON string if needed (SQLite)
            return typeof customRole.permissions === 'string'
                ? JSON.parse(customRole.permissions)
                : customRole.permissions as PermissionObject;
        }
    }

    // Default permissions based on role
    const defaultPermissions: Record<string, PermissionObject> = {
        [ROLES.MANAGER]: {
            sales: { read: true, create: true, update: true, delete: false, approve: true, export: true },
            purchase: { read: true, create: true, update: true, delete: false, approve: true, export: true },
            inventory: { read: true, create: true, update: true, delete: false, export: true },
            parties: { read: true, create: true, update: true, delete: false },
            accounting: { read: true, create: false, update: false },
            gst: { read: true },
            banking: { read: true, create: true },
            hr: { read: true, create: true, update: true },
            reports: { read: true, export: true },
            settings: { read: true }
        },
        [ROLES.ACCOUNTANT]: {
            sales: { read: true, create: false, update: false },
            purchase: { read: true, create: false, update: false },
            inventory: { read: true },
            parties: { read: true },
            accounting: { read: true, create: true, update: true, delete: false, approve: false, export: true },
            gst: { read: true, create: true, export: true },
            banking: { read: true, create: true, update: true },
            hr: { read: true },
            reports: { read: true, export: true },
            settings: { read: true }
        },
        [ROLES.STAFF]: {
            sales: { read: true, create: true, update: true },
            purchase: { read: true, create: true },
            inventory: { read: true },
            parties: { read: true, create: true },
            accounting: { read: false },
            gst: { read: false },
            banking: { read: false },
            hr: { read: false },
            reports: { read: false },
            settings: { read: false }
        },
        [ROLES.AUDITOR]: {
            sales: { read: true, export: true },
            purchase: { read: true, export: true },
            inventory: { read: true, export: true },
            parties: { read: true, export: true },
            accounting: { read: true, export: true },
            gst: { read: true, export: true },
            banking: { read: true, export: true },
            hr: { read: true, export: true },
            reports: { read: true, export: true },
            settings: { read: true }
        }
    };

    return defaultPermissions[user.role] || null;
}

export default { checkCustomRole, getUserPermissions };

/**
 * RBAC (Role-Based Access Control) Middleware
 * Fine-grained permission checking beyond basic role verification
 *
 * Roles: OWNER > ADMIN > MANAGER > STAFF > VIEWER
 * Each role inherits permissions from roles below it.
 */
import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

const ROLE_HIERARCHY: Record<string, number> = {
    OWNER: 100,
    ADMIN: 80,
    MANAGER: 60,
    STAFF: 40,
    VIEWER: 20,
};

/**
 * Module-level permissions map
 * Format: { module: { action: minimumRole } }
 */
const PERMISSIONS: Record<string, Record<string, string>> = {
    dashboard: { view: 'VIEWER', export: 'STAFF' },
    invoices: { view: 'VIEWER', create: 'STAFF', edit: 'STAFF', delete: 'MANAGER', approve: 'MANAGER', export: 'STAFF' },
    payments: { view: 'VIEWER', create: 'STAFF', approve: 'MANAGER', refund: 'ADMIN' },
    escrow: { view: 'VIEWER', create: 'MANAGER', approve: 'ADMIN', release: 'ADMIN' },
    parties: { view: 'VIEWER', create: 'STAFF', edit: 'STAFF', delete: 'MANAGER' },
    inventory: { view: 'VIEWER', create: 'STAFF', edit: 'STAFF', adjust: 'MANAGER' },
    gst: { view: 'VIEWER', file: 'ADMIN', reconcile: 'MANAGER' },
    reports: { view: 'MANAGER', export: 'MANAGER', financial: 'ADMIN' },
    settings: { view: 'ADMIN', edit: 'ADMIN', company: 'OWNER' },
    admin: { view: 'ADMIN', users: 'ADMIN', roles: 'OWNER', audit: 'ADMIN', support: 'STAFF' },
};

/**
 * Check if a user's role meets the minimum required role
 */
function hasPermission(userRole: string, requiredRole: string): boolean {
    const userLevel = ROLE_HIERARCHY[userRole] || 0;
    const requiredLevel = ROLE_HIERARCHY[requiredRole] || 100;
    return userLevel >= requiredLevel;
}

/**
 * Middleware factory: require a minimum role
 * Usage: router.get('/admin', requireRole('ADMIN'), handler)
 */
export function requireRole(...allowedRoles: string[]) {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ success: false, error: 'Authentication required' });
        }

        const userRole = req.user.role || 'VIEWER';
        const isAllowed = allowedRoles.some(role => hasPermission(userRole, role));

        if (!isAllowed) {
            return res.status(403).json({
                success: false,
                error: `Insufficient permissions. Required: ${allowedRoles.join(' or ')}. Your role: ${userRole}`,
            });
        }

        next();
    };
}

/**
 * Middleware factory: require specific module + action permission
 * Usage: router.post('/invoices', requirePermission('invoices', 'create'), handler)
 */
export function requirePermission(module: string, action: string) {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ success: false, error: 'Authentication required' });
        }

        const userRole = req.user.role || 'VIEWER';
        const modulePerms = PERMISSIONS[module];

        if (!modulePerms) {
            // Module not defined — default to ADMIN
            if (!hasPermission(userRole, 'ADMIN')) {
                return res.status(403).json({ success: false, error: `No permission for module: ${module}` });
            }
            return next();
        }

        const requiredRole = modulePerms[action] || 'ADMIN';
        if (!hasPermission(userRole, requiredRole)) {
            return res.status(403).json({
                success: false,
                error: `Permission denied: ${module}.${action} requires ${requiredRole}. Your role: ${userRole}`,
            });
        }

        next();
    };
}

/**
 * Get all permissions for a given role (for frontend use)
 */
export function getRolePermissions(role: string): Record<string, string[]> {
    const result: Record<string, string[]> = {};

    for (const [module, actions] of Object.entries(PERMISSIONS)) {
        const allowed = Object.entries(actions)
            .filter(([, requiredRole]) => hasPermission(role, requiredRole))
            .map(([action]) => action);
        if (allowed.length > 0) {
            result[module] = allowed;
        }
    }

    return result;
}

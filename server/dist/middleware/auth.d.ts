import { Request, Response, NextFunction } from 'express';
export interface AuthUser {
    id: string;
    email: string;
    name: string;
    phone: string | null;
    status: string;
    role: string;
    companyId: string;
    companies: CompanyMembership[];
    [key: string]: unknown;
}
export interface CompanyMembership {
    companyId: string;
    companyName: string;
    role: string;
    isDefault: boolean;
}
export interface AuthRequest extends Request {
    user?: any;
    companyId?: string;
}
export interface ProtectedRequest extends Request {
    user: AuthUser;
    companyId: string;
}
/**
 * Verify JWT token and attach user to request
 *
 * P0-1: Now supports multi-company users
 * - Reads x-company-id header to determine active company
 * - Falls back to user's default company if header not provided
 * - Validates user has access to requested company
 */
export declare const protect: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void | Response>;
/**
 * Role-based authorization
 *
 * P0-3: Now uses role hierarchy
 * - OWNER > ADMIN > MANAGER > ACCOUNTANT > STAFF/USER
 * - AUDITOR has special read-only access
 *
 * Usage:
 *   authorize('MANAGER')      // Requires MANAGER or higher
 *   authorize('ADMIN', 'OWNER') // Requires ADMIN or OWNER
 */
export declare const authorize: (...allowedRoles: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => void | Response;
/**
 * Require at least the specified role level
 *
 * Usage:
 *   requireRole('MANAGER') // Allows MANAGER, ADMIN, OWNER
 */
export declare const requireRole: (minimumRole: string) => (req: AuthRequest, res: Response, next: NextFunction) => void | Response;
/**
 * Allow only AUDITOR role (read-only routes)
 */
export declare const allowAuditor: (req: AuthRequest, res: Response, next: NextFunction) => void | Response;
/**
 * Verify user has access to the company specified in route params
 *
 * P0-1: Updated to use new multi-company model
 */
export declare const verifyCompanyAccess: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void | Response>;
/**
 * Require OWNER role for the current company
 * Used for destructive operations like company deletion
 */
export declare const requireOwner: (req: AuthRequest, res: Response, next: NextFunction) => void | Response;
/**
 * Check if user has a specific permission via Custom Role
 * P0-3: Granular permission check
 */
export declare const checkCustomRole: (requiredPermission: string) => (req: AuthRequest, res: Response, next: NextFunction) => void | Response;
//# sourceMappingURL=auth.d.ts.map
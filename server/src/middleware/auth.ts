import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import logger from '../config/logger';

// ============ TYPES ============
import { ROLES, ROLE_HIERARCHY, Role } from '../constants/roles';
import { USER_STATUS } from '../constants/statuses';

// User object attached to request after authentication
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  status: string;
  role: string;              // Role in current company
  companyId: string;         // Current active company
  companies: CompanyMembership[];  // All companies user belongs to
  [key: string]: unknown;
}

export interface CompanyMembership {
  companyId: string;
  companyName: string;
  role: string;
  isDefault: boolean;
}

// Request type for routes - backwards compatible with existing controllers
// user is typed as 'any' to avoid breaking existing code
export interface AuthRequest extends Request {
  user?: any;  // Use 'any' for backwards compatibility with existing controllers
  companyId?: string;
}

// Request type for routes BEHIND protect middleware (user is guaranteed)
// Use this in NEW controllers for better type safety
export interface ProtectedRequest extends Request {
  user: AuthUser;
  companyId: string;
}

// P0-3: Role hierarchy is now imported from constants/roles.ts

// ============ PROTECT MIDDLEWARE ============

/**
 * Verify JWT token and attach user to request
 * 
 * P0-1: Now supports multi-company users
 * - Reads x-company-id header to determine active company
 * - Falls back to user's default company if header not provided
 * - Validates user has access to requested company
 */
export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    let token: string | undefined;

    // Get token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token provided'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };

    // Get user with company memberships
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        customRole: true,
        userCompanies: {
          where: { isActive: true },
          include: {
            company: {
              select: { id: true, businessName: true }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.status !== USER_STATUS.ACTIVE) {
      return res.status(401).json({
        success: false,
        message: 'User account is inactive'
      });
    }

    // Build company memberships list
    const companies: CompanyMembership[] = user.userCompanies.map(uc => ({
      companyId: uc.companyId,
      companyName: uc.company.businessName,
      role: uc.role,
      isDefault: uc.isDefault
    }));

    // P0-1: Handle legacy users who don't have UserCompany records yet
    // Fall back to User.companyId if no memberships exist
    if (companies.length === 0 && user.companyId) {
      const legacyCompany = await prisma.company.findUnique({
        where: { id: user.companyId },
        select: { id: true, businessName: true }
      });

      if (legacyCompany) {
        companies.push({
          companyId: legacyCompany.id,
          companyName: legacyCompany.businessName,
          role: user.role,
          isDefault: true
        });
      }
    }

    // Determine active company
    // Priority: 1) x-company-id header, 2) default company, 3) first company
    const requestedCompanyId = req.headers['x-company-id'] as string;
    let activeCompany: CompanyMembership | undefined;

    if (requestedCompanyId) {
      activeCompany = companies.find(c => c.companyId === requestedCompanyId);
      if (!activeCompany) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this company'
        });
      }
    } else {
      activeCompany = companies.find(c => c.isDefault) || companies[0];
    }

    if (!activeCompany) {
      return res.status(403).json({
        success: false,
        message: 'User is not a member of any company'
      });
    }

    // Attach user to request (exclude password)
    const { password, userCompanies, ...userWithoutPassword } = user;
    req.user = {
      ...userWithoutPassword,
      role: activeCompany.role,
      companyId: activeCompany.companyId,
      companies
    };
    req.companyId = activeCompany.companyId;

    next();
    return;
  } catch (error: any) {
    logger.error('Authentication error:', error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Server error during authentication'
    });
  }
};

// ============ AUTHORIZE MIDDLEWARE ============

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
export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void | Response => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const userRole = req.user.role.toUpperCase();
    const userRoleLevel = ROLE_HIERARCHY[userRole as Role] ?? 0;

    // Check if user's role matches any allowed role
    // Or if user's role level is >= highest required level
    const isAuthorized = allowedRoles.some(role => {
      const requiredLevel = ROLE_HIERARCHY[role.toUpperCase() as Role] ?? 0;

      // Exact match
      if (userRole === role.toUpperCase()) return true;

      // Role hierarchy check (except for AUDITOR which is special)
      if (userRole !== ROLES.AUDITOR && userRoleLevel >= requiredLevel) return true;

      return false;
    });

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this route`
      });
    }

    next();
    return;
  };
};

/**
 * Require at least the specified role level
 * 
 * Usage:
 *   requireRole('MANAGER') // Allows MANAGER, ADMIN, OWNER
 */
export const requireRole = (minimumRole: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void | Response => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const userRole = req.user.role.toUpperCase();
    const userRoleLevel = ROLE_HIERARCHY[userRole as Role] ?? 0;
    const requiredLevel = ROLE_HIERARCHY[minimumRole.toUpperCase() as Role] ?? 0;

    // AUDITOR is read-only, can't perform write operations
    if (userRole === ROLES.AUDITOR) {
      return res.status(403).json({
        success: false,
        message: 'Auditors have read-only access'
      });
    }

    if (userRoleLevel < requiredLevel) {
      return res.status(403).json({
        success: false,
        message: `This action requires ${minimumRole} role or higher`
      });
    }

    next();
    return;
  };
};

/**
 * Allow only AUDITOR role (read-only routes)
 */
export const allowAuditor = (req: AuthRequest, res: Response, next: NextFunction): void | Response => {
  // Auditors can access read-only routes
  // This is a marker middleware, actual permissions handled elsewhere
  next();
  return;
};

// ============ COMPANY ACCESS MIDDLEWARE ============

/**
 * Verify user has access to the company specified in route params
 * 
 * P0-1: Updated to use new multi-company model
 */
export const verifyCompanyAccess = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    const { companyId } = req.params;

    if (!companyId) {
      return next();
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Check if user has access to this company
    const companies = req.user.companies as CompanyMembership[] | undefined;
    const hasAccess = companies?.some(c => c.companyId === companyId) ?? false;

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this company data'
      });
    }

    req.companyId = companyId;
    next();
    return;
  } catch (error) {
    logger.error('Company access verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error verifying company access'
    });
  }
};

/**
 * Require OWNER role for the current company
 * Used for destructive operations like company deletion
 */
export const requireOwner = (req: AuthRequest, res: Response, next: NextFunction): void | Response => {
  if (!req.user || req.user.role !== ROLES.OWNER) {
    return res.status(403).json({
      success: false,
      message: 'Only the company owner can perform this action'
    });
  }
  next();
  return;
};

/**
 * Check if user has a specific permission via Custom Role
 * P0-3: Granular permission check
 */
export const checkCustomRole = (requiredPermission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void | Response => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    // OWNER and ADMIN have all permissions
    if (req.user.role === ROLES.OWNER || req.user.role === ROLES.ADMIN) {
      next();
      return;
    }

    // Check custom role permissions
    // Note: customRole is attached in protect middleware
    const permissions = (req.user as any).customRole?.permissions;

    if (Array.isArray(permissions) && permissions.includes(requiredPermission)) {
      next();
      return;
    }

    return res.status(403).json({
      success: false,
      message: `Missing permission: ${requiredPermission}`
    });
  };
};

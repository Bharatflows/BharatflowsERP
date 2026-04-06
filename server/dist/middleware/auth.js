"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkCustomRole = exports.requireOwner = exports.verifyCompanyAccess = exports.allowAuditor = exports.requireRole = exports.authorize = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../config/prisma"));
const logger_1 = __importDefault(require("../config/logger"));
// ============ TYPES ============
const roles_1 = require("../constants/roles");
const statuses_1 = require("../constants/statuses");
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
const protect = async (req, res, next) => {
    try {
        let token;
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
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // Get user with company memberships
        const user = await prisma_1.default.user.findUnique({
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
        if (user.status !== statuses_1.USER_STATUS.ACTIVE) {
            return res.status(401).json({
                success: false,
                message: 'User account is inactive'
            });
        }
        // Build company memberships list
        const companies = user.userCompanies.map(uc => ({
            companyId: uc.companyId,
            companyName: uc.company.businessName,
            role: uc.role,
            isDefault: uc.isDefault
        }));
        // P0-1: Handle legacy users who don't have UserCompany records yet
        // Fall back to User.companyId if no memberships exist
        if (companies.length === 0 && user.companyId) {
            const legacyCompany = await prisma_1.default.company.findUnique({
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
        const requestedCompanyId = req.headers['x-company-id'];
        let activeCompany;
        if (requestedCompanyId) {
            activeCompany = companies.find(c => c.companyId === requestedCompanyId);
            if (!activeCompany) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied to this company'
                });
            }
        }
        else {
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
    }
    catch (error) {
        logger_1.default.error('Authentication error:', error);
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
exports.protect = protect;
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
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized'
            });
        }
        const userRole = req.user.role.toUpperCase();
        const userRoleLevel = roles_1.ROLE_HIERARCHY[userRole] ?? 0;
        // Check if user's role matches any allowed role
        // Or if user's role level is >= highest required level
        const isAuthorized = allowedRoles.some(role => {
            const requiredLevel = roles_1.ROLE_HIERARCHY[role.toUpperCase()] ?? 0;
            // Exact match
            if (userRole === role.toUpperCase())
                return true;
            // Role hierarchy check (except for AUDITOR which is special)
            if (userRole !== roles_1.ROLES.AUDITOR && userRoleLevel >= requiredLevel)
                return true;
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
exports.authorize = authorize;
/**
 * Require at least the specified role level
 *
 * Usage:
 *   requireRole('MANAGER') // Allows MANAGER, ADMIN, OWNER
 */
const requireRole = (minimumRole) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized'
            });
        }
        const userRole = req.user.role.toUpperCase();
        const userRoleLevel = roles_1.ROLE_HIERARCHY[userRole] ?? 0;
        const requiredLevel = roles_1.ROLE_HIERARCHY[minimumRole.toUpperCase()] ?? 0;
        // AUDITOR is read-only, can't perform write operations
        if (userRole === roles_1.ROLES.AUDITOR) {
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
exports.requireRole = requireRole;
/**
 * Allow only AUDITOR role (read-only routes)
 */
const allowAuditor = (req, res, next) => {
    // Auditors can access read-only routes
    // This is a marker middleware, actual permissions handled elsewhere
    next();
    return;
};
exports.allowAuditor = allowAuditor;
// ============ COMPANY ACCESS MIDDLEWARE ============
/**
 * Verify user has access to the company specified in route params
 *
 * P0-1: Updated to use new multi-company model
 */
const verifyCompanyAccess = async (req, res, next) => {
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
        const companies = req.user.companies;
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
    }
    catch (error) {
        logger_1.default.error('Company access verification error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error verifying company access'
        });
    }
};
exports.verifyCompanyAccess = verifyCompanyAccess;
/**
 * Require OWNER role for the current company
 * Used for destructive operations like company deletion
 */
const requireOwner = (req, res, next) => {
    if (!req.user || req.user.role !== roles_1.ROLES.OWNER) {
        return res.status(403).json({
            success: false,
            message: 'Only the company owner can perform this action'
        });
    }
    next();
    return;
};
exports.requireOwner = requireOwner;
/**
 * Check if user has a specific permission via Custom Role
 * P0-3: Granular permission check
 */
const checkCustomRole = (requiredPermission) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }
        // OWNER and ADMIN have all permissions
        if (req.user.role === roles_1.ROLES.OWNER || req.user.role === roles_1.ROLES.ADMIN) {
            next();
            return;
        }
        // Check custom role permissions
        // Note: customRole is attached in protect middleware
        const permissions = req.user.customRole?.permissions;
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
exports.checkCustomRole = checkCustomRole;
//# sourceMappingURL=auth.js.map
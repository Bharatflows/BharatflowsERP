"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyCompanyAccess = exports.authorize = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../config/prisma"));
const logger_1 = __importDefault(require("../config/logger"));
// Verify JWT token
const protect = async (req, res, next) => {
    try {
        let token;
        // Get token from Authorization header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        // Check if token exists
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized, no token provided'
            });
        }
        // Verify token
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // Get user from token
        const user = await prisma_1.default.user.findUnique({
            where: { id: decoded.id }
        });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }
        // Check if user is active
        if (user.status !== 'ACTIVE') {
            return res.status(401).json({
                success: false,
                message: 'User account is inactive'
            });
        }
        // Attach user to request (exclude password)
        const { password, ...userWithoutPassword } = user;
        req.user = userWithoutPassword;
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
// Role-based authorization
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized'
            });
        }
        // Case insensitive role check
        const userRole = req.user.role.toUpperCase();
        const authorizedRoles = roles.map(r => r.toUpperCase());
        if (!authorizedRoles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: `User role '${req.user.role}' is not authorized to access this route`
            });
        }
        next();
        return;
    };
};
exports.authorize = authorize;
// Company access verification
const verifyCompanyAccess = async (req, res, next) => {
    try {
        const { companyId } = req.params;
        if (!companyId) {
            return next();
        }
        // Check if user has access to this company
        if (req.user.companyId !== companyId) {
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
//# sourceMappingURL=auth.js.map
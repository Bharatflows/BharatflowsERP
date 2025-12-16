import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import logger from '../config/logger';

// Extend Express Request type
export interface AuthRequest extends Request {
  user?: any;
  companyId?: string;
}

// Verify JWT token
export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    let token: string | undefined;

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
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);

    // Get user from token
    const user = await prisma.user.findUnique({
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

// Role-based authorization
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void | Response => {
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

// Company access verification
export const verifyCompanyAccess = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response> => {
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
  } catch (error) {
    logger.error('Company access verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error verifying company access'
    });
  }
};

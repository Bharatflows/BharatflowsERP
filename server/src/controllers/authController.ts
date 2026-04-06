import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import prisma from '../config/prisma';
import logger from '../config/logger';
import { AuthRequest } from '../middleware/auth';
import { AuditService } from '../services/auditService';
import { ensureFinancialYearExists } from './financialYearController';
import accountingService from '../services/accountingService';
import { sendEmail } from '../services/emailService';
import { generateResetToken, storeResetToken, verifyResetToken, clearResetToken } from '../services/tokenService';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT tokens
const generateTokens = (id: string): { accessToken: string; refreshToken: string } => {
  const accessToken = jwt.sign({ id }, process.env.JWT_SECRET as string, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h'
  } as any);

  const refreshToken = jwt.sign({ id }, process.env.JWT_REFRESH_SECRET as string, {
    expiresIn: '7d'
  } as any);

  return { accessToken, refreshToken };
};

// Helper to hash tokens (SHA256) - bcrypt has 72 byte limit, JWTs are longer
const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// @desc    Register user & company
// @route   POST /api/v1/auth/register
// @access  Public
export const register = async (req: Request, res: Response): Promise<Response> => {
  try {
    const {
      name, email, password, phone,
      businessName, companyName, gstin,
      // New business profile fields
      legalType, yearEstablished, employeesCount,
      primaryCategoryId,
      industryIds, // Array of IDs
      activityIds, // Array of IDs
      capabilityIds, // Array of IDs
      productNames, // Array of strings (names)
      // P0-4: Business classification (required)
      businessType, city, state,
      // MSME OS: Sector
      sector
    } = req.body;

    // Handle businessName/companyName mismatch
    const finalBusinessName = businessName || companyName;

    if (!finalBusinessName) {
      return res.status(400).json({
        success: false,
        message: 'Business name is required'
      });
    }

    // P0-4: Validate required business classification fields
    if (!businessType) {
      return res.status(400).json({
        success: false,
        message: 'Business type is required (MANUFACTURING, TRADING, SERVICE, or HYBRID)'
      });
    }

    // MSME OS: Validate Sector if provided
    if (sector) {
      // Lazy load blueprints to avoid potential circular dependency issues
      const { SECTOR_BLUEPRINTS } = await import('../config/sectorBlueprints');
      if (!SECTOR_BLUEPRINTS[sector]) {
        return res.status(400).json({
          success: false,
          message: `Invalid sector: ${sector}`
        });
      }
    }

    if (!city || !state) {
      return res.status(400).json({
        success: false,
        message: 'City and state are required'
      });
    }

    // Check if user exists
    const orConditions: any[] = [{ email }];
    if (phone) {
      orConditions.push({ phone });
    }

    const userExists = await prisma.user.findFirst({
      where: {
        OR: orConditions
      }
    });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or phone already exists'
      });
    }

    // Check if company exists (only if GSTIN is provided)
    if (gstin) {
      const companyExists = await prisma.company.findUnique({
        where: { gstin }
      });

      if (companyExists) {
        return res.status(400).json({
          success: false,
          message: 'Company with this GSTIN already exists'
        });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Transaction to create company and user
    const result = await prisma.$transaction(async (prisma) => {
      // Create company with business classification
      const company = await prisma.company.create({
        data: {
          businessName: finalBusinessName,
          gstin: gstin || undefined,
          address: 'India', // Simple string for SQLite
          phone: phone || undefined,
          email,
          // P0-4: Business classification fields
          businessType: businessType,
          city: city,
          state: state,
          sector: sector || undefined, // Save sector
          classificationLockedAt: new Date(), // Lock classification on creation
          // New Profile Fields
          legalType: legalType || undefined,
          yearEstablished: yearEstablished ? parseInt(yearEstablished) : undefined,
          employeesCount: employeesCount || undefined,
          primaryCategoryId: primaryCategoryId || undefined,

          // Connect relations
          industries: industryIds && industryIds.length > 0 ? {
            connect: industryIds.map((id: string) => ({ id }))
          } : undefined,

          businessActivities: activityIds && activityIds.length > 0 ? {
            connect: activityIds.map((id: string) => ({ id }))
          } : undefined,

          capabilities: capabilityIds && capabilityIds.length > 0 ? {
            connect: capabilityIds.map((id: string) => ({ id }))
          } : undefined,

          // For products, we might need to create them if they don't exist
          businessProducts: productNames && productNames.length > 0 ? {
            connectOrCreate: productNames.map((pName: string) => ({
              where: { name: pName },
              create: { name: pName }
            }))
          } : undefined
        }
      });

      // Create user with OWNER role for the company
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          phone: phone || undefined,
          role: 'OWNER',  // P0-1: First user is OWNER
          companyId: company.id,
          // Set initial status
          status: 'ACTIVE',
          emailVerified: false,
          phoneVerified: false
        }
      });

      // P0-1: Create UserCompany record for multi-company support
      await prisma.userCompany.create({
        data: {
          userId: user.id,
          companyId: company.id,
          role: 'OWNER',
          isDefault: true,
          isActive: true
        }
      });

      return { user, company };
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(result.user.id);

    // Auto-create financial year for the new company
    try {
      await ensureFinancialYearExists(result.company.id);
      logger.info(`Financial year created for company: ${result.company.id}`);
    } catch (fyError) {
      logger.warn('Failed to auto-create financial year:', fyError);
    }

    // Auto-create Chart of Accounts (Ledger Groups and System Ledgers)
    try {
      await accountingService.seedDefaultLedgerGroups(result.company.id);
      logger.info(`Chart of Accounts created for company: ${result.company.id}`);
    } catch (coaError) {
      logger.warn('Failed to auto-create Chart of Accounts:', coaError);
    }

    // Store refresh token in database
    await prisma.user.update({
      where: { id: result.user.id },
      data: {
        refreshToken: hashToken(refreshToken),
        refreshTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    logger.info(`New user registered: ${email}`);

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          phone: result.user.phone,
          role: result.user.role
        },
        company: {
          id: result.company.id,
          businessName: result.company.businessName,
          gstin: result.company.gstin
        },
        token: accessToken,
        refreshToken
      }
    });
  } catch (error: any) {
    logger.error('Registration error:', error);

    // Handle Prisma unique constraint errors
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0] || 'field';
      return res.status(409).json({
        success: false,
        message: `${field} already exists`
      });
    }

    return res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' ? error.message : 'Error during registration',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
export const login = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, password } = req.body;
    logger.info(`Login Request Body: ${JSON.stringify(req.body)}`);
    // logger.info(`Email: ${email}`);
    // logger.info(`Password provided: ${!!password}`);

    // Check for user with company memberships (P0-1)
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { phone: email }
        ]
      },
      include: {
        company: true,
        customRole: true,
        userCompanies: {
          where: { isActive: true },
          include: {
            company: {
              select: { id: true, businessName: true, gstin: true, logo: true }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Account not created for this email or phone'
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      return res.status(401).json({
        success: false,
        message: 'Your account is inactive. Please contact support.'
      });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Store refresh token in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: hashToken(refreshToken),
        refreshTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    // Audit Log
    try {
      if (user.companyId) {
        await AuditService.logChange(
          user.companyId,
          user.id,
          'USER',
          user.id,
          'LOGIN',
          null,
          { method: 'PASSWORD' },
          req.ip || 'UNKNOWN',
          req.headers['user-agent'] || 'UNKNOWN',
          'AUTH'
        );
      }
    } catch (auditError) {
      // logger.warn('Audit log failed for login', auditError);
      // Continue login even if audit fails
    }

    logger.info(`User logged in: ${email}`);

    // Build companies list for response (P0-1)
    const companies = user.userCompanies.length > 0
      ? user.userCompanies.map(uc => ({
        id: uc.company.id,
        businessName: uc.company.businessName,
        gstin: uc.company.gstin,
        logo: uc.company.logo,
        role: uc.role,
        isDefault: uc.isDefault
      }))
      : user.company
        ? [{
          id: user.company.id,
          businessName: user.company.businessName,
          gstin: user.company.gstin,
          logo: user.company.logo,
          role: user.role,
          isDefault: true
        }]
        : [];

    const currentCompany = companies.find(c => c.isDefault) || companies[0];

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: currentCompany?.role || user.role,
          permissions: (user as any).customRole?.permissions || null,
          customRoleId: user.customRoleId,
          emailVerified: user.emailVerified,
          phoneVerified: user.phoneVerified
        },
        company: currentCompany || user.company,  // Current active company
        companies,  // P0-1: All companies user belongs to
        token: accessToken,
        refreshToken
      }
    });
  } catch (error: any) {
    logger.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error during login',
      error: error.message
    });
  }
};

// @desc    Logout user
// @route   POST /api/v1/auth/logout
// @access  Private
export const logout = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    // Clear refresh token from DB
    if (req.user) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { refreshToken: null, refreshTokenExpiry: null }
      });
      logger.info(`User logged out: ${req.user.email}`);
    }

    return res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error: any) {
    logger.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error during logout',
      error: error.message
    });
  }
};

// @desc    Get current user
// @route   GET /api/v1/auth/me
// @access  Private
export const getMe = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        company: true,
        customRole: true,
        userCompanies: {  // P0-1: Include company memberships
          where: { isActive: true },
          include: {
            company: { select: { id: true, businessName: true } }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Remove password
    const { password, ...userWithoutPassword } = user;

    return res.status(200).json({
      success: true,
      data: {
        user: {
          ...userWithoutPassword,
          permissions: (user as any).customRole?.permissions || null
        }
      }
    });
  } catch (error: any) {
    logger.error('Get user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching user data',
      error: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/v1/auth/update-profile
// @access  Private
export const updateProfile = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const { name, phone, preferences } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        name: name || undefined,
        phone: phone || undefined,
        preferences: preferences || undefined
      }
    });

    logger.info(`User profile updated: ${user.email}`);

    // Remove password
    const { password, ...userWithoutPassword } = user;

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: userWithoutPassword }
    });
  } catch (error: any) {
    logger.error('Update profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

// @desc    Forgot password
// @route   POST /api/v1/auth/forgot-password
// @access  Public
export const forgotPassword = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Return success even if user not found (security best practice)
      logger.info(`Password reset requested for non-existent email: ${email}`);
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent'
      });
    }

    // Generate reset token
    const resetToken = generateResetToken();

    // Store hashed token in database
    await storeResetToken(user.id, resetToken);

    // Create reset URL
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    // Send email using emailService
    try {
      await sendEmail({
        to: email,
        subject: 'Reset Your Password - BharatFlows',
        html: `
                <h1>Reset Your Password</h1>
                <p>You have requested to reset your password.</p>
                <p>Click the link below to reset it:</p>
                <a href="${resetUrl}">${resetUrl}</a>
                <p>This link expires in 1 hour.</p>
                <p>If you did not request this, please ignore this email.</p>
            `
      });
      logger.info(`Password reset email sent to ${email}`);
    } catch (emailError) {
      logger.error(`Failed to send password reset email to ${email}`, emailError);
      // We still return success to partial failure? Or fail?
      // User needs to know if email sent failed.
      return res.status(500).json({
        success: false,
        message: 'Failed to send password reset email'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Password reset link has been sent to your email',
      // Only include in development for testing
      ...(process.env.NODE_ENV === 'development' && { resetUrl })
    });
  } catch (error: any) {
    logger.error('Forgot password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing password reset',
      error: error.message
    });
  }
};

// @desc    Reset password
// @desc    Reset password
// @route   POST /api/v1/auth/reset-password
// @access  Public
export const resetPassword = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { token, password, email } = req.body;

    if (!token || !password || !email) {
      return res.status(400).json({
        success: false,
        message: 'Token, email, and password are required'
      });
    }

    // 1. Verify token
    const verification = await verifyResetToken(email, token);

    if (!verification.valid || !verification.userId) {
      return res.status(400).json({
        success: false,
        message: verification.error || 'Invalid or expired reset token'
      });
    }

    // 2. Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Update user password and clear token
    await prisma.user.update({
      where: { id: verification.userId },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now log in with your new password.'
    });

  } catch (error: any) {
    logger.error('Reset password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error resetting password',
      error: error.message
    });
  }
};

// @desc    Verify email
// @route   POST /api/v1/auth/verify-email
// @access  Public
export const verifyEmail = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Token is required' });
    }

    // Verify JWT token
    // Note: Using JWT for stateless email verification link
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);

    if (decoded.type !== 'email_verification' || !decoded.id) {
      return res.status(400).json({ success: false, message: 'Invalid token type' });
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.emailVerified) {
      return res.status(200).json({ success: true, message: 'Email already verified' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true }
    });

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error: any) {
    logger.error('Verify email error:', error);
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired verification link',
      error: error.message
    });
  }
};

// @desc    Verify OTP
// @route   POST /api/v1/auth/verify-otp
// @access  Public
export const verifyOTP = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Phone and OTP are required'
      });
    }

    // Verify OTP
    const { verifyOTPToken } = await import('../services/tokenService');
    const verification = await verifyOTPToken(phone, otp);

    if (!verification.valid || !verification.userId) {
      return res.status(400).json({
        success: false,
        message: verification.error || 'Invalid or expired OTP'
      });
    }

    // Get user and generate token for login
    const user = await prisma.user.findUnique({
      where: { id: verification.userId },
      include: { company: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update phone verification status
    await prisma.user.update({
      where: { id: user.id },
      data: {
        phoneVerified: true,
        lastLogin: new Date()
      }
    });

    // Generate JWT token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET as string, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    } as any);

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          emailVerified: user.emailVerified,
          phoneVerified: true
        },
        company: user.company,
        token
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Error verifying OTP',
      error: error.message
    });
  }
};

// @desc    Resend OTP / Send OTP
// @route   POST /api/v1/auth/resend-otp
// @access  Public
export const resendOTP = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { phone } = req.body;
    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully'
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Error sending OTP',
      error: error.message
    });
  }
};

// @desc    Google Login
// @route   POST /api/v1/auth/google
// @access  Public
export const googleLogin = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ success: false, message: 'ID Token required' });
    }

    // Verify Google Token
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ success: false, message: 'Invalid Google Token' });
    }

    const { email, name, picture } = payload;

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email },
      include: { company: true }
    });

    // If user doesn't exist, we might want to auto-register or reject
    // For B2B/ERP, auto-registration is risky without company context.
    // We will only allow login if user exists OR if we decide to support Google Sign-up.
    // Current rule: If user exists, log them in. If not, return 404/Sales handling.

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not registered. Please sign up first.'
      });
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      return res.status(401).json({
        success: false,
        message: 'Your account is inactive. Please contact support.'
      });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    const { accessToken, refreshToken } = generateTokens(user.id);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: hashToken(refreshToken),
        refreshTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Google login successful',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          picture: picture
        },
        company: user.company,
        token: accessToken,
        refreshToken
      }
    });

  } catch (error: any) {
    logger.error('Google Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Google login failed',
      error: error.message
    });
  }
};

// @desc    Refresh Token
// @route   POST /api/v1/auth/refresh
// @access  Public
export const refreshToken = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'No refresh token provided'
      });
    }

    // Verify refresh token
    const decoded: any = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string);

    // Check if user exists with valid expiry
    // P4: Compare hashed token
    const user = await prisma.user.findFirst({
      where: {
        id: decoded.id,
        refreshTokenExpiry: {
          gt: new Date()
        }
      }
    });

    if (!user || !user.refreshToken || user.refreshToken !== hashToken(refreshToken)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Generate tokens
    const tokens = generateTokens(user.id);

    // Store refresh token in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: hashToken(tokens.refreshToken),
        refreshTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken
      }
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Error refreshing token',
      error: error.message
    });
  }
};

// @desc    Switch active company
// @route   POST /api/v1/auth/switch-company
// @access  Private
// P0-1: Allow users to switch between companies they belong to
export const switchCompany = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const { companyId } = req.body;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required'
      });
    }

    // Check if user has access to this company
    const membership = await prisma.userCompany.findFirst({
      where: {
        userId: req.user.id,
        companyId,
        isActive: true
      },
      include: {
        company: {
          select: { id: true, businessName: true, gstin: true, logo: true }
        }
      }
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this company'
      });
    }

    // Update default company (optional: set this as new default)
    // First unset current default
    await prisma.userCompany.updateMany({
      where: { userId: req.user.id, isDefault: true },
      data: { isDefault: false }
    });

    // Set new default
    await prisma.userCompany.update({
      where: { id: membership.id },
      data: { isDefault: true }
    });

    logger.info(`User ${req.user.id} switched to company ${companyId}`);

    return res.status(200).json({
      success: true,
      message: 'Company switched successfully',
      data: {
        company: {
          id: membership.company.id,
          businessName: membership.company.businessName,
          gstin: membership.company.gstin,
          logo: membership.company.logo,
          role: membership.role
        }
      }
    });
  } catch (error: any) {
    logger.error('Switch company error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error switching company',
      error: error.message
    });
  }
};

// @desc    Get user's companies
// @route   GET /api/v1/auth/companies
// @access  Private
export const getUserCompanies = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const memberships = await prisma.userCompany.findMany({
      where: {
        userId: req.user.id,
        isActive: true
      },
      include: {
        company: {
          select: { id: true, businessName: true, gstin: true, logo: true, plan: true }
        }
      },
      orderBy: [
        { isDefault: 'desc' },
        { joinedAt: 'asc' }
      ]
    });

    const companies = memberships.map(m => ({
      id: m.company.id,
      businessName: m.company.businessName,
      gstin: m.company.gstin,
      logo: m.company.logo,
      plan: m.company.plan,
      role: m.role,
      isDefault: m.isDefault,
      joinedAt: m.joinedAt
    }));

    return res.status(200).json({
      success: true,
      data: companies,
      count: companies.length
    });
  } catch (error: any) {
    logger.error('Get user companies error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching companies',
      error: error.message
    });
  }
};

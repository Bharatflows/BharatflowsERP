"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserCompanies = exports.switchCompany = exports.refreshToken = exports.googleLogin = exports.resendOTP = exports.verifyOTP = exports.verifyEmail = exports.resetPassword = exports.forgotPassword = exports.updateProfile = exports.getMe = exports.logout = exports.login = exports.register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const google_auth_library_1 = require("google-auth-library");
const prisma_1 = __importDefault(require("../config/prisma"));
const logger_1 = __importDefault(require("../config/logger"));
const auditService_1 = require("../services/auditService");
const financialYearController_1 = require("./financialYearController");
const accountingService_1 = __importDefault(require("../services/accountingService"));
const emailService_1 = require("../services/emailService");
const tokenService_1 = require("../services/tokenService");
const client = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID);
// Generate JWT tokens
const generateTokens = (id) => {
    const accessToken = jsonwebtoken_1.default.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '1h'
    });
    const refreshToken = jsonwebtoken_1.default.sign({ id }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: '7d'
    });
    return { accessToken, refreshToken };
};
// Helper to hash tokens (SHA256) - bcrypt has 72 byte limit, JWTs are longer
const hashToken = (token) => {
    return crypto_1.default.createHash('sha256').update(token).digest('hex');
};
// @desc    Register user & company
// @route   POST /api/v1/auth/register
// @access  Public
const register = async (req, res) => {
    try {
        const { name, email, password, phone, businessName, companyName, gstin, 
        // New business profile fields
        legalType, yearEstablished, employeesCount, primaryCategoryId, industryIds, // Array of IDs
        activityIds, // Array of IDs
        capabilityIds, // Array of IDs
        productNames, // Array of strings (names)
        // P0-4: Business classification (required)
        businessType, city, state, 
        // MSME OS: Sector
        sector } = req.body;
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
            const { SECTOR_BLUEPRINTS } = await Promise.resolve().then(() => __importStar(require('../config/sectorBlueprints')));
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
        const orConditions = [{ email }];
        if (phone) {
            orConditions.push({ phone });
        }
        const userExists = await prisma_1.default.user.findFirst({
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
            const companyExists = await prisma_1.default.company.findUnique({
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
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        // Transaction to create company and user
        const result = await prisma_1.default.$transaction(async (prisma) => {
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
                        connect: industryIds.map((id) => ({ id }))
                    } : undefined,
                    businessActivities: activityIds && activityIds.length > 0 ? {
                        connect: activityIds.map((id) => ({ id }))
                    } : undefined,
                    capabilities: capabilityIds && capabilityIds.length > 0 ? {
                        connect: capabilityIds.map((id) => ({ id }))
                    } : undefined,
                    // For products, we might need to create them if they don't exist
                    businessProducts: productNames && productNames.length > 0 ? {
                        connectOrCreate: productNames.map((pName) => ({
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
                    role: 'OWNER', // P0-1: First user is OWNER
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
            await (0, financialYearController_1.ensureFinancialYearExists)(result.company.id);
            logger_1.default.info(`Financial year created for company: ${result.company.id}`);
        }
        catch (fyError) {
            logger_1.default.warn('Failed to auto-create financial year:', fyError);
        }
        // Auto-create Chart of Accounts (Ledger Groups and System Ledgers)
        try {
            await accountingService_1.default.seedDefaultLedgerGroups(result.company.id);
            logger_1.default.info(`Chart of Accounts created for company: ${result.company.id}`);
        }
        catch (coaError) {
            logger_1.default.warn('Failed to auto-create Chart of Accounts:', coaError);
        }
        // Store refresh token in database
        await prisma_1.default.user.update({
            where: { id: result.user.id },
            data: {
                refreshToken: hashToken(refreshToken),
                refreshTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
        });
        logger_1.default.info(`New user registered: ${email}`);
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
    }
    catch (error) {
        logger_1.default.error('Registration error:', error);
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
exports.register = register;
// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        logger_1.default.info(`Login Request Body: ${JSON.stringify(req.body)}`);
        // logger.info(`Email: ${email}`);
        // logger.info(`Password provided: ${!!password}`);
        // Check for user with company memberships (P0-1)
        const user = await prisma_1.default.user.findFirst({
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
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
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
        await prisma_1.default.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
        });
        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user.id);
        // Store refresh token in database
        await prisma_1.default.user.update({
            where: { id: user.id },
            data: {
                refreshToken: hashToken(refreshToken),
                refreshTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
        });
        // Audit Log
        try {
            if (user.companyId) {
                await auditService_1.AuditService.logChange(user.companyId, user.id, 'USER', user.id, 'LOGIN', null, { method: 'PASSWORD' }, req.ip || 'UNKNOWN', req.headers['user-agent'] || 'UNKNOWN', 'AUTH');
            }
        }
        catch (auditError) {
            // logger.warn('Audit log failed for login', auditError);
            // Continue login even if audit fails
        }
        logger_1.default.info(`User logged in: ${email}`);
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
                    permissions: user.customRole?.permissions || null,
                    customRoleId: user.customRoleId,
                    emailVerified: user.emailVerified,
                    phoneVerified: user.phoneVerified
                },
                company: currentCompany || user.company, // Current active company
                companies, // P0-1: All companies user belongs to
                token: accessToken,
                refreshToken
            }
        });
    }
    catch (error) {
        logger_1.default.error('Login error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error during login',
            error: error.message
        });
    }
};
exports.login = login;
// @desc    Logout user
// @route   POST /api/v1/auth/logout
// @access  Private
const logout = async (req, res) => {
    try {
        // Clear refresh token from DB
        if (req.user) {
            await prisma_1.default.user.update({
                where: { id: req.user.id },
                data: { refreshToken: null, refreshTokenExpiry: null }
            });
            logger_1.default.info(`User logged out: ${req.user.email}`);
        }
        return res.status(200).json({
            success: true,
            message: 'Logout successful'
        });
    }
    catch (error) {
        logger_1.default.error('Logout error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error during logout',
            error: error.message
        });
    }
};
exports.logout = logout;
// @desc    Get current user
// @route   GET /api/v1/auth/me
// @access  Private
const getMe = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }
        const user = await prisma_1.default.user.findUnique({
            where: { id: req.user.id },
            include: {
                company: true,
                customRole: true,
                userCompanies: {
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
                    permissions: user.customRole?.permissions || null
                }
            }
        });
    }
    catch (error) {
        logger_1.default.error('Get user error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching user data',
            error: error.message
        });
    }
};
exports.getMe = getMe;
// @desc    Update user profile
// @route   PUT /api/v1/auth/update-profile
// @access  Private
const updateProfile = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }
        const { name, phone, preferences } = req.body;
        const user = await prisma_1.default.user.update({
            where: { id: req.user.id },
            data: {
                name: name || undefined,
                phone: phone || undefined,
                preferences: preferences || undefined
            }
        });
        logger_1.default.info(`User profile updated: ${user.email}`);
        // Remove password
        const { password, ...userWithoutPassword } = user;
        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: { user: userWithoutPassword }
        });
    }
    catch (error) {
        logger_1.default.error('Update profile error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating profile',
            error: error.message
        });
    }
};
exports.updateProfile = updateProfile;
// @desc    Forgot password
// @route   POST /api/v1/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await prisma_1.default.user.findUnique({ where: { email } });
        if (!user) {
            // Return success even if user not found (security best practice)
            logger_1.default.info(`Password reset requested for non-existent email: ${email}`);
            return res.status(200).json({
                success: true,
                message: 'If an account exists with this email, a password reset link has been sent'
            });
        }
        // Generate reset token
        const resetToken = (0, tokenService_1.generateResetToken)();
        // Store hashed token in database
        await (0, tokenService_1.storeResetToken)(user.id, resetToken);
        // Create reset URL
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        const resetUrl = `${clientUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
        // Send email using emailService
        try {
            await (0, emailService_1.sendEmail)({
                to: email,
                subject: 'Reset Your Password - BharatFlow',
                html: `
                <h1>Reset Your Password</h1>
                <p>You have requested to reset your password.</p>
                <p>Click the link below to reset it:</p>
                <a href="${resetUrl}">${resetUrl}</a>
                <p>This link expires in 1 hour.</p>
                <p>If you did not request this, please ignore this email.</p>
            `
            });
            logger_1.default.info(`Password reset email sent to ${email}`);
        }
        catch (emailError) {
            logger_1.default.error(`Failed to send password reset email to ${email}`, emailError);
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
    }
    catch (error) {
        logger_1.default.error('Forgot password error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error processing password reset',
            error: error.message
        });
    }
};
exports.forgotPassword = forgotPassword;
// @desc    Reset password
// @desc    Reset password
// @route   POST /api/v1/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
    try {
        const { token, password, email } = req.body;
        if (!token || !password || !email) {
            return res.status(400).json({
                success: false,
                message: 'Token, email, and password are required'
            });
        }
        // 1. Verify token
        const verification = await (0, tokenService_1.verifyResetToken)(email, token);
        if (!verification.valid || !verification.userId) {
            return res.status(400).json({
                success: false,
                message: verification.error || 'Invalid or expired reset token'
            });
        }
        // 2. Hash new password
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        // 3. Update user password and clear token
        await prisma_1.default.user.update({
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
    }
    catch (error) {
        logger_1.default.error('Reset password error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error resetting password',
            error: error.message
        });
    }
};
exports.resetPassword = resetPassword;
// @desc    Verify email
// @route   POST /api/v1/auth/verify-email
// @access  Public
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ success: false, message: 'Token is required' });
        }
        // Verify JWT token
        // Note: Using JWT for stateless email verification link
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        if (decoded.type !== 'email_verification' || !decoded.id) {
            return res.status(400).json({ success: false, message: 'Invalid token type' });
        }
        const user = await prisma_1.default.user.findUnique({ where: { id: decoded.id } });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        if (user.emailVerified) {
            return res.status(200).json({ success: true, message: 'Email already verified' });
        }
        await prisma_1.default.user.update({
            where: { id: user.id },
            data: { emailVerified: true }
        });
        return res.status(200).json({
            success: true,
            message: 'Email verified successfully'
        });
    }
    catch (error) {
        logger_1.default.error('Verify email error:', error);
        return res.status(400).json({
            success: false,
            message: 'Invalid or expired verification link',
            error: error.message
        });
    }
};
exports.verifyEmail = verifyEmail;
// @desc    Verify OTP
// @route   POST /api/v1/auth/verify-otp
// @access  Public
const verifyOTP = async (req, res) => {
    try {
        const { phone, otp } = req.body;
        if (!phone || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Phone and OTP are required'
            });
        }
        // Verify OTP
        const { verifyOTPToken } = await Promise.resolve().then(() => __importStar(require('../services/tokenService')));
        const verification = await verifyOTPToken(phone, otp);
        if (!verification.valid || !verification.userId) {
            return res.status(400).json({
                success: false,
                message: verification.error || 'Invalid or expired OTP'
            });
        }
        // Get user and generate token for login
        const user = await prisma_1.default.user.findUnique({
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
        await prisma_1.default.user.update({
            where: { id: user.id },
            data: {
                phoneVerified: true,
                lastLogin: new Date()
            }
        });
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({ id: user.id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN || '7d'
        });
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
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error verifying OTP',
            error: error.message
        });
    }
};
exports.verifyOTP = verifyOTP;
// @desc    Resend OTP / Send OTP
// @route   POST /api/v1/auth/resend-otp
// @access  Public
const resendOTP = async (req, res) => {
    try {
        const { phone } = req.body;
        return res.status(200).json({
            success: true,
            message: 'OTP sent successfully'
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error sending OTP',
            error: error.message
        });
    }
};
exports.resendOTP = resendOTP;
// @desc    Google Login
// @route   POST /api/v1/auth/google
// @access  Public
const googleLogin = async (req, res) => {
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
        let user = await prisma_1.default.user.findUnique({
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
        await prisma_1.default.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
        });
        const { accessToken, refreshToken } = generateTokens(user.id);
        await prisma_1.default.user.update({
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
    }
    catch (error) {
        logger_1.default.error('Google Login error:', error);
        return res.status(500).json({
            success: false,
            message: 'Google login failed',
            error: error.message
        });
    }
};
exports.googleLogin = googleLogin;
// @desc    Refresh Token
// @route   POST /api/v1/auth/refresh
// @access  Public
const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'No refresh token provided'
            });
        }
        // Verify refresh token
        const decoded = jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        // Check if user exists with valid expiry
        // P4: Compare hashed token
        const user = await prisma_1.default.user.findFirst({
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
        await prisma_1.default.user.update({
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
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error refreshing token',
            error: error.message
        });
    }
};
exports.refreshToken = refreshToken;
// @desc    Switch active company
// @route   POST /api/v1/auth/switch-company
// @access  Private
// P0-1: Allow users to switch between companies they belong to
const switchCompany = async (req, res) => {
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
        const membership = await prisma_1.default.userCompany.findFirst({
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
        await prisma_1.default.userCompany.updateMany({
            where: { userId: req.user.id, isDefault: true },
            data: { isDefault: false }
        });
        // Set new default
        await prisma_1.default.userCompany.update({
            where: { id: membership.id },
            data: { isDefault: true }
        });
        logger_1.default.info(`User ${req.user.id} switched to company ${companyId}`);
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
    }
    catch (error) {
        logger_1.default.error('Switch company error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error switching company',
            error: error.message
        });
    }
};
exports.switchCompany = switchCompany;
// @desc    Get user's companies
// @route   GET /api/v1/auth/companies
// @access  Private
const getUserCompanies = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }
        const memberships = await prisma_1.default.userCompany.findMany({
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
    }
    catch (error) {
        logger_1.default.error('Get user companies error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching companies',
            error: error.message
        });
    }
};
exports.getUserCompanies = getUserCompanies;
//# sourceMappingURL=authController.js.map
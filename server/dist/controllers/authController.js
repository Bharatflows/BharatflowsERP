"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleLogin = exports.resendOTP = exports.verifyOTP = exports.verifyEmail = exports.resetPassword = exports.forgotPassword = exports.updateProfile = exports.getMe = exports.logout = exports.login = exports.register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const google_auth_library_1 = require("google-auth-library");
const prisma_1 = __importDefault(require("../config/prisma"));
const logger_1 = __importDefault(require("../config/logger"));
const client = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID);
// Generate JWT token
const generateToken = (id) => {
    return jsonwebtoken_1.default.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
};
// @desc    Register user & company
// @route   POST /api/v1/auth/register
// @access  Public
const register = async (req, res) => {
    try {
        const { name, email, password, phone, businessName, companyName, gstin } = req.body;
        // Handle businessName/companyName mismatch
        const finalBusinessName = businessName || companyName;
        if (!finalBusinessName) {
            return res.status(400).json({
                success: false,
                message: 'Business name is required'
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
            // Create company
            const company = await prisma.company.create({
                data: {
                    businessName: finalBusinessName,
                    gstin: gstin || undefined,
                    address: {
                        country: 'India'
                    },
                    phone: phone || undefined,
                    email
                }
            });
            // Create user
            const user = await prisma.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    phone: phone || undefined,
                    role: 'ADMIN',
                    companyId: company.id
                }
            });
            return { user, company };
        });
        // Generate token
        const token = generateToken(result.user.id);
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
                token
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
            message: 'Error during registration',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
        logger_1.default.info(`Email: ${email}`);
        logger_1.default.info(`Password provided: ${!!password}`);
        // Check for user
        const user = await prisma_1.default.user.findFirst({
            where: {
                OR: [
                    { email: email },
                    { phone: email }
                ]
            },
            include: { company: true }
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
        // Generate token
        const token = generateToken(user.id);
        logger_1.default.info(`User logged in: ${email}`);
        return res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    emailVerified: user.emailVerified,
                    phoneVerified: user.phoneVerified
                },
                company: user.company,
                token
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
        logger_1.default.info(`User logged out: ${req.user.email}`);
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
        const user = await prisma_1.default.user.findUnique({
            where: { id: req.user.id },
            include: { company: true }
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
            data: { user: userWithoutPassword }
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
        const { name, phone } = req.body;
        const user = await prisma_1.default.user.update({
            where: { id: req.user.id },
            data: {
                name: name || undefined,
                phone: phone || undefined
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
            return res.status(404).json({
                success: false,
                message: 'User not found with this email'
            });
        }
        // TODO: Generate reset token and send email
        // For now, just return success
        logger_1.default.info(`Password reset requested: ${email}`);
        return res.status(200).json({
            success: true,
            message: 'Password reset link sent to email'
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
// @route   POST /api/v1/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;
        // TODO: Verify reset token and update password
        return res.status(200).json({
            success: true,
            message: 'Password reset successful'
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
        // TODO: Verify email token and update user
        return res.status(200).json({
            success: true,
            message: 'Email verified successfully'
        });
    }
    catch (error) {
        logger_1.default.error('Verify email error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error verifying email',
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
        // TODO: Verify OTP
        return res.status(200).json({
            success: true,
            message: 'OTP verified successfully'
        });
    }
    catch (error) {
        logger_1.default.error('Verify OTP error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error verifying OTP',
            error: error.message
        });
    }
};
exports.verifyOTP = verifyOTP;
// @desc    Resend OTP
// @route   POST /api/v1/auth/resend-otp
// @access  Public
const resendOTP = async (req, res) => {
    try {
        const { phone } = req.body;
        // TODO: Send new OTP
        return res.status(200).json({
            success: true,
            message: 'OTP sent successfully'
        });
    }
    catch (error) {
        logger_1.default.error('Resend OTP error:', error);
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
        const { token } = req.body;
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Google token'
            });
        }
        const { email, name, picture } = payload;
        // Check if user exists
        let user = await prisma_1.default.user.findUnique({
            where: { email },
            include: { company: true }
        });
        if (!user) {
            // Create new user and company
            const result = await prisma_1.default.$transaction(async (prisma) => {
                // Create default company
                const company = await prisma.company.create({
                    data: {
                        businessName: `${name}'s Company`,
                        email,
                        address: { country: 'India' }
                    }
                });
                // Create user
                const newUser = await prisma.user.create({
                    data: {
                        name: name || 'User',
                        email,
                        password: await bcryptjs_1.default.hash(Math.random().toString(36), 10), // Random password
                        role: 'ADMIN',
                        companyId: company.id,
                        emailVerified: true,
                        status: 'ACTIVE'
                    }
                });
                return { user: newUser, company };
            });
            user = { ...result.user, company: result.company };
        }
        // Generate token
        const jwtToken = generateToken(user.id);
        logger_1.default.info(`User logged in via Google: ${email}`);
        return res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    emailVerified: user.emailVerified,
                    phoneVerified: user.phoneVerified
                },
                company: user.company,
                token: jwtToken
            }
        });
    }
    catch (error) {
        logger_1.default.error('Google login error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error during Google login',
            error: error.message
        });
    }
};
exports.googleLogin = googleLogin;
//# sourceMappingURL=authController.js.map
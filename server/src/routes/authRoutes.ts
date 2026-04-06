import express from 'express';
import {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  forgotPassword,
  resetPassword,
  verifyEmail,
  verifyOTP,
  resendOTP,
  googleLogin,
  refreshToken,
  switchCompany,      // P0-1: Switch company
  getUserCompanies    // P0-1: Get user's companies
} from '../controllers/authController';
import { protect } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimiter';
import { registerValidation, loginValidation } from '../middleware/validator';

const router = express.Router();

// Public routes
router.post('/register', authRateLimiter, registerValidation, register);
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post('/login', authRateLimiter, loginValidation, login);
router.post('/refresh', refreshToken);
router.post('/forgot-password', authRateLimiter, forgotPassword);
router.post('/reset-password', authRateLimiter, resetPassword);
router.post('/verify-email', verifyEmail);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/google', googleLogin);

// Protected routes
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/update-profile', protect, updateProfile);

// P0-1: Multi-company support
router.get('/companies', protect, getUserCompanies);
router.post('/switch-company', protect, switchCompany);

// Two-Factor Authentication (2FA)
import * as twoFactorController from '../controllers/auth/twoFactorController';
router.get('/2fa/status', protect, twoFactorController.get2FAStatus);
router.post('/2fa/setup', protect, twoFactorController.setup2FA);
router.post('/2fa/verify-setup', protect, twoFactorController.verifySetup);
router.post('/2fa/verify', twoFactorController.verify2FA);
router.post('/2fa/disable', protect, twoFactorController.disable2FA);
router.post('/2fa/backup-codes', protect, twoFactorController.generateBackupCodes);

export default router;


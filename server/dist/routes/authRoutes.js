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
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const rateLimiter_1 = require("../middleware/rateLimiter");
const validator_1 = require("../middleware/validator");
const router = express_1.default.Router();
// Public routes
router.post('/register', rateLimiter_1.authRateLimiter, validator_1.registerValidation, authController_1.register);
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
router.post('/login', rateLimiter_1.authRateLimiter, validator_1.loginValidation, authController_1.login);
router.post('/refresh', authController_1.refreshToken);
router.post('/forgot-password', rateLimiter_1.authRateLimiter, authController_1.forgotPassword);
router.post('/reset-password', rateLimiter_1.authRateLimiter, authController_1.resetPassword);
router.post('/verify-email', authController_1.verifyEmail);
router.post('/verify-otp', authController_1.verifyOTP);
router.post('/resend-otp', authController_1.resendOTP);
router.post('/google', authController_1.googleLogin);
// Protected routes
router.post('/logout', auth_1.protect, authController_1.logout);
router.get('/me', auth_1.protect, authController_1.getMe);
router.put('/update-profile', auth_1.protect, authController_1.updateProfile);
// P0-1: Multi-company support
router.get('/companies', auth_1.protect, authController_1.getUserCompanies);
router.post('/switch-company', auth_1.protect, authController_1.switchCompany);
// Two-Factor Authentication (2FA)
const twoFactorController = __importStar(require("../controllers/auth/twoFactorController"));
router.get('/2fa/status', auth_1.protect, twoFactorController.get2FAStatus);
router.post('/2fa/setup', auth_1.protect, twoFactorController.setup2FA);
router.post('/2fa/verify-setup', auth_1.protect, twoFactorController.verifySetup);
router.post('/2fa/verify', twoFactorController.verify2FA);
router.post('/2fa/disable', auth_1.protect, twoFactorController.disable2FA);
router.post('/2fa/backup-codes', auth_1.protect, twoFactorController.generateBackupCodes);
exports.default = router;
//# sourceMappingURL=authRoutes.js.map
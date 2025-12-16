"use strict";
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
router.post('/login', rateLimiter_1.authRateLimiter, validator_1.loginValidation, authController_1.login);
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
exports.default = router;
//# sourceMappingURL=authRoutes.js.map
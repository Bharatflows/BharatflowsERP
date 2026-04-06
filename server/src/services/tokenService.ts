import crypto from 'crypto';
import prisma from '../config/prisma';

// Token expiry times
const PASSWORD_RESET_EXPIRY_HOURS = 1;
const OTP_EXPIRY_MINUTES = 10;

/**
 * Generate a secure random token for password reset
 */
export const generateResetToken = (): string => {
    return crypto.randomBytes(32).toString('hex');
};

/**
 * Generate a 6-digit OTP
 */
export const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Hash a token for secure storage
 */
export const hashToken = (token: string): string => {
    return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Store password reset token for a user
 */
export const storeResetToken = async (userId: string, token: string): Promise<void> => {
    const hashedToken = hashToken(token);
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRY_HOURS * 60 * 60 * 1000);

    await prisma.user.update({
        where: { id: userId },
        data: {
            resetToken: hashedToken,
            resetTokenExpiry: expiresAt
        }
    });
};

/**
 * Verify password reset token
 */
export const verifyResetToken = async (email: string, token: string): Promise<{ valid: boolean; userId?: string; error?: string }> => {
    const hashedToken = hashToken(token);

    const user = await prisma.user.findFirst({
        where: {
            email,
            resetToken: hashedToken,
            resetTokenExpiry: {
                gt: new Date()
            }
        }
    });

    if (!user) {
        return { valid: false, error: 'Invalid or expired reset token' };
    }

    return { valid: true, userId: user.id };
};

/**
 * Clear reset token after use
 */
export const clearResetToken = async (userId: string): Promise<void> => {
    await prisma.user.update({
        where: { id: userId },
        data: {
            resetToken: null,
            resetTokenExpiry: null
        }
    });
};

/**
 * Store OTP for phone verification
 */
export const storeOTP = async (phone: string, otp: string): Promise<void> => {
    const hashedOTP = hashToken(otp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Find user by phone and store OTP
    // Note: Using a simple approach - in production you might want a separate OTP table
    const user = await prisma.user.findFirst({
        where: { phone }
    });

    if (user) {
        await prisma.user.update({
            where: { id: user.id },
            data: {
                otp: hashedOTP,
                otpExpiry: expiresAt
            }
        });
    }
};

/**
 * Verify OTP
 */
export const verifyOTPToken = async (phone: string, otp: string): Promise<{ valid: boolean; userId?: string; error?: string }> => {
    const hashedOTP = hashToken(otp);

    const user = await prisma.user.findFirst({
        where: {
            phone,
            otp: hashedOTP,
            otpExpiry: {
                gt: new Date()
            }
        }
    });

    if (!user) {
        return { valid: false, error: 'Invalid or expired OTP' };
    }

    // Clear OTP after successful verification
    await prisma.user.update({
        where: { id: user.id },
        data: {
            otp: null,
            otpExpiry: null
        }
    });

    return { valid: true, userId: user.id };
};

export default {
    generateResetToken,
    generateOTP,
    hashToken,
    storeResetToken,
    verifyResetToken,
    clearResetToken,
    storeOTP,
    verifyOTPToken
};

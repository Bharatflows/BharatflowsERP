/**
 * Two-Factor Authentication Controller
 * Handles 2FA setup, verification, and management
 */

import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import prisma from '../../config/prisma';
import { Prisma } from '@prisma/client';
import logger from '../../config/logger';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import crypto from 'crypto';

/**
 * @desc    Generate 2FA setup data (secret and QR code)
 * @route   POST /api/v1/auth/2fa/setup
 * @access  Private
 */
export const setup2FA = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, twoFactorEnabled: true, name: true }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.twoFactorEnabled) {
            return res.status(400).json({
                success: false,
                message: '2FA is already enabled. Disable it first to reconfigure.'
            });
        }

        // Generate secret
        const secret = speakeasy.generateSecret({
            name: `MSMEAntigravity (${user.email})`,
            length: 32
        });

        // Generate QR code
        const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

        // Store secret temporarily (will be confirmed on verify)
        await prisma.user.update({
            where: { id: userId },
            data: { twoFactorSecret: secret.base32 }
        });

        return res.json({
            success: true,
            data: {
                secret: secret.base32,
                qrCode: qrCodeUrl,
                manualEntryKey: secret.base32
            },
            message: 'Scan the QR code with your authenticator app, then verify the code'
        });
    } catch (error: any) {
        logger.error('2FA setup error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to setup 2FA',
            error: error.message
        });
    }
};

/**
 * @desc    Verify 2FA code and enable 2FA
 * @route   POST /api/v1/auth/2fa/verify-setup
 * @access  Private
 */
export const verifySetup = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const { code } = req.body;

        if (!code || code.length !== 6) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid 6-digit code'
            });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { twoFactorSecret: true, twoFactorEnabled: true }
        });

        if (!user || !user.twoFactorSecret) {
            return res.status(400).json({
                success: false,
                message: 'Please initiate 2FA setup first'
            });
        }

        // Verify the code
        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: code,
            window: 1 // Allow 1 step window for time drift
        });

        if (!verified) {
            return res.status(400).json({
                success: false,
                message: 'Invalid verification code. Please try again.'
            });
        }

        // Generate backup codes
        const backupCodes = Array.from({ length: 10 }, () =>
            crypto.randomBytes(4).toString('hex').toUpperCase()
        );

        // Enable 2FA - Store backup codes as JSON string for SQLite
        await prisma.user.update({
            where: { id: userId },
            data: {
                twoFactorEnabled: true,
                twoFactorBackup: JSON.stringify(backupCodes),
                twoFactorMethod: 'TOTP'
            }
        });

        logger.info(`2FA enabled for user ${userId}`);

        return res.json({
            success: true,
            data: {
                backupCodes
            },
            message: '2FA has been enabled successfully. Save your backup codes securely.'
        });
    } catch (error: any) {
        logger.error('2FA verify setup error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to verify 2FA setup',
            error: error.message
        });
    }
};

/**
 * @desc    Verify 2FA code during login
 * @route   POST /api/v1/auth/2fa/verify
 * @access  Public (with temporary token)
 */
export const verify2FA = async (req: AuthRequest, res: Response) => {
    try {
        const { userId, code, isBackupCode } = req.body;

        if (!userId || !code) {
            return res.status(400).json({
                success: false,
                message: 'User ID and code are required'
            });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                twoFactorSecret: true,
                twoFactorEnabled: true,
                twoFactorBackup: true
            }
        });

        if (!user || !user.twoFactorEnabled) {
            return res.status(400).json({
                success: false,
                message: '2FA is not enabled for this user'
            });
        }

        let verified = false;

        if (isBackupCode) {
            // Check backup codes - parse JSON string for SQLite
            const backupCodes: string[] = user.twoFactorBackup
                ? JSON.parse(user.twoFactorBackup as string)
                : [];
            const codeIndex = backupCodes.indexOf(code.toUpperCase());

            if (codeIndex !== -1) {
                // Remove used backup code
                backupCodes.splice(codeIndex, 1);
                await prisma.user.update({
                    where: { id: userId },
                    data: { twoFactorBackup: JSON.stringify(backupCodes) }
                });
                verified = true;
                logger.info(`Backup code used for user ${userId}, ${backupCodes.length} remaining`);
            }
        } else {
            // Verify TOTP code
            verified = speakeasy.totp.verify({
                secret: user.twoFactorSecret!,
                encoding: 'base32',
                token: code,
                window: 1
            });
        }

        if (!verified) {
            return res.status(400).json({
                success: false,
                message: 'Invalid verification code'
            });
        }

        return res.json({
            success: true,
            message: '2FA verification successful'
        });
    } catch (error: any) {
        logger.error('2FA verify error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to verify 2FA code',
            error: error.message
        });
    }
};

/**
 * @desc    Disable 2FA
 * @route   POST /api/v1/auth/2fa/disable
 * @access  Private
 */
export const disable2FA = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const { password, code } = req.body;

        if (!password) {
            return res.status(400).json({
                success: false,
                message: 'Password is required to disable 2FA'
            });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                password: true,
                twoFactorEnabled: true,
                twoFactorSecret: true
            }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (!user.twoFactorEnabled) {
            return res.status(400).json({
                success: false,
                message: '2FA is not enabled'
            });
        }

        // Verify password
        const bcrypt = require('bcryptjs');
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Incorrect password'
            });
        }

        // Verify 2FA code if provided
        if (code && user.twoFactorSecret) {
            const verified = speakeasy.totp.verify({
                secret: user.twoFactorSecret,
                encoding: 'base32',
                token: code,
                window: 1
            });

            if (!verified) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid 2FA code'
                });
            }
        }

        // Disable 2FA
        await prisma.user.update({
            where: { id: userId },
            data: {
                twoFactorEnabled: false,
                twoFactorSecret: null,
                twoFactorBackup: null,
                twoFactorMethod: null
            }
        });

        logger.info(`2FA disabled for user ${userId}`);

        return res.json({
            success: true,
            message: '2FA has been disabled'
        });
    } catch (error: any) {
        logger.error('2FA disable error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to disable 2FA',
            error: error.message
        });
    }
};

/**
 * @desc    Get 2FA status
 * @route   GET /api/v1/auth/2fa/status
 * @access  Private
 */
export const get2FAStatus = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                twoFactorEnabled: true,
                twoFactorMethod: true,
                twoFactorBackup: true
            }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const backupCodesRemaining = user.twoFactorBackup
            ? JSON.parse(user.twoFactorBackup as string).length
            : 0;

        return res.json({
            success: true,
            data: {
                enabled: user.twoFactorEnabled,
                method: user.twoFactorMethod,
                backupCodesRemaining
            }
        });
    } catch (error: any) {
        logger.error('2FA status error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get 2FA status',
            error: error.message
        });
    }
};

/**
 * @desc    Generate new backup codes
 * @route   POST /api/v1/auth/2fa/backup-codes
 * @access  Private
 */
export const generateBackupCodes = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({
                success: false,
                message: 'Password is required'
            });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                password: true,
                twoFactorEnabled: true
            }
        });

        if (!user || !user.twoFactorEnabled) {
            return res.status(400).json({
                success: false,
                message: '2FA must be enabled to generate backup codes'
            });
        }

        // Verify password
        const bcrypt = require('bcryptjs');
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Incorrect password'
            });
        }

        // Generate new backup codes
        const backupCodes = Array.from({ length: 10 }, () =>
            crypto.randomBytes(4).toString('hex').toUpperCase()
        );

        await prisma.user.update({
            where: { id: userId },
            data: { twoFactorBackup: JSON.stringify(backupCodes) }
        });

        logger.info(`New backup codes generated for user ${userId}`);

        return res.json({
            success: true,
            data: { backupCodes },
            message: 'New backup codes generated. Previous codes are now invalid.'
        });
    } catch (error: any) {
        logger.error('Generate backup codes error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to generate backup codes',
            error: error.message
        });
    }
};

export default {
    setup2FA,
    verifySetup,
    verify2FA,
    disable2FA,
    get2FAStatus,
    generateBackupCodes
};

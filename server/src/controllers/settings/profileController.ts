import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import prisma from '../../config/prisma';
import logger from '../../config/logger';
import { eventBus, EventTypes } from '../../services/eventBus';
import {
    ProfileUpdateSchema,
    PreferencesSchema,
    NotificationSettingsSchema,
    PasswordChangeSchema,
    validateSettings
} from '../../validators/settingsValidation';
import bcrypt from 'bcryptjs';

// @desc    Get current user profile
// @route   GET /api/v1/settings/profile
// @access  Private
export const getProfile = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                company: {
                    select: {
                        id: true,
                        businessName: true,
                        email: true,
                        phone: true,
                        gstin: true,
                        plan: true
                    }
                },
                customRole: {
                    select: {
                        id: true,
                        name: true,
                        permissions: true
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

        // Default preferences with full fields
        const defaultPreferences = {
            theme: 'Light',
            language: 'English',
            timezone: 'Asia/Kolkata',
            dateFormat: 'DD/MM/YYYY',
            numberFormat: 'Indian',
            currency: 'INR'
        };

        // Default notification settings with all fields
        const defaultNotificationSettings = {
            emailInvoice: true,
            emailPayment: true,
            emailLowStock: true,
            emailGST: false,
            emailExpenseApproval: true,
            mobileInvoice: true,
            mobilePayment: true,
            mobileLowStock: false,
            whatsappInvoice: false,
            whatsappPayment: false,
            inAppEnabled: true,
            inAppSound: true
        };

        // Format response with full profile data
        const profileData = {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            roleName: user.role === 'OWNER'
                ? 'Owner'
                : user.role === 'ADMIN'
                    ? 'Admin'
                    : (user.customRole?.name || 'Staff'),
            designation: user.designation,
            avatar: user.avatar,
            bio: user.bio,
            signature: user.signature,
            emailVerified: user.emailVerified,
            phoneVerified: user.phoneVerified,
            status: user.status,
            lastLogin: user.lastLogin,
            lastActive: user.lastActive,
            createdAt: user.createdAt,

            // Merge defaults with saved preferences
            preferences: {
                ...defaultPreferences,
                ...(user.preferences as unknown as object || {})
            },

            // Merge defaults with saved notification settings
            notificationSettings: {
                ...defaultNotificationSettings,
                ...(user.notificationSettings as unknown as object || {})
            },

            // Company info
            company: user.company ? {
                id: user.company.id,
                businessName: user.company.businessName,
                email: user.company.email,
                phone: user.company.phone,
                gstin: user.company.gstin,
                plan: user.company.plan
            } : null,

            // Custom role info
            customRole: user.customRole ? {
                id: user.customRole.id,
                name: user.customRole.name,
                permissions: user.customRole.permissions
            } : null
        };

        return res.json({
            success: true,
            data: profileData
        });
    } catch (error: any) {
        logger.error('Get profile error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching profile',
            error: error.message
        });
    }
};

// @desc    Update user profile
// @route   PUT /api/v1/settings/profile
// @access  Private
export const updateProfile = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const companyId = req.user!.companyId;

        const {
            name,
            phone,
            designation,
            bio,
            preferences,
            notificationSettings,
            avatar,
            signature
        } = req.body;

        // Validate profile fields
        const profileValidation = validateSettings(ProfileUpdateSchema, {
            name,
            phone,
            designation,
            bio,
            avatar,
            signature
        });

        if (!profileValidation.success) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: profileValidation.errors
            });
        }

        // Validate preferences if provided
        if (preferences) {
            const prefValidation = validateSettings(PreferencesSchema, preferences);
            if (!prefValidation.success) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid preferences',
                    errors: prefValidation.errors
                });
            }
        }

        // Validate notification settings if provided
        if (notificationSettings) {
            const notifValidation = validateSettings(NotificationSettingsSchema, notificationSettings);
            if (!notifValidation.success) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid notification settings',
                    errors: notifValidation.errors
                });
            }
        }

        // Check for phone uniqueness if changed
        if (phone) {
            const existingUser = await prisma.user.findFirst({
                where: {
                    phone,
                    id: { not: userId }
                }
            });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Phone number already in use',
                    errors: { phone: 'This phone number is already registered' }
                });
            }
        }

        // Get current user for audit comparison
        const currentUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true, phone: true, designation: true, bio: true }
        });

        // Build update data (only include fields that are provided)
        const updateData: Record<string, any> = {};
        if (name !== undefined) updateData.name = name;
        if (phone !== undefined) updateData.phone = phone;
        if (designation !== undefined) updateData.designation = designation;
        if (bio !== undefined) updateData.bio = bio;
        if (avatar !== undefined) updateData.avatar = avatar;
        if (signature !== undefined) updateData.signature = signature;
        if (preferences !== undefined) updateData.preferences = preferences;
        if (notificationSettings !== undefined) updateData.notificationSettings = notificationSettings;

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                designation: true,
                bio: true,
                avatar: true,
                signature: true,
                preferences: true,
                notificationSettings: true,
                updatedAt: true
            }
        });

        // Emit audit event for profile update
        if (companyId) {
            await eventBus.emit({
                companyId,
                eventType: EventTypes.USER_UPDATED,
                aggregateType: 'User',
                aggregateId: userId,
                payload: {
                    type: 'PROFILE_UPDATED',
                    changes: {
                        before: currentUser as any,
                        after: { name, phone, designation, bio }
                    }
                },
                metadata: {
                    userId,
                    source: 'api'
                }
            });
        }

        logger.info(`Profile updated for user ${userId}`);

        return res.json({
            success: true,
            message: 'Profile updated successfully',
            data: updatedUser
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

// @desc    Change user password
// @route   PUT /api/v1/settings/profile/password
// @access  Private
export const changePassword = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const companyId = req.user!.companyId;
        const { currentPassword, newPassword, confirmPassword } = req.body;

        // Validate password fields
        const validation = validateSettings(PasswordChangeSchema, {
            currentPassword,
            newPassword,
            confirmPassword
        });

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validation.errors
            });
        }

        // Get user with password
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { password: true }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect',
                errors: { currentPassword: 'Incorrect password' }
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        });

        // Emit audit event
        // Emit audit event
        if (companyId) {
            await eventBus.emit({
                companyId,
                eventType: EventTypes.USER_UPDATED,
                aggregateType: 'User',
                aggregateId: userId,
                payload: {
                    type: 'PASSWORD_CHANGED',
                },
                metadata: {
                    userId,
                    source: 'api'
                }
            });
        }

        logger.info(`Password changed for user ${userId}`);

        return res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error: any) {
        logger.error('Change password error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error changing password',
            error: error.message
        });
    }
};

// @desc    Update user preferences only
// @route   PUT /api/v1/settings/profile/preferences
// @access  Private
export const updatePreferences = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const { preferences } = req.body;

        // Validate preferences
        const validation = validateSettings(PreferencesSchema, preferences);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid preferences',
                errors: validation.errors
            });
        }

        // Get current preferences
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { preferences: true }
        });

        // Merge with existing preferences
        const mergedPreferences = {
            ...(user?.preferences as unknown as object || {}),
            ...preferences
        };

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { preferences: mergedPreferences },
            select: { preferences: true }
        });

        logger.info(`Preferences updated for user ${userId}`);

        return res.json({
            success: true,
            message: 'Preferences updated successfully',
            data: { preferences: updatedUser.preferences }
        });

    } catch (error: any) {
        logger.error('Update preferences error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating preferences',
            error: error.message
        });
    }
};

// @desc    Update notification settings only
// @route   PUT /api/v1/settings/profile/notifications
// @access  Private
export const updateNotificationSettings = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const { notificationSettings } = req.body;

        // Validate notification settings
        const validation = validateSettings(NotificationSettingsSchema, notificationSettings);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid notification settings',
                errors: validation.errors
            });
        }

        // Get current notification settings
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { notificationSettings: true }
        });

        // Merge with existing settings
        const mergedSettings = {
            ...(user?.notificationSettings as unknown as object || {}),
            ...notificationSettings
        };

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { notificationSettings: mergedSettings },
            select: { notificationSettings: true }
        });

        logger.info(`Notification settings updated for user ${userId}`);

        return res.json({
            success: true,
            message: 'Notification settings updated successfully',
            data: { notificationSettings: updatedUser.notificationSettings }
        });

    } catch (error: any) {
        logger.error('Update notification settings error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating notification settings',
            error: error.message
        });
    }
};

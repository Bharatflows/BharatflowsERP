import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import prisma from '../../config/prisma';
import logger from '../../config/logger';
import bcrypt from 'bcryptjs';
import { eventBus } from '../../services/eventBus';
import {
    UserInviteSchema,
    UserUpdateSchema,
    validateSettings
} from '../../validators/settingsValidation';

// Role hierarchy: OWNER > ADMIN > STAFF
const ROLE_HIERARCHY: Record<string, number> = {
    OWNER: 3,
    ADMIN: 2,
    MANAGER: 1,
    ACCOUNTANT: 1,
    STAFF: 0,
    USER: 0,
};

/**
 * Check if requesting user can modify target user's role
 */
function canModifyUserRole(requestingUserRole: string, targetUserRole: string): boolean {
    const requestingLevel = ROLE_HIERARCHY[requestingUserRole] ?? 0;
    const targetLevel = ROLE_HIERARCHY[targetUserRole] ?? 0;
    return requestingLevel > targetLevel;
}

// @desc    Get all users for company with their roles
// @route   GET /api/v1/settings/users
// @access  Private
export const getUsers = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const requestingUserId = req.user!.id;

        const users = await prisma.user.findMany({
            where: { companyId },
            include: {
                customRole: {
                    select: { id: true, name: true, permissions: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Transform to match frontend interface
        const formattedUsers = users.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            role: user.role,
            roleName: user.role === 'OWNER'
                ? 'Owner'
                : user.role === 'ADMIN'
                    ? 'Admin'
                    : (user.customRole?.name || 'Staff'),
            status: user.status.toLowerCase(),
            statusLabel: user.status === 'ACTIVE' ? 'Active' : 'Inactive',
            lastLogin: user.lastLogin,
            lastLoginFormatted: user.lastLogin
                ? new Date(user.lastLogin).toLocaleString()
                : 'Never',
            lastActive: user.lastActive,
            emailVerified: user.emailVerified,
            phoneVerified: user.phoneVerified,
            createdAt: user.createdAt,
            customRoleId: user.customRoleId,
            customRole: user.customRole,
            isCurrentUser: user.id === requestingUserId,
            canEdit: canModifyUserRole(req.user!.role, user.role) || user.id === requestingUserId,
            canDelete: canModifyUserRole(req.user!.role, user.role) && user.id !== requestingUserId,
        }));

        return res.json({
            success: true,
            data: formattedUsers
        });
    } catch (error: any) {
        logger.error('Get users error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error.message
        });
    }
};

// @desc    Invite/Add new user
// @route   POST /api/v1/settings/users
// @access  Private (Admin)
export const inviteUser = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const requestingUserId = req.user!.id;
        const requestingUserRole = req.user!.role;

        // Validate input
        const validation = validateSettings(UserInviteSchema, req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validation.errors
            });
        }

        const { name, email, phone, role, customRoleId, branchIds } = req.body;

        // Permission check: Only ADMIN+ can invite users
        if (requestingUserRole !== 'OWNER' && requestingUserRole !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to invite users'
            });
        }

        // Prevent non-owners from creating admins
        if (role === 'ADMIN' && requestingUserRole !== 'OWNER') {
            return res.status(403).json({
                success: false,
                message: 'Only owners can create admin users'
            });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists',
                errors: { email: 'This email is already registered' }
            });
        }

        // Check phone uniqueness if provided
        if (phone) {
            const existingPhone = await prisma.user.findFirst({
                where: { phone }
            });
            if (existingPhone) {
                return res.status(400).json({
                    success: false,
                    message: 'Phone number already in use',
                    errors: { phone: 'This phone number is already registered' }
                });
            }
        }

        // Determine Role
        let systemRole: 'OWNER' | 'ADMIN' | 'STAFF' = 'STAFF';
        let resolvedCustomRoleId: string | null = null;

        if (role === 'ADMIN') {
            systemRole = 'ADMIN';
        } else if (customRoleId) {
            // Verify custom role exists for this company
            const customRole = await prisma.customRole.findFirst({
                where: { id: customRoleId, companyId }
            });
            if (!customRole) {
                return res.status(400).json({
                    success: false,
                    message: 'Custom role not found',
                    errors: { customRoleId: 'Selected role does not exist' }
                });
            }
            resolvedCustomRoleId = customRole.id;
        }

        // Generate temporary password (in production, use email invite flow)
        const tempPassword = Math.random().toString(36).slice(-10);
        const hashedPassword = await bcrypt.hash(
            req.body.password || tempPassword,
            12
        );

        const newUser = await prisma.user.create({
            data: {
                companyId,
                name,
                email,
                phone,
                password: hashedPassword,
                role: systemRole,
                customRoleId: resolvedCustomRoleId,
                status: 'ACTIVE'
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                status: true,
                createdAt: true,
                customRole: {
                    select: { name: true }
                }
            }
        });

        // Emit audit event
        eventBus.emit({
            eventType: 'SETTINGS_CHANGED',
            aggregateType: 'User',
            aggregateId: newUser.id,
            companyId,
            payload: {
                type: 'USER_INVITED',
                invitedUserId: newUser.id,
                invitedEmail: email,
                role: systemRole
            },
            metadata: {
                userId: requestingUserId,
                source: 'api'
            }
        });

        logger.info(`User ${email} invited by ${requestingUserId}`);

        return res.status(201).json({
            success: true,
            message: 'User added successfully',
            data: {
                ...newUser,
                roleName: newUser.role === 'ADMIN'
                    ? 'Admin'
                    : (newUser.customRole?.name || 'Staff'),
                temporaryPassword: req.body.password ? undefined : tempPassword
            }
        });

    } catch (error: any) {
        logger.error('Invite user error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error adding user',
            error: error.message
        });
    }
};

// @desc    Update user (role/status)
// @route   PUT /api/v1/settings/users/:id
// @access  Private (Admin)
export const updateUser = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const requestingUserId = req.user!.id;
        const requestingUserRole = req.user!.role;
        const { id } = req.params;

        // Validate input
        const validation = validateSettings(UserUpdateSchema, req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validation.errors
            });
        }

        const { role, status, name, phone, customRoleId } = req.body;

        const targetUser = await prisma.user.findUnique({
            where: { id }
        });

        if (!targetUser || targetUser.companyId !== companyId) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Protect owner accounts
        if (targetUser.role === 'OWNER' && requestingUserRole !== 'OWNER') {
            return res.status(403).json({
                success: false,
                message: 'Cannot modify owner account'
            });
        }

        // Prevent self-demotion for owners
        if (targetUser.id === requestingUserId && role && role !== targetUser.role) {
            if (targetUser.role === 'OWNER') {
                return res.status(403).json({
                    success: false,
                    message: 'Owners cannot change their own role'
                });
            }
        }

        // Prevent non-owners from creating admins
        if (role === 'ADMIN' && requestingUserRole !== 'OWNER') {
            return res.status(403).json({
                success: false,
                message: 'Only owners can assign admin role'
            });
        }

        // Build update data
        const updateData: Record<string, any> = {};

        if (name !== undefined) updateData.name = name;
        if (phone !== undefined) updateData.phone = phone;

        if (status) {
            updateData.status = status.toUpperCase();
        }

        if (role) {
            if (role === 'ADMIN') {
                updateData.role = 'ADMIN';
                updateData.customRoleId = null;
            } else if (customRoleId) {
                const customRole = await prisma.customRole.findFirst({
                    where: { id: customRoleId, companyId }
                });
                if (customRole) {
                    updateData.role = 'STAFF';
                    updateData.customRoleId = customRole.id;
                }
            } else {
                updateData.role = 'STAFF';
                updateData.customRoleId = null;
            }
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                status: true,
                customRole: {
                    select: { name: true }
                }
            }
        });

        // Emit audit event
        eventBus.emit({
            eventType: 'SETTINGS_CHANGED',
            aggregateType: 'User',
            aggregateId: id,
            companyId,
            payload: {
                type: 'USER_UPDATED',
                targetUserId: id,
                changes: updateData
            },
            metadata: {
                userId: requestingUserId,
                source: 'api'
            }
        });

        logger.info(`User ${id} updated by ${requestingUserId}`);

        return res.json({
            success: true,
            message: 'User updated successfully',
            data: {
                ...updatedUser,
                roleName: updatedUser.role === 'ADMIN'
                    ? 'Admin'
                    : (updatedUser.customRole?.name || 'Staff')
            }
        });

    } catch (error: any) {
        logger.error('Update user error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating user',
            error: error.message
        });
    }
};

// @desc    Delete user
// @route   DELETE /api/v1/settings/users/:id
// @access  Private (Admin)
export const deleteUser = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const requestingUserId = req.user!.id;
        const requestingUserRole = req.user!.role;
        const { id } = req.params;

        // Prevent self-deletion
        if (id === requestingUserId) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete yourself'
            });
        }

        const targetUser = await prisma.user.findUnique({
            where: { id }
        });

        if (!targetUser || targetUser.companyId !== companyId) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Protect owner accounts
        if (targetUser.role === 'OWNER') {
            return res.status(403).json({
                success: false,
                message: 'Cannot delete owner account'
            });
        }

        // Permission check
        if (!canModifyUserRole(requestingUserRole, targetUser.role)) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to delete this user'
            });
        }

        await prisma.user.delete({
            where: { id }
        });

        // Emit audit event
        eventBus.emit({
            eventType: 'SETTINGS_CHANGED',
            aggregateType: 'User',
            aggregateId: id,
            companyId,
            payload: {
                type: 'USER_DELETED',
                deletedUserId: id,
                deletedEmail: targetUser.email
            },
            metadata: {
                userId: requestingUserId,
                source: 'api'
            }
        });

        logger.info(`User ${id} deleted by ${requestingUserId}`);

        return res.json({
            success: true,
            message: 'User deleted successfully'
        });

    } catch (error: any) {
        logger.error('Delete user error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error deleting user',
            error: error.message
        });
    }
};

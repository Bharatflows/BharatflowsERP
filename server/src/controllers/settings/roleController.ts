import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import prisma from '../../config/prisma';
import logger from '../../config/logger';

// @desc    Get all roles for company
// @route   GET /api/v1/settings/roles
// @access  Private
export const getRoles = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;

        const roleList = await prisma.customRole.findMany({
            where: { companyId },
            include: {
                _count: {
                    select: { users: true }
                }
            },
            orderBy: { createdAt: 'asc' }
        });

        // Transform to match frontend interface
        const formattedRoles = roleList.map(role => ({
            id: role.id,
            name: role.name,
            description: role.description || '',
            permissions: role.permissions,
            userCount: role._count.users,
            isCustom: true
        }));

        return res.json({
            success: true,
            data: formattedRoles
        });
    } catch (error: any) {
        logger.error('Get roles error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching roles',
            error: error.message
        });
    }
};

// @desc    Create new custom role
// @route   POST /api/v1/settings/roles
// @access  Private (Admin)
export const createRole = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const { name, description, permissions } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Role name is required'
            });
        }

        const existingRole = await prisma.customRole.findUnique({
            where: {
                companyId_name: {
                    companyId,
                    name
                }
            }
        });

        if (existingRole) {
            return res.status(400).json({
                success: false,
                message: 'Role with this name already exists'
            });
        }

        const role = await prisma.customRole.create({
            data: {
                companyId,
                name,
                description,
                permissions: permissions || {}
            }
        });

        return res.status(201).json({
            success: true,
            message: 'Role created successfully',
            data: {
                ...role,
                isCustom: true,
                userCount: 0
            }
        });
    } catch (error: any) {
        logger.error('Create role error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error creating role',
            error: error.message
        });
    }
};

// @desc    Update custom role
// @route   PUT /api/v1/settings/roles/:id
// @access  Private (Admin)
export const updateRole = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const { id } = req.params;
        const { name, description, permissions } = req.body;

        const role = await prisma.customRole.findUnique({
            where: { id , companyId: req.user.companyId }
        });

        if (!role || role.companyId !== companyId) {
            return res.status(404).json({
                success: false,
                message: 'Role not found'
            });
        }

        const updatedRole = await prisma.customRole.update({
            where: { id , companyId: req.user.companyId },
            data: {
                name: name || undefined,
                description: description || undefined,
                permissions: permissions || undefined
            }
        });

        return res.json({
            success: true,
            message: 'Role updated successfully',
            data: {
                ...updatedRole,
                isCustom: true
            }
        });
    } catch (error: any) {
        logger.error('Update role error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating role',
            error: error.message
        });
    }
};

// @desc    Delete custom role
// @route   DELETE /api/v1/settings/roles/:id
// @access  Private (Admin)
export const deleteRole = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const { id } = req.params;

        const role = await prisma.customRole.findUnique({
            where: { id , companyId: req.user.companyId },
            include: { _count: { select: { users: true } } }
        });

        if (!role || role.companyId !== companyId) {
            return res.status(404).json({
                success: false,
                message: 'Role not found'
            });
        }

        if (role._count.users > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete role assigned to ${role._count.users} users. Please reassign them first.`
            });
        }

        await prisma.customRole.delete({
            where: { id , companyId: req.user.companyId }
        });

        return res.json({
            success: true,
            message: 'Role deleted successfully'
        });
    } catch (error: any) {
        logger.error('Delete role error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error deleting role',
            error: error.message
        });
    }
};

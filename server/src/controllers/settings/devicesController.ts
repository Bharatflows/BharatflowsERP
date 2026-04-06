import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import prisma from '../../config/prisma';
import logger from '../../config/logger';

// @desc    Get all devices for company
// @route   GET /api/v1/settings/devices
// @access  Private
export const getDevices = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user.companyId;
        const { page = 1, limit = 20 } = req.query;

        const where: any = { companyId };

        const skip = (Number(page) - 1) * Number(limit);

        const [devices, total] = await Promise.all([
            prisma.device.findMany({
                where,
                orderBy: { lastActive: 'desc' },
                skip,
                take: Number(limit),
                include: {
                    user: {
                        select: { id: true, name: true, email: true },
                    },
                },
            }),
            prisma.device.count({ where }),
        ]);

        return res.json({
            success: true,
            data: {
                items: devices,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit)),
                },
            },
        });
    } catch (error: any) {
        logger.error('Get devices error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch devices',
            error: error.message,
        });
    }
};

// @desc    Get single device
// @route   GET /api/v1/settings/devices/:id
// @access  Private
export const getDevice = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;

        const device = await prisma.device.findFirst({
            where: { id, companyId },
            include: {
                user: {
                    select: { id: true, name: true, email: true },
                },
            },
        });

        if (!device) {
            return res.status(404).json({
                success: false,
                message: 'Device not found',
            });
        }

        return res.json({
            success: true,
            data: device,
        });
    } catch (error: any) {
        logger.error('Get device error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch device',
            error: error.message,
        });
    }
};

// @desc    Register/Create a new device
// @route   POST /api/v1/settings/devices
// @access  Private
export const registerDevice = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user.companyId;
        const userId = req.user.id;
        const {
            deviceName,
            deviceType,
            browser,
            os,
            ipAddress,
            location,
        } = req.body;

        const device = await prisma.device.create({
            data: {
                deviceName,
                deviceType: deviceType || 'Desktop',
                browser,
                os,
                ipAddress,
                location,
                lastActive: new Date(),
                userId,
                companyId,
            },
        });

        return res.status(201).json({
            success: true,
            message: 'Device registered successfully',
            data: device,
        });
    } catch (error: any) {
        logger.error('Register device error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to register device',
            error: error.message,
        });
    }
};

// @desc    Update device status (block/unblock)
// @route   PUT /api/v1/settings/devices/:id
// @access  Private
export const updateDevice = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;
        const { deviceName, isTrusted } = req.body;

        const existing = await prisma.device.findFirst({
            where: { id, companyId },
        });

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'Device not found',
            });
        }

        const device = await prisma.device.update({
            where: { id },
            data: {
                ...(deviceName && { deviceName }),
                ...(isTrusted !== undefined && { isTrusted }),
            },
        });

        return res.json({
            success: true,
            message: 'Device updated successfully',
            data: device,
        });
    } catch (error: any) {
        logger.error('Update device error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update device',
            error: error.message,
        });
    }
};

// @desc    Block a device
// @route   POST /api/v1/settings/devices/:id/block
// @access  Private
export const blockDevice = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;

        const existing = await prisma.device.findFirst({
            where: { id, companyId },
        });

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'Device not found',
            });
        }

        // Note: Device model doesn't have status field, we delete blocked devices
        await prisma.device.delete({
            where: { id },
        });

        return res.json({
            success: true,
            message: 'Device blocked and removed successfully',
        });
    } catch (error: any) {
        logger.error('Block device error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to block device',
            error: error.message,
        });
    }
};

// @desc    Unblock a device
// @route   POST /api/v1/settings/devices/:id/unblock
// @access  Private
export const unblockDevice = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;

        const existing = await prisma.device.findFirst({
            where: { id, companyId },
        });

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'Device not found',
            });
        }

        // Note: Device model doesn't have status field, mark as trusted instead
        const device = await prisma.device.update({
            where: { id },
            data: { isTrusted: true },
        });

        return res.json({
            success: true,
            message: 'Device trusted successfully',
            data: device,
        });
    } catch (error: any) {
        logger.error('Trust device error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to trust device',
            error: error.message,
        });
    }
};

// @desc    Delete a device
// @route   DELETE /api/v1/settings/devices/:id
// @access  Private
export const deleteDevice = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;

        const existing = await prisma.device.findFirst({
            where: { id, companyId },
        });

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'Device not found',
            });
        }

        await prisma.device.delete({
            where: { id },
        });

        return res.json({
            success: true,
            message: 'Device deleted successfully',
        });
    } catch (error: any) {
        logger.error('Delete device error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete device',
            error: error.message,
        });
    }
};

// @desc    Get device summary/stats
// @route   GET /api/v1/settings/devices/summary
// @access  Private
export const getDeviceSummary = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user.companyId;

        const [totalDevices, trustedDevices, untrustedDevices] = await Promise.all([
            prisma.device.count({ where: { companyId } }),
            prisma.device.count({ where: { companyId, isTrusted: true } }),
            prisma.device.count({ where: { companyId, isTrusted: false } }),
        ]);

        return res.json({
            success: true,
            data: {
                totalDevices,
                trustedDevices,
                untrustedDevices,
            },
        });
    } catch (error: any) {
        logger.error('Get device summary error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch device summary',
            error: error.message,
        });
    }
};

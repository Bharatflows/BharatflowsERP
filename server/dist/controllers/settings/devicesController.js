"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDeviceSummary = exports.deleteDevice = exports.unblockDevice = exports.blockDevice = exports.updateDevice = exports.registerDevice = exports.getDevice = exports.getDevices = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
const logger_1 = __importDefault(require("../../config/logger"));
// @desc    Get all devices for company
// @route   GET /api/v1/settings/devices
// @access  Private
const getDevices = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const { page = 1, limit = 20 } = req.query;
        const where = { companyId };
        const skip = (Number(page) - 1) * Number(limit);
        const [devices, total] = await Promise.all([
            prisma_1.default.device.findMany({
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
            prisma_1.default.device.count({ where }),
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
    }
    catch (error) {
        logger_1.default.error('Get devices error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch devices',
            error: error.message,
        });
    }
};
exports.getDevices = getDevices;
// @desc    Get single device
// @route   GET /api/v1/settings/devices/:id
// @access  Private
const getDevice = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;
        const device = await prisma_1.default.device.findFirst({
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
    }
    catch (error) {
        logger_1.default.error('Get device error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch device',
            error: error.message,
        });
    }
};
exports.getDevice = getDevice;
// @desc    Register/Create a new device
// @route   POST /api/v1/settings/devices
// @access  Private
const registerDevice = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const userId = req.user.id;
        const { deviceName, deviceType, browser, os, ipAddress, location, } = req.body;
        const device = await prisma_1.default.device.create({
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
    }
    catch (error) {
        logger_1.default.error('Register device error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to register device',
            error: error.message,
        });
    }
};
exports.registerDevice = registerDevice;
// @desc    Update device status (block/unblock)
// @route   PUT /api/v1/settings/devices/:id
// @access  Private
const updateDevice = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;
        const { deviceName, isTrusted } = req.body;
        const existing = await prisma_1.default.device.findFirst({
            where: { id, companyId },
        });
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'Device not found',
            });
        }
        const device = await prisma_1.default.device.update({
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
    }
    catch (error) {
        logger_1.default.error('Update device error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update device',
            error: error.message,
        });
    }
};
exports.updateDevice = updateDevice;
// @desc    Block a device
// @route   POST /api/v1/settings/devices/:id/block
// @access  Private
const blockDevice = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;
        const existing = await prisma_1.default.device.findFirst({
            where: { id, companyId },
        });
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'Device not found',
            });
        }
        // Note: Device model doesn't have status field, we delete blocked devices
        await prisma_1.default.device.delete({
            where: { id },
        });
        return res.json({
            success: true,
            message: 'Device blocked and removed successfully',
        });
    }
    catch (error) {
        logger_1.default.error('Block device error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to block device',
            error: error.message,
        });
    }
};
exports.blockDevice = blockDevice;
// @desc    Unblock a device
// @route   POST /api/v1/settings/devices/:id/unblock
// @access  Private
const unblockDevice = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;
        const existing = await prisma_1.default.device.findFirst({
            where: { id, companyId },
        });
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'Device not found',
            });
        }
        // Note: Device model doesn't have status field, mark as trusted instead
        const device = await prisma_1.default.device.update({
            where: { id },
            data: { isTrusted: true },
        });
        return res.json({
            success: true,
            message: 'Device trusted successfully',
            data: device,
        });
    }
    catch (error) {
        logger_1.default.error('Trust device error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to trust device',
            error: error.message,
        });
    }
};
exports.unblockDevice = unblockDevice;
// @desc    Delete a device
// @route   DELETE /api/v1/settings/devices/:id
// @access  Private
const deleteDevice = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;
        const existing = await prisma_1.default.device.findFirst({
            where: { id, companyId },
        });
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'Device not found',
            });
        }
        await prisma_1.default.device.delete({
            where: { id },
        });
        return res.json({
            success: true,
            message: 'Device deleted successfully',
        });
    }
    catch (error) {
        logger_1.default.error('Delete device error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete device',
            error: error.message,
        });
    }
};
exports.deleteDevice = deleteDevice;
// @desc    Get device summary/stats
// @route   GET /api/v1/settings/devices/summary
// @access  Private
const getDeviceSummary = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const [totalDevices, trustedDevices, untrustedDevices] = await Promise.all([
            prisma_1.default.device.count({ where: { companyId } }),
            prisma_1.default.device.count({ where: { companyId, isTrusted: true } }),
            prisma_1.default.device.count({ where: { companyId, isTrusted: false } }),
        ]);
        return res.json({
            success: true,
            data: {
                totalDevices,
                trustedDevices,
                untrustedDevices,
            },
        });
    }
    catch (error) {
        logger_1.default.error('Get device summary error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch device summary',
            error: error.message,
        });
    }
};
exports.getDeviceSummary = getDeviceSummary;
//# sourceMappingURL=devicesController.js.map
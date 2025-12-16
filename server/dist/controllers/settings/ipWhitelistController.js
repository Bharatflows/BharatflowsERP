"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkIPWhitelist = exports.removeIPFromWhitelist = exports.toggleIPWhitelist = exports.updateIPWhitelist = exports.addIPToWhitelist = exports.getIPWhitelistEntry = exports.getIPWhitelist = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
const logger_1 = __importDefault(require("../../config/logger"));
// @desc    Get all IP whitelist entries
// @route   GET /api/v1/settings/ip-whitelist
// @access  Private
const getIPWhitelist = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const { enabled, page = 1, limit = 20 } = req.query;
        const where = { companyId };
        if (enabled !== undefined)
            where.enabled = enabled === 'true';
        const skip = (Number(page) - 1) * Number(limit);
        const [ipAddresses, total] = await Promise.all([
            prisma_1.default.iPWhitelist.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: Number(limit),
            }),
            prisma_1.default.iPWhitelist.count({ where }),
        ]);
        return res.json({
            success: true,
            data: {
                items: ipAddresses,
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
        logger_1.default.error('Get IP whitelist error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch IP whitelist',
            error: error.message,
        });
    }
};
exports.getIPWhitelist = getIPWhitelist;
// @desc    Get single IP whitelist entry
// @route   GET /api/v1/settings/ip-whitelist/:id
// @access  Private
const getIPWhitelistEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;
        const entry = await prisma_1.default.iPWhitelist.findFirst({
            where: { id, companyId },
        });
        if (!entry) {
            return res.status(404).json({
                success: false,
                message: 'IP whitelist entry not found',
            });
        }
        return res.json({
            success: true,
            data: entry,
        });
    }
    catch (error) {
        logger_1.default.error('Get IP whitelist entry error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch IP whitelist entry',
            error: error.message,
        });
    }
};
exports.getIPWhitelistEntry = getIPWhitelistEntry;
// @desc    Add IP to whitelist
// @route   POST /api/v1/settings/ip-whitelist
// @access  Private
const addIPToWhitelist = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const userId = req.user.id;
        const { ipAddress, description, type, rangeStart, rangeEnd } = req.body;
        if (!ipAddress) {
            return res.status(400).json({
                success: false,
                message: 'IP address is required',
            });
        }
        // Check if IP already exists
        const existingIP = await prisma_1.default.iPWhitelist.findFirst({
            where: { ipAddress, companyId },
        });
        if (existingIP) {
            return res.status(400).json({
                success: false,
                message: 'IP address already exists in whitelist',
            });
        }
        const entry = await prisma_1.default.iPWhitelist.create({
            data: {
                ipAddress,
                description,
                type: type || 'single',
                rangeStart,
                rangeEnd,
                enabled: true,
                createdBy: userId,
                companyId,
            },
        });
        return res.status(201).json({
            success: true,
            message: 'IP address added to whitelist',
            data: entry,
        });
    }
    catch (error) {
        logger_1.default.error('Add IP to whitelist error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to add IP to whitelist',
            error: error.message,
        });
    }
};
exports.addIPToWhitelist = addIPToWhitelist;
// @desc    Update IP whitelist entry
// @route   PUT /api/v1/settings/ip-whitelist/:id
// @access  Private
const updateIPWhitelist = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;
        const { description, enabled, type, rangeStart, rangeEnd } = req.body;
        const existing = await prisma_1.default.iPWhitelist.findFirst({
            where: { id, companyId },
        });
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'IP whitelist entry not found',
            });
        }
        const entry = await prisma_1.default.iPWhitelist.update({
            where: { id },
            data: {
                ...(description !== undefined && { description }),
                ...(enabled !== undefined && { enabled }),
                ...(type !== undefined && { type }),
                ...(rangeStart !== undefined && { rangeStart }),
                ...(rangeEnd !== undefined && { rangeEnd }),
            },
        });
        return res.json({
            success: true,
            message: 'IP whitelist entry updated',
            data: entry,
        });
    }
    catch (error) {
        logger_1.default.error('Update IP whitelist error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update IP whitelist entry',
            error: error.message,
        });
    }
};
exports.updateIPWhitelist = updateIPWhitelist;
// @desc    Toggle IP whitelist entry active status
// @route   POST /api/v1/settings/ip-whitelist/:id/toggle
// @access  Private
const toggleIPWhitelist = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;
        const existing = await prisma_1.default.iPWhitelist.findFirst({
            where: { id, companyId },
        });
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'IP whitelist entry not found',
            });
        }
        const entry = await prisma_1.default.iPWhitelist.update({
            where: { id },
            data: { enabled: !existing.enabled },
        });
        return res.json({
            success: true,
            message: `IP whitelist entry ${entry.enabled ? 'enabled' : 'disabled'}`,
            data: entry,
        });
    }
    catch (error) {
        logger_1.default.error('Toggle IP whitelist error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to toggle IP whitelist entry',
            error: error.message,
        });
    }
};
exports.toggleIPWhitelist = toggleIPWhitelist;
// @desc    Delete IP from whitelist
// @route   DELETE /api/v1/settings/ip-whitelist/:id
// @access  Private
const removeIPFromWhitelist = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;
        const existing = await prisma_1.default.iPWhitelist.findFirst({
            where: { id, companyId },
        });
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'IP whitelist entry not found',
            });
        }
        await prisma_1.default.iPWhitelist.delete({
            where: { id },
        });
        return res.json({
            success: true,
            message: 'IP removed from whitelist',
        });
    }
    catch (error) {
        logger_1.default.error('Remove IP from whitelist error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to remove IP from whitelist',
            error: error.message,
        });
    }
};
exports.removeIPFromWhitelist = removeIPFromWhitelist;
// @desc    Check if IP is whitelisted
// @route   GET /api/v1/settings/ip-whitelist/check/:ip
// @access  Private
const checkIPWhitelist = async (req, res) => {
    try {
        const { ip } = req.params;
        const companyId = req.user.companyId;
        const entry = await prisma_1.default.iPWhitelist.findFirst({
            where: {
                ipAddress: ip,
                companyId,
                enabled: true,
            },
        });
        return res.json({
            success: true,
            data: {
                isWhitelisted: !!entry,
                entry: entry || null,
            },
        });
    }
    catch (error) {
        logger_1.default.error('Check IP whitelist error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to check IP whitelist',
            error: error.message,
        });
    }
};
exports.checkIPWhitelist = checkIPWhitelist;
//# sourceMappingURL=ipWhitelistController.js.map
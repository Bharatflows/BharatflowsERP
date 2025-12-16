"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchDeliveryChallans = exports.deleteDeliveryChallan = exports.updateDeliveryChallan = exports.createDeliveryChallan = exports.getDeliveryChallan = exports.getDeliveryChallans = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const logger_1 = __importDefault(require("../config/logger"));
const sequenceService_1 = require("../services/sequenceService");
// @desc    Get all delivery challans
// @route   GET /api/v1/sales/challans
// @access  Private
const getDeliveryChallans = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, search } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {
            companyId: req.user.companyId
        };
        if (status) {
            where.status = status.toString().toUpperCase();
        }
        if (search) {
            where.OR = [
                { challanNumber: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [challans, total] = await Promise.all([
            prisma_1.default.deliveryChallan.findMany({
                where,
                include: {
                    customer: true,
                    items: true
                },
                orderBy: { challanDate: 'desc' },
                skip,
                take: Number(limit)
            }),
            prisma_1.default.deliveryChallan.count({ where })
        ]);
        return res.status(200).json({
            success: true,
            data: {
                challans,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
                }
            }
        });
    }
    catch (error) {
        logger_1.default.error('Get delivery challans error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching delivery challans',
            error: error.message
        });
    }
};
exports.getDeliveryChallans = getDeliveryChallans;
// @desc    Get single delivery challan
// @route   GET /api/v1/sales/challans/:id
// @access  Private
const getDeliveryChallan = async (req, res) => {
    try {
        const challan = await prisma_1.default.deliveryChallan.findUnique({
            where: {
                id: req.params.id
            },
            include: {
                customer: true,
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });
        if (!challan || challan.companyId !== req.user.companyId) {
            return res.status(404).json({
                success: false,
                message: 'Delivery challan not found'
            });
        }
        return res.status(200).json({
            success: true,
            data: { challan }
        });
    }
    catch (error) {
        logger_1.default.error('Get delivery challan error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching delivery challan',
            error: error.message
        });
    }
};
exports.getDeliveryChallan = getDeliveryChallan;
// @desc    Create new delivery challan
// @route   POST /api/v1/sales/challans
// @access  Private
const createDeliveryChallan = async (req, res) => {
    try {
        const { customerId, challanDate, referenceNumber, items, notes, status } = req.body;
        if (!customerId || !challanDate || !items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Customer, challan date, and at least one item are required'
            });
        }
        // Calculate totals
        let subtotal = 0;
        const processedItems = items.map((item) => {
            const itemTotal = Number(item.quantity) * Number(item.rate);
            subtotal += itemTotal;
            return {
                productId: item.productId,
                productName: item.productName,
                quantity: Number(item.quantity),
                rate: Number(item.rate),
                total: itemTotal
            };
        });
        const totalAmount = subtotal;
        // Generate challan number
        const challanNumber = await (0, sequenceService_1.getNextNumber)(req.user.companyId, 'DELIVERY_CHALLAN');
        const challan = await prisma_1.default.deliveryChallan.create({
            data: {
                challanNumber,
                challanDate: new Date(challanDate),
                referenceNumber: referenceNumber || null,
                subtotal,
                totalAmount,
                status: status || 'DRAFT',
                notes: notes || null,
                companyId: req.user.companyId,
                customerId,
                items: {
                    create: processedItems
                }
            },
            include: {
                customer: true,
                items: true
            }
        });
        logger_1.default.info(`Delivery challan created: ${challan.challanNumber} by user ${req.user.id}`);
        return res.status(201).json({
            success: true,
            message: 'Delivery challan created successfully',
            data: { challan }
        });
    }
    catch (error) {
        logger_1.default.error('Create delivery challan error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error creating delivery challan',
            error: error.message
        });
    }
};
exports.createDeliveryChallan = createDeliveryChallan;
// @desc    Update delivery challan
// @route   PUT /api/v1/sales/challans/:id
// @access  Private
const updateDeliveryChallan = async (req, res) => {
    try {
        const { challanDate, referenceNumber, items, notes, status } = req.body;
        const existingChallan = await prisma_1.default.deliveryChallan.findUnique({
            where: { id: req.params.id }
        });
        if (!existingChallan || existingChallan.companyId !== req.user.companyId) {
            return res.status(404).json({
                success: false,
                message: 'Delivery challan not found'
            });
        }
        // Calculate new totals if items provided
        let subtotal = existingChallan.subtotal.toNumber();
        let totalAmount = existingChallan.totalAmount.toNumber();
        if (items && items.length > 0) {
            subtotal = 0;
            const processedItems = items.map((item) => {
                const itemTotal = Number(item.quantity) * Number(item.rate);
                subtotal += itemTotal;
                return {
                    productId: item.productId,
                    productName: item.productName,
                    quantity: Number(item.quantity),
                    rate: Number(item.rate),
                    total: itemTotal
                };
            });
            totalAmount = subtotal;
            // Delete existing items and create new ones
            await prisma_1.default.deliveryChallanItem.deleteMany({
                where: { challanId: req.params.id }
            });
            await prisma_1.default.deliveryChallanItem.createMany({
                data: processedItems.map((item) => ({
                    ...item,
                    challanId: req.params.id
                }))
            });
        }
        const challan = await prisma_1.default.deliveryChallan.update({
            where: { id: req.params.id },
            data: {
                challanDate: challanDate ? new Date(challanDate) : undefined,
                referenceNumber: referenceNumber !== undefined ? referenceNumber : undefined,
                subtotal,
                totalAmount,
                status: status || undefined,
                notes: notes !== undefined ? notes : undefined
            },
            include: {
                customer: true,
                items: true
            }
        });
        logger_1.default.info(`Delivery challan updated: ${challan.challanNumber} by user ${req.user.id}`);
        return res.status(200).json({
            success: true,
            message: 'Delivery challan updated successfully',
            data: { challan }
        });
    }
    catch (error) {
        logger_1.default.error('Update delivery challan error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating delivery challan',
            error: error.message
        });
    }
};
exports.updateDeliveryChallan = updateDeliveryChallan;
// @desc    Delete delivery challan
// @route   DELETE /api/v1/sales/challans/:id
// @access  Private
const deleteDeliveryChallan = async (req, res) => {
    try {
        const challan = await prisma_1.default.deliveryChallan.findUnique({
            where: { id: req.params.id }
        });
        if (!challan || challan.companyId !== req.user.companyId) {
            return res.status(404).json({
                success: false,
                message: 'Delivery challan not found'
            });
        }
        await prisma_1.default.deliveryChallan.delete({
            where: { id: req.params.id }
        });
        logger_1.default.info(`Delivery challan deleted: ${challan.challanNumber} by user ${req.user.id}`);
        return res.status(200).json({
            success: true,
            message: 'Delivery challan deleted successfully'
        });
    }
    catch (error) {
        logger_1.default.error('Delete delivery challan error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error deleting delivery challan',
            error: error.message
        });
    }
};
exports.deleteDeliveryChallan = deleteDeliveryChallan;
// @desc    Search delivery challans
// @route   GET /api/v1/sales/challans/search
// @access  Private
const searchDeliveryChallans = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }
        const challans = await prisma_1.default.deliveryChallan.findMany({
            where: {
                companyId: req.user.companyId,
                OR: [
                    { challanNumber: { contains: q, mode: 'insensitive' } },
                    { referenceNumber: { contains: q, mode: 'insensitive' } },
                ]
            },
            include: {
                customer: true,
                items: true
            },
            orderBy: { challanDate: 'desc' },
            take: 20
        });
        return res.status(200).json({
            success: true,
            data: { challans }
        });
    }
    catch (error) {
        logger_1.default.error('Search delivery challans error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error searching delivery challans',
            error: error.message
        });
    }
};
exports.searchDeliveryChallans = searchDeliveryChallans;
//# sourceMappingURL=deliveryChallanController.js.map
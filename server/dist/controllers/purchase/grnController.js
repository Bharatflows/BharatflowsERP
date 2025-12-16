"use strict";
/**
 * Goods Received Note (GRN) Controller
 *
 * Handles all GRN-related operations.
 * Split from purchaseController.ts for better maintainability.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteGRN = exports.updateGRN = exports.createGRN = exports.getGRN = exports.getGRNs = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
const sequenceService_1 = require("../../services/sequenceService");
// @desc    Get all GRNs
// @route   GET /api/v1/purchases/grn
// @access  Private
const getGRNs = async (req, res) => {
    try {
        const companyId = req.user?.companyId;
        const grns = await prisma_1.default.goodsReceivedNote.findMany({
            where: { companyId },
            include: {
                supplier: true,
                items: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({
            success: true,
            count: grns.length,
            data: grns
        });
    }
    catch (error) {
        console.error('Error fetching GRNs:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
exports.getGRNs = getGRNs;
// @desc    Get single GRN
// @route   GET /api/v1/purchases/grn/:id
// @access  Private
const getGRN = async (req, res) => {
    try {
        const grn = await prisma_1.default.goodsReceivedNote.findFirst({
            where: {
                id: req.params.id,
                companyId: req.user?.companyId
            },
            include: {
                supplier: true,
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });
        if (!grn) {
            res.status(404).json({
                success: false,
                message: 'GRN not found'
            });
            return;
        }
        res.json({
            success: true,
            data: grn
        });
    }
    catch (error) {
        console.error('Error fetching GRN:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
exports.getGRN = getGRN;
// @desc    Create GRN
// @route   POST /api/v1/purchases/grn
// @access  Private
const createGRN = async (req, res) => {
    try {
        const { supplierId, grnDate, referenceNumber, items, notes, subtotal, totalAmount } = req.body;
        const companyId = req.user?.companyId;
        const userId = req.user?.id;
        // Use transaction to ensure data integrity
        const grn = await prisma_1.default.$transaction(async (tx) => {
            // 1. Create the GRN
            const createdGRN = await tx.goodsReceivedNote.create({
                data: {
                    companyId: companyId,
                    supplierId,
                    grnNumber: await (0, sequenceService_1.getNextNumber)(companyId, 'GRN'),
                    grnDate: new Date(grnDate),
                    referenceNumber,
                    notes,
                    subtotal: Number(subtotal || 0),
                    totalAmount: Number(totalAmount || 0),
                    status: 'RECEIVED',
                    items: {
                        create: items.map((item) => ({
                            productId: item.productId || null,
                            productName: item.productName || 'Unknown Product',
                            quantity: Number(item.quantity) || 0,
                            rate: Number(item.rate) || 0,
                            total: Number(item.total || 0)
                        }))
                    }
                },
                include: {
                    items: true
                }
            });
            // 2. Increase stock for each product and log stock movements
            for (const item of items) {
                if (item.productId) {
                    // Get current stock
                    const product = await tx.product.findUnique({
                        where: { id: item.productId },
                        select: { currentStock: true, trackInventory: true }
                    });
                    if (product && product.trackInventory) {
                        const previousStock = product.currentStock;
                        const quantity = Number(item.quantity);
                        const newStock = previousStock + quantity;
                        // Update product stock (INCREASE)
                        await tx.product.update({
                            where: { id: item.productId },
                            data: { currentStock: newStock }
                        });
                        // Log stock movement for audit trail
                        await tx.stockMovement.create({
                            data: {
                                companyId: companyId,
                                productId: item.productId,
                                type: 'PURCHASE',
                                quantity: quantity,
                                previousStock,
                                newStock,
                                reference: createdGRN.grnNumber,
                                reason: `Received via GRN ${createdGRN.grnNumber}`,
                                createdBy: userId
                            }
                        });
                    }
                }
            }
            // 3. Update supplier balance (increase payable)
            await tx.party.update({
                where: { id: supplierId },
                data: {
                    currentBalance: {
                        increment: Number(totalAmount || 0)
                    }
                }
            });
            return createdGRN;
        });
        console.log(`GRN created: ${grn.grnNumber} - Stock updated, Supplier balance updated`);
        res.status(201).json({
            success: true,
            data: grn
        });
    }
    catch (error) {
        console.error('Error creating GRN:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
exports.createGRN = createGRN;
// @desc    Update GRN
// @route   PUT /api/v1/purchases/grn/:id
// @access  Private
const updateGRN = async (req, res) => {
    try {
        const { supplierId, grnDate, referenceNumber, items, notes, subtotal, totalAmount, status } = req.body;
        const grnId = req.params.id;
        const companyId = req.user?.companyId;
        const existingGRN = await prisma_1.default.goodsReceivedNote.findFirst({
            where: { id: grnId, companyId }
        });
        if (!existingGRN) {
            res.status(404).json({
                success: false,
                message: 'GRN not found'
            });
            return;
        }
        await prisma_1.default.goodsReceivedNoteItem.deleteMany({
            where: { grnId }
        });
        const updatedGRN = await prisma_1.default.goodsReceivedNote.update({
            where: { id: grnId },
            data: {
                supplierId,
                grnDate: new Date(grnDate),
                referenceNumber,
                notes,
                subtotal: Number(subtotal || 0),
                totalAmount: Number(totalAmount || 0),
                status,
                items: {
                    create: items.map((item) => ({
                        productId: item.productId || null,
                        productName: item.productName || 'Unknown Product',
                        quantity: Number(item.quantity) || 0,
                        rate: Number(item.rate) || 0,
                        total: Number(item.total || 0)
                    }))
                }
            },
            include: {
                items: true
            }
        });
        res.json({
            success: true,
            data: updatedGRN
        });
    }
    catch (error) {
        console.error('Error updating GRN:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
exports.updateGRN = updateGRN;
// @desc    Delete GRN
// @route   DELETE /api/v1/purchases/grn/:id
// @access  Private
const deleteGRN = async (req, res) => {
    try {
        const grn = await prisma_1.default.goodsReceivedNote.findFirst({
            where: {
                id: req.params.id,
                companyId: req.user?.companyId
            }
        });
        if (!grn) {
            res.status(404).json({
                success: false,
                message: 'GRN not found'
            });
            return;
        }
        await prisma_1.default.goodsReceivedNote.delete({
            where: { id: req.params.id }
        });
        res.json({
            success: true,
            data: {}
        });
    }
    catch (error) {
        console.error('Error deleting GRN:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
exports.deleteGRN = deleteGRN;
//# sourceMappingURL=grnController.js.map
"use strict";
/**
 * Goods Received Note (GRN) Controller
 *
 * Handles all GRN-related operations.
 * Split from purchaseController.ts for better maintainability.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteGRN = exports.updateGRN = exports.createGRN = exports.getGRN = exports.getGRNs = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
const sequenceService_1 = require("../../services/sequenceService");
const eventBus_1 = __importStar(require("../../services/eventBus")); // P0-5: Domain events
const logger_1 = __importDefault(require("../../config/logger"));
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
        logger_1.default.error('Error fetching GRNs:', error);
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
        logger_1.default.error('Error fetching GRN:', error);
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
                            total: Number(item.total || 0),
                            batchNumber: item.batchNumber || null,
                            expiryDate: item.expiryDate ? new Date(item.expiryDate) : null
                        }))
                    }
                },
                include: {
                    items: true
                }
            });
            return createdGRN;
        });
        logger_1.default.info(`GRN created: ${grn.grnNumber}`);
        // P0-5: Emit domain event for event-driven processing
        try {
            await eventBus_1.default.emit({
                companyId: companyId,
                eventType: eventBus_1.EventTypes.GOODS_RECEIVED,
                aggregateType: 'GoodsReceivedNote',
                aggregateId: grn.id,
                payload: {
                    grnId: grn.id,
                    grnNumber: grn.grnNumber,
                    supplierId: supplierId,
                    totalAmount: Number(totalAmount || 0),
                    items: items.map((item) => ({
                        productId: item.productId,
                        quantity: Number(item.quantity),
                        batchNumber: item.batchNumber,
                        expiryDate: item.expiryDate
                    }))
                },
                metadata: {
                    userId: userId,
                    source: 'api'
                }
            });
            logger_1.default.info(`[GRN] Emitted GOODS_RECEIVED event for ${grn.grnNumber}`);
        }
        catch (eventError) {
            logger_1.default.warn(`Failed to emit GOODS_RECEIVED event: ${eventError}`);
        }
        res.status(201).json({
            success: true,
            data: grn
        });
    }
    catch (error) {
        logger_1.default.error('Error creating GRN:', error);
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
        logger_1.default.error('Error updating GRN:', error);
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
        // Emit domain event
        await eventBus_1.default.emit({
            companyId: req.user.companyId,
            eventType: eventBus_1.EventTypes.GRN_DELETED,
            aggregateType: 'GoodsReceivedNote',
            aggregateId: grn.id,
            payload: grn,
            metadata: { userId: req.user.id, source: 'api' }
        });
        // Decrement the sequence number to reuse the freed number
        await (0, sequenceService_1.decrementSequence)(req.user.companyId, 'GRN');
        res.json({
            success: true,
            data: {}
        });
    }
    catch (error) {
        logger_1.default.error('Error deleting GRN:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
exports.deleteGRN = deleteGRN;
//# sourceMappingURL=grnController.js.map
"use strict";
/**
 * Purchase Bill Controller
 *
 * Handles all purchase bill-related operations.
 * Split from purchaseController.ts for better maintainability.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePurchaseBill = exports.updatePurchaseBill = exports.createPurchaseBill = exports.getPurchaseBill = exports.getPurchaseBills = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
const sequenceService_1 = require("../../services/sequenceService");
// @desc    Get all purchase bills
// @route   GET /api/v1/purchases/bills
// @access  Private
const getPurchaseBills = async (req, res) => {
    try {
        const companyId = req.user?.companyId;
        const bills = await prisma_1.default.purchaseBill.findMany({
            where: { companyId },
            include: {
                supplier: true,
                items: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({
            success: true,
            count: bills.length,
            data: bills
        });
    }
    catch (error) {
        console.error('Error fetching purchase bills:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
exports.getPurchaseBills = getPurchaseBills;
// @desc    Get single purchase bill
// @route   GET /api/v1/purchases/bills/:id
// @access  Private
const getPurchaseBill = async (req, res) => {
    try {
        const bill = await prisma_1.default.purchaseBill.findFirst({
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
        if (!bill) {
            res.status(404).json({
                success: false,
                message: 'Purchase bill not found'
            });
            return;
        }
        res.json({
            success: true,
            data: bill
        });
    }
    catch (error) {
        console.error('Error fetching purchase bill:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
exports.getPurchaseBill = getPurchaseBill;
// @desc    Create purchase bill
// @route   POST /api/v1/purchases/bills
// @access  Private
const createPurchaseBill = async (req, res) => {
    try {
        const { supplierId, billDate, dueDate, items, notes, subtotal, totalTax, totalAmount, amountPaid, balanceAmount } = req.body;
        const companyId = req.user?.companyId;
        const bill = await prisma_1.default.purchaseBill.create({
            data: {
                companyId: companyId,
                supplierId,
                billNumber: await (0, sequenceService_1.getNextNumber)(companyId, 'PURCHASE_BILL'),
                billDate: new Date(billDate),
                dueDate: dueDate ? new Date(dueDate) : null,
                notes,
                subtotal: Number(subtotal || 0),
                totalTax: Number(totalTax || 0),
                totalAmount: Number(totalAmount || 0),
                amountPaid: Number(amountPaid || 0),
                balanceAmount: Number(balanceAmount || totalAmount || 0),
                status: 'OPEN',
                items: {
                    create: items.map((item) => ({
                        productId: item.productId || null,
                        productName: item.productName || 'Unknown Product',
                        quantity: Number(item.quantity) || 0,
                        rate: Number(item.rate) || 0,
                        taxRate: Number(item.taxRate || 0),
                        taxAmount: Number(item.taxAmount || 0),
                        total: Number(item.total || 0)
                    }))
                }
            },
            include: {
                items: true
            }
        });
        res.status(201).json({
            success: true,
            data: bill
        });
    }
    catch (error) {
        console.error('Error creating purchase bill:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
exports.createPurchaseBill = createPurchaseBill;
// @desc    Update purchase bill
// @route   PUT /api/v1/purchases/bills/:id
// @access  Private
const updatePurchaseBill = async (req, res) => {
    try {
        const { supplierId, billDate, dueDate, items, notes, subtotal, totalTax, totalAmount, amountPaid, balanceAmount, status } = req.body;
        const billId = req.params.id;
        const companyId = req.user?.companyId;
        const existingBill = await prisma_1.default.purchaseBill.findFirst({
            where: { id: billId, companyId }
        });
        if (!existingBill) {
            res.status(404).json({
                success: false,
                message: 'Purchase bill not found'
            });
            return;
        }
        await prisma_1.default.purchaseBillItem.deleteMany({
            where: { billId }
        });
        const updatedBill = await prisma_1.default.purchaseBill.update({
            where: { id: billId },
            data: {
                supplierId,
                billDate: new Date(billDate),
                dueDate: dueDate ? new Date(dueDate) : null,
                notes,
                subtotal: Number(subtotal || 0),
                totalTax: Number(totalTax || 0),
                totalAmount: Number(totalAmount || 0),
                amountPaid: Number(amountPaid || 0),
                balanceAmount: Number(balanceAmount || 0),
                status,
                items: {
                    create: items.map((item) => ({
                        productId: item.productId || null,
                        productName: item.productName || 'Unknown Product',
                        quantity: Number(item.quantity) || 0,
                        rate: Number(item.rate) || 0,
                        taxRate: Number(item.taxRate || 0),
                        taxAmount: Number(item.taxAmount || 0),
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
            data: updatedBill
        });
    }
    catch (error) {
        console.error('Error updating purchase bill:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
exports.updatePurchaseBill = updatePurchaseBill;
// @desc    Delete purchase bill
// @route   DELETE /api/v1/purchases/bills/:id
// @access  Private
const deletePurchaseBill = async (req, res) => {
    try {
        const bill = await prisma_1.default.purchaseBill.findFirst({
            where: {
                id: req.params.id,
                companyId: req.user?.companyId
            }
        });
        if (!bill) {
            res.status(404).json({
                success: false,
                message: 'Purchase bill not found'
            });
            return;
        }
        await prisma_1.default.purchaseBill.delete({
            where: { id: req.params.id }
        });
        res.json({
            success: true,
            data: {}
        });
    }
    catch (error) {
        console.error('Error deleting purchase bill:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
exports.deletePurchaseBill = deletePurchaseBill;
//# sourceMappingURL=purchaseBillController.js.map
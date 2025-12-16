/**
 * Purchase Bill Controller
 * 
 * Handles all purchase bill-related operations.
 * Split from purchaseController.ts for better maintainability.
 */

import { Response } from 'express';
import prisma from '../../config/prisma';
import { AuthRequest } from '../../middleware/auth';
import { getNextNumber, decrementSequence } from '../../services/sequenceService';
import postingService from '../../services/postingService';

// @desc    Get all purchase bills
// @route   GET /api/v1/purchases/bills
// @access  Private
export const getPurchaseBills = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user?.companyId;

        const bills = await prisma.purchaseBill.findMany({
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
    } catch (error) {
        console.error('Error fetching purchase bills:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Get single purchase bill
// @route   GET /api/v1/purchases/bills/:id
// @access  Private
export const getPurchaseBill = async (req: AuthRequest, res: Response) => {
    try {
        const bill = await prisma.purchaseBill.findFirst({
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
    } catch (error) {
        console.error('Error fetching purchase bill:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Create purchase bill
// @route   POST /api/v1/purchases/bills
// @access  Private
export const createPurchaseBill = async (req: AuthRequest, res: Response) => {
    try {
        const {
            supplierId,
            billDate,
            dueDate,
            items,
            notes,
            subtotal,
            totalTax,
            totalAmount,
            amountPaid,
            balanceAmount
        } = req.body;

        const companyId = req.user?.companyId;

        const bill = await prisma.purchaseBill.create({
            data: {
                companyId: companyId!,
                supplierId,
                billNumber: await getNextNumber(companyId!, 'PURCHASE_BILL'),
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
                    create: items.map((item: any) => ({
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

        // Create ledger postings for double-entry accounting
        try {
            await postingService.postPurchaseBill({
                id: bill.id,
                billNumber: bill.billNumber,
                billDate: bill.billDate,
                supplierId: bill.supplierId,
                subtotal: Number(bill.subtotal),
                taxAmount: Number(bill.totalTax),
                totalAmount: Number(bill.totalAmount),
                companyId: companyId!
            });
        } catch (postingError) {
            console.warn(`Failed to create ledger postings for bill ${bill.billNumber}:`, postingError);
        }

        res.status(201).json({
            success: true,
            data: bill
        });
    } catch (error) {
        console.error('Error creating purchase bill:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Update purchase bill
// @route   PUT /api/v1/purchases/bills/:id
// @access  Private
export const updatePurchaseBill = async (req: AuthRequest, res: Response) => {
    try {
        const {
            supplierId,
            billDate,
            dueDate,
            items,
            notes,
            subtotal,
            totalTax,
            totalAmount,
            amountPaid,
            balanceAmount,
            status
        } = req.body;

        const billId = req.params.id;
        const companyId = req.user?.companyId;

        const existingBill = await prisma.purchaseBill.findFirst({
            where: { id: billId, companyId }
        });

        if (!existingBill) {
            res.status(404).json({
                success: false,
                message: 'Purchase bill not found'
            });
            return;
        }

        await prisma.purchaseBillItem.deleteMany({
            where: { billId }
        });

        const updatedBill = await prisma.purchaseBill.update({
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
                    create: items.map((item: any) => ({
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
    } catch (error) {
        console.error('Error updating purchase bill:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Delete purchase bill
// @route   DELETE /api/v1/purchases/bills/:id
// @access  Private
export const deletePurchaseBill = async (req: AuthRequest, res: Response) => {
    try {
        const bill = await prisma.purchaseBill.findFirst({
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

        await prisma.purchaseBill.delete({
            where: { id: req.params.id }
        });

        // Decrement the sequence number to reuse the freed number
        await decrementSequence(req.user!.companyId!, 'PURCHASE_BILL');

        res.json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.error('Error deleting purchase bill:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

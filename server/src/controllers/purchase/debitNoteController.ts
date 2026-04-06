import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import prisma from '../../config/prisma';
import logger from '../../config/logger';
import * as sequenceService from '../../services/sequenceService';
import { requireUnlockedPeriod } from '../../services/periodLockService';
// P0: postingService removed - ledger posting handled by Accounting domain via event subscription
import { eventBus, EventTypes } from '../../services/eventBus';

// @desc    Get all Debit Notes
// @route   GET /api/v1/purchase/debit-notes
// @access  Private
export const getDebitNotes = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { page = 1, limit = 10, search, supplierId, startDate, endDate } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const where: any = {
            companyId: req.user.companyId
        };

        if (search) {
            where.OR = [
                { debitNoteNumber: { contains: String(search) } },
                { supplier: { name: { contains: String(search) } } }
            ];
        }

        if (supplierId) where.supplierId = String(supplierId);

        if (startDate && endDate) {
            where.date = {
                gte: new Date(String(startDate)),
                lte: new Date(String(endDate))
            };
        }

        const debitNotes = await prisma.debitNote.findMany({
            where,
            include: {
                supplier: { select: { name: true } },
                bill: { select: { billNumber: true } }
            },
            skip,
            take: Number(limit),
            orderBy: { date: 'desc' }
        });

        const total = await prisma.debitNote.count({ where });

        return res.status(200).json({
            success: true,
            data: {
                debitNotes,
                pagination: {
                    total,
                    page: Number(page),
                    pages: Math.ceil(total / Number(limit))
                }
            }
        });

    } catch (error: any) {
        logger.error('Get debit notes error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching debit notes',
            error: error.message
        });
    }
};

// @desc    Get single Debit Note
// @route   GET /api/v1/purchase/debit-notes/:id
// @access  Private
export const getDebitNote = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const debitNote = await prisma.debitNote.findFirst({
            where: {
                id: req.params.id,
                companyId: req.user.companyId
            },
            include: {
                supplier: true,
                bill: true,
                items: {
                    include: { product: true }
                }
            }
        });

        if (!debitNote) {
            return res.status(404).json({
                success: false,
                message: 'Debit Note not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: { debitNote }
        });

    } catch (error: any) {
        logger.error('Get debit note error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching debit note',
            error: error.message
        });
    }
};

// @desc    Create Debit Note (Purchase Return)
// @route   POST /api/v1/purchase/debit-notes
// @access  Private
// Logic: 
// 1. Validate Input
// 2. Debit Note Transaction:
//    - Create DebitNote + Items
//    - Decrease Stock (Goods leaving)
//    - Decrease Supplier Payables (We owe them less) -> Debit Party Account
//    - Post Accounting Entry (Dr Supplier / Cr Purchase Return / Cr GST Input)
export const createDebitNote = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const {
            date,
            supplierId,
            billId, // Optional linked Purchase Bill
            items, // Array of { productId, quantity, rate, taxRate... }
            type = 'RETURN', // Default Purchase Return
            reason,
            notes
        } = req.body;

        const companyId = req.user.companyId;

        // P0: FY Locking Check
        await requireUnlockedPeriod(companyId, new Date(date));

        if (!supplierId || !items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Supplier and Items are required'
            });
        }

        // Calculate Totals
        let subtotal = 0;
        let totalTax = 0;

        const validItems = items.map((item: any) => {
            const qty = Number(item.quantity) || 0;
            const rate = Number(item.rate) || 0;
            const taxRate = Number(item.taxRate) || 0;
            const basic = qty * rate;
            const tax = basic * (taxRate / 100);
            const total = basic + tax;

            subtotal += basic;
            totalTax += tax;

            return {
                ...item,
                taxAmount: tax,
                total: total
            };
        });

        const totalAmount = subtotal + totalTax;

        // Generate Number
        const debitNoteNumber = await sequenceService.getNextNumber(companyId, 'DEBIT_NOTE');

        // TRANSACTION
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Debit Note
            const debitNote = await tx.debitNote.create({
                data: {
                    companyId,
                    debitNoteNumber,
                    date: new Date(date),
                    supplierId,
                    billId: billId || null,
                    type,
                    reason,
                    status: 'ACTIVE',
                    subtotal,
                    totalTax,
                    totalAmount,
                    items: {
                        create: validItems.map((item: any) => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            rate: item.rate,
                            taxRate: item.taxRate,
                            taxAmount: item.taxAmount,
                            total: item.total,
                            reason: item.reason
                        }))
                    }
                },
                include: { items: true }
            });

            // 2. Stock Adjustment (If Type is RETURN)
            // Purchase Return -> Stock OUT (Decrease)
            if (type === 'RETURN') {
                for (const item of validItems) {
                    if (item.productId) {
                        // Decrease Stock
                        await tx.product.update({
                            where: { id: item.productId },
                            data: { currentStock: { decrement: Number(item.quantity) } }
                        });

                        // Log Movement
                        await tx.stockMovement.create({
                            data: {
                                type: 'OUT',
                                quantity: Number(item.quantity),
                                previousStock: 0, // Ideally fetch current, but optimization
                                newStock: 0,
                                productId: item.productId,
                                companyId,
                                reference: debitNoteNumber,
                                reason: 'PURCHASE_RETURN',
                                createdBy: req.user.id
                            }
                        });
                    }
                }
            }

            // 3. Update Supplier Balance
            // Debit Note to Supplier -> We owe less -> Debit Ledger -> Decrease Liability (Credit Balance)
            // Party.currentBalance (if tracking 'Net Payable' as positive) -> Decrement
            // Assuming Party.currentBalance logic: +ve = Receivable, -ve = Payable (Check implementation)
            // Actually, in most systems, Party Balance is just a number. 
            // If typical usage: Customer +ve (Dr), Supplier -ve (Cr). 
            // Debit Note (Dr Supplier) -> Increases the balance (math: -100 (Cr) + 50 (Dr) = -50). 
            // So we INCREMENT the signed balance.
            // OR if we store absolute value and type? 
            // Let's check other controllers. invoiceController decrements for payment. 
            // Invoice (Dr Customer) -> Increments Balance.
            // Payment (Cr Customer) -> Decrements Balance.
            // Purchase Bill (Cr Supplier) -> DECREMENTS balance (makes it more negative)? Or INCREMENTS Payable?
            // Let's stick to: Debit INCREMENTS, Credit DECREMENTS.
            // So Debit Note (Dr Supplier) -> INCREMENT balance.

            // Wait, standard convention:
            // Asset (Customer): Dr (+), Cr (-)
            // Liability (Supplier): Cr (+), Dr (-)
            // If `currentBalance` is a signed float where (+) is Dr and (-) is Cr:
            // Debit Note (Dr) should INCREMENT (add positive amount).

            await tx.party.update({
                where: { id: supplierId },
                data: { currentBalance: { increment: totalAmount } }
            });

            // 4. Update Sequence - Not needed as getNextNumber uses count
            // await sequenceService.incrementSequence(companyId, 'DEBIT_NOTE');

            // P0: Emit event for ledger posting (handled by Accounting domain subscriber)
            await eventBus.emit({
                companyId,
                eventType: EventTypes.DEBIT_NOTE_CREATED,
                aggregateType: 'DebitNote',
                aggregateId: debitNote.id,
                payload: {
                    debitNoteId: debitNote.id,
                    debitNoteNumber: debitNote.debitNoteNumber,
                    date: debitNote.date.toISOString(),
                    supplierId: debitNote.supplierId,
                    subtotal: Number(debitNote.subtotal),
                    taxAmount: Number(debitNote.totalTax),
                    totalAmount: Number(debitNote.totalAmount),
                    type: debitNote.type
                },
                metadata: { userId: req.user.id, source: 'api' }
            }, tx);

            return debitNote;
        });

        return res.status(201).json({
            success: true,
            message: 'Debit Note created successfully',
            data: { debitNote: result }
        });

    } catch (error: any) {
        logger.error('Create debit note error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error creating debit note',
            error: error.message
        });
    }
};

// @desc    Delete Debit Note
// @route   DELETE /api/v1/purchase/debit-notes/:id
// @access  Private
export const deleteDebitNote = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const id = req.params.id;
        const companyId = req.user.companyId;

        await prisma.$transaction(async (tx) => {
            const debitNote = await tx.debitNote.findFirst({
                where: { id, companyId },
                include: { items: true }
            });

            if (!debitNote) throw new Error('Debit Note not found');

            // P0: FY Locking Check
            await requireUnlockedPeriod(companyId, new Date(debitNote.date), 'delete debit note');

            // C1 FIX: Block deletion of non-DRAFT/ACTIVE debit notes
            // Allow deletion of DRAFT and ACTIVE, block CANCELLED etc.
            const DELETABLE_STATUSES = ['DRAFT', 'ACTIVE'];
            if (!DELETABLE_STATUSES.includes(debitNote.status)) {
                throw new Error(`Cannot delete debit note with status '${debitNote.status}'. Only DRAFT or ACTIVE debit notes can be deleted.`);
            }

            // 1. Reverse Stock (If RETURN)

            // Note was OUT, so now IN (Increase)
            if (debitNote.type === 'RETURN') {
                for (const item of debitNote.items) {
                    if (item.productId) {
                        await tx.product.update({
                            where: { id: item.productId },
                            data: { currentStock: { increment: item.quantity } }
                        });

                        // Log Movement (Adjustment)
                        await tx.stockMovement.create({
                            data: {
                                type: 'IN',
                                quantity: item.quantity,
                                previousStock: 0,
                                newStock: 0,
                                productId: item.productId,
                                companyId,
                                reference: debitNote.debitNoteNumber,
                                reason: 'DEBIT_NOTE_CANCEL',
                                createdBy: req.user.id
                            }
                        });
                    }
                }
            }

            // 2. Reverse Balance Update
            // Was Dr (Increment), so now Cr (Decrement)
            await tx.party.update({
                where: { id: debitNote.supplierId },
                data: { currentBalance: { decrement: Number(debitNote.totalAmount) } }
            });

            // 3. Delete Accounting Vouchers
            await tx.voucher.deleteMany({
                where: {
                    referenceId: id,
                    referenceType: 'DEBIT_NOTE',
                    companyId
                }
            });

            // 4. Delete Record
            await tx.debitNote.delete({ where: { id } });
        });

        return res.status(200).json({
            success: true,
            message: 'Debit Note deleted successfully'
        });

    } catch (error: any) {
        logger.error('Delete debit note error:', error);

        if (error.message && error.message.includes('Cannot delete debit note')) {
            return res.status(400).json({
                success: false,
                message: error.message,
                code: 'DEBIT_NOTE_STATUS_LOCKED'
            });
        }

        return res.status(500).json({
            success: false,
            message: error.message || 'Error deleting debit note'
        });
    }
};

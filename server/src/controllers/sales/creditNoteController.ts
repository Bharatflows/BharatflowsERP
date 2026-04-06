
import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import prisma from '../../config/prisma';
import logger from '../../config/logger';
import { getNextNumber, decrementSequence } from '../../services/sequenceService';
import { requireUnlockedPeriod } from '../../services/periodLockService';
// P0: postCreditNote removed - ledger posting handled by Accounting domain via event subscription
import { eventBus, EventTypes } from '../../services/eventBus';

// @desc    Get all credit notes
// @route   GET /api/v1/sales/credit-notes
// @access  Private
export const getCreditNotes = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const creditNotes = await prisma.creditNote.findMany({
            where: { companyId: req.user.companyId },
            include: { customer: true, invoice: true },
            orderBy: { createdAt: 'desc' }
        });

        return res.status(200).json({
            success: true,
            data: { creditNotes }
        });
    } catch (error: any) {
        logger.error('Get credit notes error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching credit notes',
            error: error.message
        });
    }
};

// @desc    Get single credit note
// @route   GET /api/v1/sales/credit-notes/:id
// @access  Private
export const getCreditNote = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { id } = req.params;

        const creditNote = await prisma.creditNote.findUnique({
            where: { id , companyId: req.user.companyId },
            include: {
                customer: true,
                invoice: true,
                items: {
                    include: { product: true }
                }
            }
        });

        if (!creditNote || creditNote.companyId !== req.user.companyId) {
            return res.status(404).json({
                success: false,
                message: 'Credit note not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: { creditNote }
        });
    } catch (error: any) {
        logger.error('Get credit note error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching credit note',
            error: error.message
        });
    }
};

// @desc    Create credit note
// @route   POST /api/v1/sales/credit-notes
// @access  Private
export const createCreditNote = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { customerId, invoiceId, date, reason, items, type } = req.body;

        // P0: FY Locking Check
        await requireUnlockedPeriod(req.user.companyId, new Date(date));

        const creditNoteNumber = await getNextNumber(req.user.companyId, 'CREDIT_NOTE');

        let subtotal = 0;
        let totalTax = 0;

        const creditNoteItems = items.map((item: any) => {
            const total = Number(item.quantity) * Number(item.rate);
            const tax = total * (Number(item.taxRate) / 100);

            subtotal += total;
            totalTax += tax;

            return {
                productId: item.productId,
                quantity: Number(item.quantity),
                rate: Number(item.rate),
                taxRate: Number(item.taxRate),
                taxAmount: tax,
                total: total + tax,
                reason: item.reason || reason
            };
        });

        const totalAmount = subtotal + totalTax;

        const result = await prisma.$transaction(async (tx) => {
            const creditNote = await tx.creditNote.create({
                data: {
                    companyId: req.user.companyId,
                    creditNoteNumber,
                    date: new Date(date),
                    customerId,
                    invoiceId: invoiceId || null,
                    reason,
                    type: type || 'RETURN',
                    subtotal,
                    totalTax,
                    totalAmount,
                    status: 'ISSUED', // Financial CNs are usually immediate
                    items: {
                        create: creditNoteItems
                    }
                },
                include: { customer: true }
            });

            // Handle Stock Return if Type is RETURN
            if (type === 'RETURN') {
                for (const item of items) {
                    if (item.productId) {
                        const product = await tx.product.findUnique({
                            where: { id: item.productId },
                            select: { currentStock: true, trackInventory: true }
                        });

                        if (product && product.trackInventory) {
                            await tx.product.update({
                                where: { id: item.productId },
                                data: { currentStock: { increment: Number(item.quantity) } }
                            });

                            await tx.stockMovement.create({
                                data: {
                                    companyId: req.user.companyId,
                                    productId: item.productId,
                                    type: 'SALES_RETURN',
                                    quantity: Number(item.quantity),
                                    previousStock: product.currentStock,
                                    newStock: product.currentStock + Number(item.quantity),
                                    reference: creditNoteNumber,
                                    reason: reason || 'Sales Return',
                                    createdBy: req.user.id
                                }
                            });
                        }
                    }
                }
            }

            // Update Customer Balance (Decrement - Credit Note reduces balance)
            await tx.party.update({
                where: { id: customerId },
                data: {
                    currentBalance: { decrement: totalAmount }
                }
            });

            // P0: Emit domain event for ledger posting (handled by Accounting domain subscriber)
            await eventBus.emit({
                companyId: req.user.companyId,
                eventType: EventTypes.CREDIT_NOTE_CREATED,
                aggregateType: 'CreditNote',
                aggregateId: creditNote.id,
                payload: {
                    creditNoteId: creditNote.id,
                    creditNoteNumber: creditNote.creditNoteNumber,
                    date: creditNote.date.toISOString(),
                    customerId: creditNote.customerId,
                    subtotal: Number(creditNote.subtotal),
                    totalTax: Number(creditNote.totalTax),
                    totalAmount: Number(creditNote.totalAmount)
                },
                metadata: { userId: req.user.id, source: 'api' }
            }, tx);

            return creditNote;
        });

        return res.status(201).json({
            success: true,
            message: 'Credit note created successfully',
            data: { creditNote: result }
        });
    } catch (error: any) {
        logger.error('Create credit note error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error creating credit note',
            error: error.message
        });
    }
};

// @desc    Delete credit note
// @route   DELETE /api/v1/sales/credit-notes/:id
// @access  Private
export const deleteCreditNote = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { id } = req.params;

        const creditNote = await prisma.creditNote.findUnique({
            where: { id , companyId: req.user.companyId },
            include: { items: true }
        });

        if (!creditNote || creditNote.companyId !== req.user.companyId) {
            return res.status(404).json({
                success: false,
                message: 'Credit note not found'
            });
        }

        // P0: FY Locking Check - Block deletion if original date is in locked period
        await requireUnlockedPeriod(req.user.companyId, new Date(creditNote.date), 'delete credit note');

        // C1 FIX: Block deletion of non-DRAFT credit notes
        if (creditNote.status !== 'DRAFT') {
            return res.status(400).json({
                success: false,
                message: `Cannot delete credit note with status '${creditNote.status}'. Only DRAFT credit notes can be deleted.`,
                code: 'CREDIT_NOTE_STATUS_LOCKED'
            });
        }

        await prisma.$transaction(async (tx) => {

            // 1. Revert Stock (If RETURN, we added stock, now we must remove it? Or just void?)
            // If we delete the Credit Note, it means the return never happened.
            // So we must DECREMENT stock (take it back).
            if (creditNote.type === 'RETURN') {
                for (const item of creditNote.items) {
                    if (item.productId) {
                        const product = await tx.product.findUnique({
                            where: { id: item.productId },
                            select: { currentStock: true, trackInventory: true }
                        });

                        if (product && product.trackInventory) {
                            await tx.product.update({
                                where: { id: item.productId },
                                data: { currentStock: { decrement: item.quantity } }
                            });

                            // Log reversal
                            await tx.stockMovement.create({
                                data: {
                                    companyId: req.user.companyId,
                                    productId: item.productId,
                                    type: 'ADJUSTMENT',
                                    quantity: -item.quantity,
                                    previousStock: product.currentStock,
                                    newStock: product.currentStock - item.quantity,
                                    reference: creditNote.creditNoteNumber,
                                    reason: 'Delete Credit Note Reversal',
                                    createdBy: req.user.id
                                }
                            });
                        }
                    }
                }
            }

            // 2. Revert Customer Balance (Increment - we reduced it, now add it back)
            await tx.party.update({
                where: { id: creditNote.customerId },
                data: { currentBalance: { increment: Number(creditNote.totalAmount) } }
            });

            // 3. Delete Credit Note
            await tx.creditNote.delete({ where: { id } });

            // 4. Ledger - Reversal Voucher needed or just Delete? 
            // We'll delete associated voucher manually if needed or cascading if relation exists.
            // Voucher has NO direct relation in DB schema to CreditNote (referenceId loose link).
            // Trigger manual delete of voucher.
            await tx.voucher.deleteMany({
                where: {
                    companyId: req.user.companyId,
                    referenceId: id,
                    referenceType: 'CREDIT_NOTE'
                }
            });
        });

        await decrementSequence(req.user.companyId, 'CREDIT_NOTE');

        return res.status(200).json({
            success: true,
            message: 'Credit note deleted successfully'
        });
    } catch (error: any) {
        logger.error('Delete credit note error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error deleting credit note',
            error: error.message
        });
    }
};

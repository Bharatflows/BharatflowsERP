import { Response } from 'express';
import prisma from '../../config/prisma';
import logger from '../../config/logger';
import { AuthRequest } from '../../middleware/auth';
import { getNextNumber } from '../../services/sequenceService';
import { BankingIntegrationService } from '../../services/bankingIntegrationService';
import { statusEngine } from '../../services/status/statusEngine';
import { InvoiceStatus } from '../../types/enums';
import eventBus, { EventTypes } from '../../services/eventBus';
import { postPayment } from '../../services/postingService';

// @desc    Create Receipt & Allocate to Invoices
// @route   POST /api/v1/sales/receipts
// @access  Private
export const createReceipt = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { customerId, amount, paymentDate, paymentMethod, reference, notes, autoAllocate = true, bankAccountId } = req.body;
        const companyId = req.user.companyId;

        if (!customerId || !amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid amount and customer are required'
            });
        }

        // 1. Fetch Customer to ensure valid
        const customer = await prisma.party.findUnique({
            where: { id: customerId , companyId: req.user.companyId },
        });

        if (!customer || customer.companyId !== companyId) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        // 2. Prepare Receipt Data
        const receiptNumber = await getNextNumber(companyId, 'RECEIPT');
        const receiptDate = new Date(paymentDate || new Date());
        let unusedAmount = Number(amount);

        // 3. Ledger Logic (One entry for the full amount)
        // Dr Bank/Cash, Cr Party (Debtor)
        // We create the voucher later in transaction

        // 4. Allocation Logic (Oldest-First)
        const allocations: any[] = [];

        if (autoAllocate) {
            // Fetch unpaid invoices: Overdue first (dueDate), then Oldest (createdAt)
            const unpaidInvoices = await prisma.invoice.findMany({
                where: {
                    companyId,
                    customerId,
                    status: { in: ['SENT', 'PARTIAL', 'OVERDUE'] }, // Exclude DRAFT, PAID, CANCELLED
                    deletedAt: null
                },
                orderBy: [
                    { dueDate: 'asc' },   // Priority 1: Due Date (Overdue first)
                    { createdAt: 'asc' }  // Priority 2: Creation Date (Oldest first)
                ]
            });

            for (const invoice of unpaidInvoices) {
                if (unusedAmount <= 0) break;

                const pendingAmount = Number(invoice.totalAmount) - Number(invoice.amountPaid);

                // Safety check: ignore fully paid if status check failed
                if (pendingAmount <= 0.01) continue;

                const allocateAmount = Math.min(pendingAmount, unusedAmount);

                allocations.push({
                    invoice,
                    allocateAmount
                });

                unusedAmount -= allocateAmount;
            }
        }

        // 5. Execute Transaction
        const result = await prisma.$transaction(async (tx) => {
            // A. Create Receipt
            const receipt = await tx.receipt.create({
                data: {
                    companyId,
                    customerId,
                    receiptNumber,
                    date: receiptDate,
                    amount: Number(amount),
                    unusedAmount: unusedAmount,
                    paymentMethod,
                    reference,
                    notes,
                    status: 'COMPLETED'
                }
            });

            // B. Create Allocations & Update Invoices
            const createdAllocations: any[] = [];
            for (const alloc of allocations) {
                // Create Allocation Record
                const allocation = await tx.receiptAllocation.create({
                    data: {
                        receiptId: receipt.id,
                        invoiceId: alloc.invoice.id,
                        amount: alloc.allocateAmount,
                        date: receiptDate
                    }
                });
                createdAllocations.push(allocation);

                // Update Invoice
                const newPaid = Number(alloc.invoice.amountPaid) + alloc.allocateAmount;
                const newBalance = Number(alloc.invoice.totalAmount) - newPaid;

                const newStatus = statusEngine.deriveStatus('SALES', {
                    status: alloc.invoice.status,
                    totalAmount: Number(alloc.invoice.totalAmount),
                    amountPaid: newPaid,
                    balanceAmount: newBalance,
                    dueDate: alloc.invoice.dueDate
                });

                if (newStatus !== alloc.invoice.status) {
                    await tx.statusTransitionLog.create({
                        data: {
                            companyId,
                            entityType: 'INVOICE',
                            entityId: alloc.invoice.id,
                            oldStatus: alloc.invoice.status,
                            newStatus,
                            triggeredBy: 'SYSTEM',
                            userId: req.user.id,
                            reason: `Payment Allocation: ${receipt.receiptNumber}`
                        }
                    });
                }

                await tx.invoice.update({
                    where: { id: alloc.invoice.id },
                    data: {
                        amountPaid: newPaid,
                        balanceAmount: newBalance,
                        status: newStatus as InvoiceStatus
                    }
                });
            }

            // C. Update Customer Balance (Credit operation)
            await tx.party.update({
                where: { id: customerId },
                data: {
                    currentBalance: {
                        decrement: Number(amount)
                    }
                }
            });

            // ATOMIC LEDGER POSTING
            await postPayment({
                id: receipt.id,
                companyId,
                partyId: customerId,
                amount: Number(amount),
                date: receiptDate,
                mode: paymentMethod,
                type: 'RECEIVED'
            }, tx);

            // P0: Emit Domain Event (Audit only now for ledger)
            // Event: PAYMENT_RECEIVED
            await eventBus.emit({
                companyId,
                eventType: EventTypes.PAYMENT_RECEIVED,
                aggregateType: 'Payment',
                aggregateId: receipt.id,
                payload: {
                    paymentId: receipt.id,
                    receiptNumber: receipt.receiptNumber,
                    partyId: customerId,
                    amount: Number(amount),
                    date: receipt.date.toISOString(),
                    mode: paymentMethod,
                    type: 'RECEIVED',
                    // Pass allocations for detailed ledger if needed, but for MVP total amount is key
                    allocations: allocations
                },
                metadata: {
                    userId: req.user.id,
                    source: 'api'
                }
            }, tx);

            // E. Bank Integration
            if (bankAccountId) {
                await BankingIntegrationService.recordInternalTransaction(
                    companyId,
                    bankAccountId,
                    Number(amount),
                    'credit',
                    receiptDate,
                    `Payment from ${customer.name}`,
                    receiptNumber,
                    'Sales',
                    tx
                );
            }

            return { receipt, allocations: createdAllocations };
        });

        logger.info(`Receipt created: ${receiptNumber} for ${amount} (Allocated: ${amount - unusedAmount})`);

        return res.status(201).json({
            success: true,
            message: 'Receipt created successfully',
            data: result
        });

    } catch (error: any) {
        logger.error('Create receipt error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error creating receipt',
            error: error.message
        });
    }
};

// @desc    Get All Receipts
export const getReceipts = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const receipts = await prisma.receipt.findMany({
            where: { companyId: req.user.companyId },
            include: { customer: true },
            orderBy: { date: 'desc' }
        });

        return res.json({ success: true, data: receipts });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

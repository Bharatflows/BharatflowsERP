import { Response } from 'express';
// Force TS update
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import { getNextNumber } from '../services/sequenceService';
import eventBus, { EventTypes } from '../services/eventBus';  // P0: Domain events
import logger from '../config/logger';

// POS SESSIONS

export const openSession = async (req: AuthRequest, res: Response) => {
    try {
        const { openingCash } = req.body;
        const companyId = req.user!.companyId;
        const userId = req.user!.id;

        // Check if user already has an active session
        const activeSession = await prisma.pOSSession.findFirst({
            where: { userId, status: 'OPEN', companyId }
        });

        if (activeSession) {
            res.status(400).json({ success: false, message: 'User already has an open session' });
            return;
        }

        const session = await prisma.pOSSession.create({
            data: {
                openingCash: Number(openingCash),
                userId,
                companyId,
                status: 'OPEN',
                startTime: new Date()
            }
        });

        res.status(201).json({ success: true, data: session });
    } catch (error: any) {
        logger.error('Open POS session error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const closeSession = async (req: AuthRequest, res: Response) => {
    try {
        const { sessionId, closingCash } = req.body;
        const companyId = req.user!.companyId;

        const session = await prisma.pOSSession.findFirst({
            where: { id: sessionId, companyId }
        });

        if (!session || session.status === 'CLOSED') {
            res.status(404).json({ success: false, message: 'Active session not found' });
            return;
        }

        const updatedSession = await prisma.pOSSession.update({
            where: { id: sessionId , companyId: req.user.companyId },
            data: {
                status: 'CLOSED',
                endTime: new Date(),
                closingCash: Number(closingCash)
            }
        });

        res.json({ success: true, data: updatedSession });
    } catch (error: any) {
        logger.error('Close POS session error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// POS ORDERS (Simplified for speed)

export const createPOSOrder = async (req: AuthRequest, res: Response) => {
    try {
        const { sessionId, items, paymentMode, totalAmount } = req.body; // paymentMode: CASH, CARD, UPI
        const companyId = req.user!.companyId;
        const userId = req.user!.id;

        // 1. Verify Session
        const session = await prisma.pOSSession.findUnique({ where: { id: sessionId , companyId: req.user.companyId } });
        if (!session || session.status !== 'OPEN') {
            res.status(400).json({ success: false, message: 'Session is closed or invalid' });
            return;
        }

        // 2. Get/Create Walk-in Party
        let customer = await prisma.party.findFirst({
            where: { companyId, name: 'Walk-in Customer' }
        });

        if (!customer) {
            customer = await prisma.party.create({
                data: {
                    companyId,
                    name: 'Walk-in Customer',
                    type: 'CUSTOMER',
                    phone: '0000000000',
                    email: 'walkin@pos.com', // Placeholder
                    billingAddress: 'Counter Sale',
                    gstin: undefined,
                    currentBalance: 0
                }
            });
        }

        // 3. Generate Numbers
        const orderNumber = `POS-${Date.now()}`;
        const invoiceNumber = await getNextNumber(companyId, 'INVOICE');

        // 4. Calculate Totals & Transform Items
        let subtotal = 0;
        let totalTax = 0;

        const invoiceItems = items.map((item: any) => {
            const qty = Number(item.quantity);
            const rate = Number(item.price || item.rate); // Support both
            const taxRate = Number(item.taxRate || 0); // Default 0 if missing

            const total = qty * rate;
            const tax = total * (taxRate / 100);

            subtotal += total;
            totalTax += tax;

            return {
                productId: item.productId,
                productName: item.productName || 'POS Item',
                quantity: qty,
                rate,
                taxRate,
                taxAmount: tax,
                total: total + tax,
                batchId: item.batchId // Optional
            };
        });

        // Re-calculate total to be safe, or use frontend total if we trust it (better to calc)
        const calculatedTotal = subtotal + totalTax;

        // 5. Transaction: Create Invoice + Stock + POSOrder
        const result = await prisma.$transaction(async (tx) => {
            // A. Create Invoice (Marked as PAID/SENT)
            const invoice = await tx.invoice.create({
                data: {
                    companyId,
                    userId,
                    customerId: customer!.id,
                    invoiceNumber,
                    invoiceDate: new Date(),
                    dueDate: new Date(),
                    status: 'PAID', // POS is immediate payment
                    notes: `POS Order: ${orderNumber}`,
                    subtotal,
                    totalTax,
                    totalAmount: calculatedTotal,
                    amountPaid: calculatedTotal, // Fully paid
                    balanceAmount: 0,
                    items: {
                        create: invoiceItems
                    }
                },
                include: { items: true }
            });

            // B. Deduct Stock
            for (const item of items) {
                if (item.productId) {
                    const product = await tx.product.findUnique({
                        where: { id: item.productId },
                        select: { currentStock: true, trackInventory: true }
                    });

                    if (product && product.trackInventory) {
                        const qty = Number(item.quantity);
                        await tx.product.update({
                            where: { id: item.productId },
                            data: { currentStock: { decrement: qty } }
                        });

                        await tx.stockMovement.create({
                            data: {
                                companyId,
                                productId: item.productId,
                                type: 'SALE',
                                quantity: -qty,
                                previousStock: product.currentStock,
                                newStock: product.currentStock - qty,
                                reference: invoiceNumber, // Reference Invoice
                                reason: `POS Sale: ${orderNumber}`,
                                createdBy: userId
                            }
                        });
                    }
                }
            }

            // C. Create POSOrder
            const posOrder = await tx.pOSOrder.create({
                data: {
                    orderNumber,
                    total: calculatedTotal,
                    paymentMode,
                    sessionId,
                    // Store invoice ID in session? No relation exists.
                    // We rely on 'notes' in Invoice or just time matching.
                }
            });

            // D. Update Customer Balance? 
            // Since it's PAID immediately:
            // 1. Invoice creation -> Debit Customer (+Total)
            // 2. Payment -> Credit Customer (-Total)
            // Net change = 0.
            // But we must record it for history.
            await tx.party.update({
                where: { id: customer!.id },
                data: {
                    currentBalance: { increment: calculatedTotal }
                }
            });
            // Immediately pay off
            await tx.party.update({
                where: { id: customer!.id },
                data: {
                    currentBalance: { decrement: calculatedTotal }
                }
            });

            // E. Update Session Cash if CASH payment
            if (paymentMode === 'CASH') {
                // POSSession doesn't have a 'currentCash' field tracking running total?
                // It only has 'closingCash' which is set at close.
                // We don't update session here unless we want to track 'expectedCash'.
                // Schema has only opening/closing.
            }

            return { invoice, posOrder };
        });

        // 6. P0: Emit domain events for ledger posting
        try {
            // A. Emit Invoice Created event
            await eventBus.emit({
                companyId,
                eventType: EventTypes.INVOICE_CREATED,
                aggregateType: 'Invoice',
                aggregateId: result.invoice.id,
                payload: {
                    invoiceId: result.invoice.id,
                    invoiceNumber: result.invoice.invoiceNumber,
                    invoiceDate: result.invoice.invoiceDate.toISOString(),
                    customerId: result.invoice.customerId,
                    subtotal: Number(result.invoice.subtotal),
                    totalTax: Number(result.invoice.totalTax),
                    totalAmount: Number(result.invoice.totalAmount)
                },
                metadata: { userId, source: 'api' }
            });

            // B. Emit Payment Received event
            await eventBus.emit({
                companyId,
                eventType: EventTypes.PAYMENT_RECEIVED,
                aggregateType: 'Payment',
                aggregateId: result.posOrder.id,
                payload: {
                    partyId: result.invoice.customerId,
                    amount: Number(result.invoice.totalAmount),
                    mode: paymentMode === 'CASH' ? 'CASH' : 'BANK',
                    invoiceId: result.invoice.id
                },
                metadata: { userId, source: 'api' }
            });
        } catch (eventError) {
            logger.warn(`Failed to emit events for POS ${orderNumber}`, eventError);
        }

        res.status(201).json({
            success: true,
            data: result.posOrder,
            invoice: result.invoice
        });
    } catch (error: any) {
        logger.error('Create POS order error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

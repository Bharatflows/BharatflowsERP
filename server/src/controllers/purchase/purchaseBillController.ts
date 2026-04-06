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
import { gstRuleService } from '../../services/gstRuleService';
import { Decimal } from '@prisma/client/runtime/library';
import eventBus, { EventTypes } from '../../services/eventBus';  // P0: Domain events
import logger from '../../config/logger';  // C2: For stock logging
import { statusEngine } from '../../services/status/statusEngine';
import { requireUnlockedPeriod } from '../../services/periodLockService';
// P0: postingService removed - ledger posting handled by Accounting domain via event subscription
// import { postPurchaseBill, updatePurchaseBill as updatePurchaseBillLedger } from '../../services/postingService';

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
        logger.error('Error fetching purchase bills:', error);
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
        logger.error('Error fetching purchase bill:', error);
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
            balanceAmount,
            discountAmount,
            roundOff,
            supplierInvoiceNumber
        } = req.body;

        const companyId = req.user?.companyId;

        // Phase 8: Check period lock before creating purchase bill
        await requireUnlockedPeriod(
            companyId!,
            new Date(billDate),
            'purchase bill creation'
        );

        const billNumber = await getNextNumber(companyId!, 'PURCHASE_BILL');

        // Fetch Company and Supplier details for Tax Calculation
        const [company, supplier] = await Promise.all([
            prisma.company.findUnique({
                where: { id: companyId! },
                select: { state: true }
            }),
            prisma.party.findUnique({
                where: { id: supplierId , companyId: req.user.companyId },
                select: { billingAddress: true, gstin: true }
            })
        ]);

        const companyState = company?.state || '';
        const supplierState = (supplier?.billingAddress as any)?.state || ''; // Fallback needs handling

        // Calculate Taxes using Rule Engine
        // For Purchase: Origin = Supplier State, Destination = Company State
        const calculatedItems: any[] = [];
        let calcSubtotal = new Decimal(0);
        let totalCGST = new Decimal(0);
        let totalSGST = new Decimal(0);
        let totalIGST = new Decimal(0);
        let totalCess = new Decimal(0);
        let calcTotalTax = new Decimal(0);

        for (const item of items) {
            const quantity = new Decimal(item.quantity || 0);
            const rate = new Decimal(item.rate || 0);
            const taxRate = new Decimal(item.taxRate || 0);
            const cessRate = new Decimal(item.cessRate || 0);
            const taxableValue = quantity.mul(rate);

            const taxResult = gstRuleService.calculateLineItem({
                taxableValue: taxableValue,
                gstRate: taxRate,
                placeOfSupplyState: companyState, // Destination (Our Company)
                companyState: supplierState,      // Origin (Supplier)
                cessRate: cessRate
            });

            calcSubtotal = calcSubtotal.add(taxResult.taxableValue);
            totalCGST = totalCGST.add(taxResult.cgst);
            totalSGST = totalSGST.add(taxResult.sgst);
            totalIGST = totalIGST.add(taxResult.igst);
            totalCess = totalCess.add(taxResult.cess);
            calcTotalTax = calcTotalTax.add(taxResult.taxAmount);

            calculatedItems.push({
                productId: item.productId,
                productName: item.productName || 'Unknown Product',
                quantity: Number(quantity),
                rate: Number(rate),
                taxRate: Number(taxRate),
                taxAmount: taxResult.taxAmount,
                cgst: taxResult.cgst,
                sgst: taxResult.sgst,
                igst: taxResult.igst,
                cess: taxResult.cess,
                totalAmount: taxResult.totalAmount,
                batchId: item.batchId
            });
        }

        const calcTotalAmount = calcSubtotal.add(calcTotalTax);

        // C2 FIX: Wrap creation in transaction with atomic stock increment
        const bill = await prisma.$transaction(async (tx) => {
            const createdBill = await tx.purchaseBill.create({
                data: {
                    companyId: companyId!,
                    supplierId,
                    billNumber,
                    supplierInvoiceNumber,
                    billDate: new Date(billDate),
                    dueDate: dueDate ? new Date(dueDate) : null,
                    notes,
                    subtotal: new Decimal(calcSubtotal),
                    totalTax: new Decimal(calcTotalTax),
                    totalAmount: new Decimal(calcTotalAmount),
                    discountAmount: new Decimal(discountAmount || 0),
                    roundOff: new Decimal(roundOff || 0),
                    amountPaid: new Decimal(amountPaid || 0),
                    balanceAmount: new Decimal(calcTotalAmount), // Assuming unpaid initially
                    status: 'OPEN',

                    // GST Compliance
                    placeOfSupply: companyState,
                    isInterState: supplierState !== companyState,
                    cgst: new Decimal(totalCGST),
                    sgst: new Decimal(totalSGST),
                    igst: new Decimal(totalIGST),

                    items: {
                        create: calculatedItems.map((item: any) => ({
                            productId: item.productId || null,
                            productName: item.productName || 'Unknown Product',
                            quantity: Number(item.quantity) || 0,
                            rate: new Decimal(item.rate) || 0,
                            taxRate: new Decimal(item.taxRate || 0),
                            taxAmount: new Decimal(item.totalTax || 0),
                            cgst: new Decimal(item.cgst || 0),
                            sgst: new Decimal(item.sgst || 0),
                            igst: new Decimal(item.igst || 0),
                            total: new Decimal(item.totalAmount || 0),
                            // Batch ID optional
                            batchId: item.batchId
                        }))
                    }
                },
                include: {
                    items: true
                }
            });

            // C2 FIX: Atomic stock increment within same transaction
            // CHECK: If skipStockUpdate is true (e.g. Bill from GRN), skip this step
            if (!req.body.skipStockUpdate) {
                for (const item of items) {
                    if (!item.productId) continue;

                    const product = await tx.product.findUnique({
                        where: { id: item.productId },
                        select: { id: true, name: true, currentStock: true, trackInventory: true }
                    });

                    if (product && product.trackInventory) {
                        const previousStock = product.currentStock;
                        const quantity = Number(item.quantity) || 0;
                        const newStock = previousStock + quantity;

                        // Increment product stock
                        await tx.product.update({
                            where: { id: item.productId },
                            data: { currentStock: newStock }
                        });

                        // Log stock movement
                        await tx.stockMovement.create({
                            data: {
                                companyId: companyId!,
                                productId: item.productId,
                                type: 'PURCHASE',
                                quantity: quantity,
                                previousStock,
                                newStock,
                                reference: billNumber,
                                reason: `Purchase Bill: ${billNumber}`,
                                createdBy: req.user?.id || 'system'
                            }
                        });

                        logger.info(`[C2] Atomic stock increment: ${quantity} to ${product.name} (New: ${newStock})`);
                    }
                }
            }

            // C3 FIX: Atomic Ledger Posting - REMOVED (Handled by Event Bus)
            // Enforce 1.2 "Atomic stock + ledger + document write" - via Event Bus now
            // await postPurchaseBill({...}, tx);

            // P0: Emit domain event for ledger postings (Transactional)
            await eventBus.emit({
                companyId: companyId!,
                eventType: EventTypes.PURCHASE_BILL_CREATED,
                aggregateType: 'PurchaseBill',
                aggregateId: createdBill.id,
                payload: {
                    billId: createdBill.id,
                    billNumber: billNumber,
                    billDate: createdBill.billDate.toISOString(),
                    supplierId: createdBill.supplierId,
                    subtotal: Number(createdBill.subtotal),
                    taxAmount: Number(createdBill.totalTax),
                    totalAmount: Number(createdBill.totalAmount)
                },
                metadata: {
                    userId: req.user?.id || 'system',
                    source: 'api'
                }
            }, tx);

            return createdBill;
        });

        res.status(201).json({
            success: true,
            data: bill
        });
    } catch (error) {
        logger.error('Error creating purchase bill:', error);
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
            status,
            supplierInvoiceNumber
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

        // C1 FIX: Block updates on bills with recorded payments
        const hasPayments = Number(existingBill.amountPaid || 0) > 0;
        if (hasPayments) {
            res.status(400).json({
                success: false,
                message: 'Cannot modify purchase bill with recorded payments. Create a Debit Note instead.',
                code: 'BILL_HAS_PAYMENTS'
            });
            return;
        }

        // C1 FIX: Block updates on finalized bills (status-based locking via StatusEngine)
        if (statusEngine.isLocked('PURCHASE', existingBill)) {
            res.status(400).json({
                success: false,
                message: `Cannot edit purchase bill with status: ${existingBill.status}. The bill is locked.`,
                code: 'BILL_STATUS_LOCKED'
            });
            return;
        }

        const updatedBill = await prisma.$transaction(async (tx) => {
            await tx.purchaseBillItem.deleteMany({
                where: { billId }
            });

            const result = await tx.purchaseBill.update({
                where: { id: billId },
                data: {
                    supplierId,
                    supplierInvoiceNumber,
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

            // Atomic Ledger Update - REMOVED (Handled by Event Bus)
            // await updatePurchaseBillLedger({...}, tx);

            return result;
        });



        // P0: Emit domain event for ledger updates
        try {
            const eventType = updatedBill.status === 'CANCELLED'
                ? EventTypes.PURCHASE_BILL_CANCELLED
                : EventTypes.PURCHASE_BILL_UPDATED;

            await eventBus.emit({
                companyId: companyId!,
                eventType,
                aggregateType: 'PurchaseBill',
                aggregateId: updatedBill.id,
                payload: {
                    billId: updatedBill.id,
                    billNumber: updatedBill.billNumber,
                    billDate: updatedBill.billDate.toISOString(),
                    supplierId: updatedBill.supplierId,
                    subtotal: Number(updatedBill.subtotal),
                    taxAmount: Number(updatedBill.totalTax),
                    totalAmount: Number(updatedBill.totalAmount),
                    items: updatedBill.items // Pass items for inventory logic
                },
                metadata: {
                    userId: req.user?.id || 'system',
                    source: 'api'
                }
            });
        } catch (error) {
            logger.error('Error emitting purchase bill update event:', error);
        }

        res.json({
            success: true,
            data: updatedBill
        });
    } catch (error) {
        logger.error('Error updating purchase bill:', error);
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

        // C1 FIX: Block deletion of bills with recorded payments
        const hasPayments = Number(bill.amountPaid || 0) > 0;
        if (hasPayments) {
            res.status(400).json({
                success: false,
                message: 'Cannot delete purchase bill with recorded payments. Create a Debit Note instead.'
            });
            return;
        }

        // C1 FIX: Block deletion of non-DRAFT bills
        if (bill.status !== 'DRAFT' && bill.status !== 'CANCELLED') {
            res.status(400).json({
                success: false,
                message: `Cannot delete purchase bill with status '${bill.status}'. Only DRAFT or CANCELLED bills can be deleted.`
            });
            return;
        }

        await prisma.purchaseBill.delete({
            where: { id: req.params.id , companyId: req.user.companyId }
        });

        // Decrement the sequence number to reuse the freed number
        await decrementSequence(req.user!.companyId!, 'PURCHASE_BILL');

        // P0: Emit domain event for cancellation/deletion
        try {
            await eventBus.emit({
                companyId: req.user!.companyId!,
                eventType: EventTypes.PURCHASE_BILL_CANCELLED,
                aggregateType: 'PurchaseBill',
                aggregateId: req.params.id,
                payload: {
                    billId: req.params.id
                },
                metadata: {
                    userId: req.user?.id || 'system',
                    source: 'api'
                }
            });
        } catch (error) {
            logger.error('Error emitting purchase bill deletion event:', error);
        }

        res.json({
            success: true,
            data: {}
        });
    } catch (error) {
        logger.error('Error deleting purchase bill:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

/**
 * Invoice Controller
 * 
 * Handles core invoice CRUD operations.
 * Split from salesController.ts for better maintainability.
 * Fixed syntax errors and duplicates.
 */

import { Response } from 'express';
import prisma from '../../config/prisma';
import logger from '../../config/logger';
import { AuthRequest } from '../../middleware/auth';
import { getNextNumber, decrementSequence } from '../../services/sequenceService';
import eventBus, { EventTypes } from '../../services/eventBus';  // P0-5: Domain events
import { AuditService } from '../../services/auditService';
import { statusEngine } from '../../services/status/statusEngine';
// Type definition for SQLite (no enum)
type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'PARTIAL' | 'OVERDUE' | 'CANCELLED' | 'PENDING_APPROVAL';
import { INVOICE_STATUS } from '../../constants/statuses';
import { requireUnlockedPeriod } from '../../services/periodLockService';
import stockValidationService from '../../services/stockValidationService';
import { TaxValidationService } from '../../services/taxValidationService';
import { postSalesInvoice, updateSalesInvoice } from '../../services/postingService';


// @desc    Get all invoices
// @route   GET /api/v1/sales/invoices
// @access  Private
export const getInvoices = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { page = 1, limit = 10, status, search } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const where: any = {
            companyId: req.user.companyId,
            deletedAt: null // Exclude soft-deleted invoices
        };

        if (status) {
            where.status = status.toString().toUpperCase();
        }

        if (search) {
            where.OR = [
                { invoiceNumber: { contains: search as string } },
            ];
        }

        const [invoices, total] = await Promise.all([
            prisma.invoice.findMany({
                where,
                include: {
                    customer: true,
                    items: true,
                    eInvoice: true,
                    eWaybill: true
                },
                orderBy: { invoiceDate: 'desc' },
                skip,
                take: Number(limit)
            }),
            prisma.invoice.count({ where })
        ]);

        return res.status(200).json({
            success: true,
            data: {
                invoices,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
                }
            }
        });
    } catch (error: any) {
        logger.error('Get invoices error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching invoices',
            error: error.message
        });
    }
};

// @desc    Get single invoice
// @route   GET /api/v1/sales/invoices/:id
// @access  Private
export const getInvoice = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const invoice = await prisma.invoice.findUnique({
            where: {
                id: req.params.id
                , companyId: req.user.companyId
            },
            include: {
                customer: true,
                items: {
                    include: {
                        product: true
                    }
                },
                eInvoice: true,
                eWaybill: true
            }
        });

        if (!invoice || invoice.companyId !== req.user.companyId) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: { invoice }
        });
    } catch (error: any) {
        logger.error('Get invoice error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching invoice',
            error: error.message
        });
    }
};

// @desc    Create invoice
// @route   POST /api/v1/sales/invoices
import { gstRuleService } from '../../services/gstRuleService';
import { approvalService } from '../../services/approvalService';
import { Decimal } from '@prisma/client/runtime/library';

// @access  Private
export const createInvoice = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { customerId, items, invoiceDate, dueDate, status, notes } = req.body;

        // Early validation
        if (!customerId) {
            return res.status(400).json({ success: false, message: 'Customer is required' });
        }
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, message: 'At least one item is required' });
        }

        const invoiceNumber = await getNextNumber(req.user.companyId, 'INVOICE');

        // Fetch Company and Customer details for Tax Calculation
        const [company, customer] = await Promise.all([
            prisma.company.findUnique({
                where: { id: req.user.companyId },
                select: { state: true }
            }),
            prisma.party.findFirst({
                where: { id: customerId, companyId: req.user.companyId },
                select: { creditPeriod: true, billingAddress: true, gstin: true }
            })
        ]);

        const supplierState = company?.state || '';
        const placeOfSupply = (customer?.billingAddress as any)?.state || ''; // Fallback needs handling

        if (!supplierState) {
            logger.warn('Company state not found for tax calculation');
        }

        // Calculate Taxes using Rule Engine
        const invoiceItems: any[] = [];
        let subtotal = new Decimal(0);
        let totalCGST = new Decimal(0);
        let totalSGST = new Decimal(0);
        let totalIGST = new Decimal(0);
        let totalCess = new Decimal(0);
        let totalTax = new Decimal(0);

        for (const item of items) {
            const quantity = new Decimal(item.quantity || 0);
            const rate = new Decimal(item.rate || 0);
            const taxRate = new Decimal(item.taxRate || 0);
            const cessRate = new Decimal(item.cessRate || 0);
            const taxableValue = quantity.mul(rate);

            const taxResult = gstRuleService.calculateLineItem({
                taxableValue: taxableValue,
                gstRate: taxRate,
                placeOfSupplyState: placeOfSupply,
                companyState: supplierState,
                cessRate: cessRate
            });

            subtotal = subtotal.add(taxResult.taxableValue);
            totalCGST = totalCGST.add(taxResult.cgst);
            totalSGST = totalSGST.add(taxResult.sgst);
            totalIGST = totalIGST.add(taxResult.igst);
            totalCess = totalCess.add(taxResult.cess);
            totalTax = totalTax.add(taxResult.taxAmount);

            invoiceItems.push({
                productId: item.productId || null,
                productName: item.productName || 'Unknown Product',
                quantity: Number(quantity),
                rate: Number(rate),
                taxRate: Number(taxRate),
                taxAmount: taxResult.taxAmount,
                cgst: taxResult.cgst,
                sgst: taxResult.sgst,
                igst: taxResult.igst,
                total: taxResult.totalAmount,
                batchId: item.batchId || null,
            });
        }


        // Calculate Total with Discount and Round Off
        const discount = new Decimal(req.body.discountAmount || 0);
        const round = new Decimal(req.body.roundOff || 0);
        // subtotal + totalTax - discount + round
        const totalAmount = subtotal.add(totalTax).sub(discount).add(round);

        // Auto-calculate Due Date based on Credit Terms (MSME Requirement)
        let derivedDueDate = dueDate ? new Date(dueDate) : null;
        if (!derivedDueDate && customer && customer.creditPeriod > 0) {
            derivedDueDate = new Date(invoiceDate);
            derivedDueDate.setDate(derivedDueDate.getDate() + customer.creditPeriod);
        }

        // Derive Status via Engine
        let derivedStatus = statusEngine.deriveStatus('SALES', {
            status: status || INVOICE_STATUS.DRAFT,
            totalAmount,
            amountPaid: 0,
            balanceAmount: totalAmount,
            dueDate: derivedDueDate
        });

        // APPROVAL WORKFLOW (P1): Dynamic check
        const { workflowService } = require('../../services/workflowService');
        const requiresApproval = await workflowService.checkApprovalRequired(req.user.companyId, 'Invoice', totalAmount.toNumber());

        if (requiresApproval && derivedStatus !== INVOICE_STATUS.DRAFT) {
            derivedStatus = 'PENDING_APPROVAL'; // Override status
        }

        // Phase 8: Check period lock before creating invoice
        await requireUnlockedPeriod(
            req.user.companyId,
            new Date(invoiceDate),
            'invoice creation'
        );

        // Phase 9: Validate stock availability before proceeding (skip for drafts)
        const derivedStatusLower = (derivedStatus || '').toLowerCase();
        if (derivedStatusLower !== 'draft' && derivedStatusLower !== 'pending_approval') {
            const stockItems = items
                .filter((item: any) => item.productId)
                .map((item: any) => ({
                    productId: item.productId,
                    quantity: Number(item.quantity),
                    warehouseId: item.warehouseId
                }));

            if (stockItems.length > 0) {
                const stockValidation = await stockValidationService.validateMultipleItems(
                    stockItems,
                    req.user.companyId
                );

                if (!stockValidation.isValid) {
                    return res.status(400).json({
                        success: false,
                        message: 'Insufficient stock for one or more items',
                        errors: stockValidation.errors,
                        code: 'INSUFFICIENT_STOCK'
                    });
                }
            }
        }

        // Phase 9.3: Batch Tracking Validation
        const productIds = items.filter((i: any) => i.productId).map((i: any) => i.productId);
        if (productIds.length > 0) {
            const batchTrackedProducts = await prisma.product.findMany({
                where: {
                    id: { in: productIds },
                    companyId: req.user.companyId,
                    isBatchTracked: true
                },
                select: { id: true, name: true }
            });

            const batchErrors: string[] = [];
            for (const product of batchTrackedProducts) {
                const item = items.find((i: any) => i.productId === product.id);
                if (item && !item.batchId) {
                    batchErrors.push(`Batch selection required for ${product.name}`);
                }
            }

            if (batchErrors.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Batch selection required for batch-tracked products',
                    errors: batchErrors,
                    code: 'BATCH_REQUIRED'
                });
            }
        }

        // Phase 10: Tax Validation Gates
        if (customerId) {
            // Already fetched company and customer above
            if (company?.state && customer) {
                const customerState = (customer.billingAddress as any)?.state;

                // 10.1.1 Validate GSTIN if present
                if (customer.gstin) {
                    const gstinValidation = TaxValidationService.validateGSTIN(customer.gstin, customerState);
                    if (!gstinValidation.isValid) {
                        return res.status(400).json({
                            success: false,
                            message: 'Invalid GSTIN details',
                            errors: gstinValidation.errors,
                            code: 'INVALID_TAX_DETAILS'
                        });
                    }
                }

                // 10.1.2 Validate Tax Type (IGST mismatch)
                if (customerState && items.length > 0) {
                    const taxValidation = TaxValidationService.validateInvoiceTax(
                        company.state,
                        customerState,
                        items.map((i: any) => ({
                            taxRate: Number(i.taxRate || 0),
                            taxAmount: Number(i.totalTax || 0),
                            cgst: Number(i.cgst || 0),
                            sgst: Number(i.sgst || 0),
                            igst: Number(i.igst || 0),
                            total: Number(i.totalAmount || 0),
                        }))
                    );

                    if (!taxValidation.isValid) {
                        return res.status(400).json({
                            success: false,
                            message: 'Tax type Mismatch (Inter/Intra State)',
                            errors: taxValidation.errors,
                            code: 'TAX_MISMATCH'
                        });
                    }
                }
            }
        }

        const result = await prisma.$transaction(async (tx) => {
            // Step 1: Create the invoice without items
            const invoice = await tx.invoice.create({
                data: {
                    companyId: req.user.companyId,
                    userId: req.user.id,
                    customerId,
                    invoiceNumber,
                    invoiceDate: new Date(invoiceDate),
                    dueDate: derivedDueDate,
                    status: derivedStatus as InvoiceStatus,
                    notes,
                    subtotal,
                    totalTax,

                    totalAmount,
                    balanceAmount: totalAmount,
                    discountAmount: discount,
                    roundOff: round,

                    // GST Compliance Fields
                    placeOfSupply: placeOfSupply,
                    isInterState: supplierState !== placeOfSupply,
                    // Tax Breakdown
                    cgst: new Decimal(totalCGST),
                    sgst: new Decimal(totalSGST),
                    igst: new Decimal(totalIGST),
                }
            });

            // Step 2: Create items separately using createMany (avoids nested relation connect which triggers tenant isolation)
            if (invoiceItems.length > 0) {
                await tx.invoiceItem.createMany({
                    data: invoiceItems.map((item: any) => ({
                        ...item,
                        invoiceId: invoice.id,
                    }))
                });
            }

            // Step 3: Re-fetch invoice with includes
            const fullInvoice = await tx.invoice.findUnique({
                where: { id: invoice.id, companyId: req.user.companyId },
                include: {
                    items: true,
                    customer: true
                }
            });

            // C2 FIX: Atomic stock deduction within same transaction
            // This ensures inventory is updated atomically with invoice creation
            for (const item of items) {
                if (!item.productId) continue;

                const product = await tx.product.findFirst({
                    where: { id: item.productId, companyId: req.user.companyId },
                    select: { id: true, name: true, currentStock: true, trackInventory: true }
                });

                if (product && product.trackInventory) {
                    const previousStock = product.currentStock;
                    const newStock = previousStock - Number(item.quantity);

                    // Update product stock
                    await tx.product.update({
                        where: { id: item.productId, companyId: req.user.companyId },
                        data: { currentStock: newStock }
                    });

                    // Update batch stock if applicable
                    if (item.batchId) {
                        await tx.stockBatch.update({
                            where: { id: item.batchId, companyId: req.user.companyId },
                            data: { quantity: { decrement: Number(item.quantity) } }
                        });
                    }

                    // Log stock movement
                    await tx.stockMovement.create({
                        data: {
                            companyId: req.user.companyId,
                            productId: item.productId,
                            type: 'SALE',
                            quantity: -Number(item.quantity),
                            previousStock,
                            newStock,
                            reference: invoiceNumber,
                            reason: `Invoice Created: ${invoiceNumber}`,
                            createdBy: req.user.id,
                            batchId: item.batchId
                        }
                    });

                    logger.info(`[C2] Atomic stock deduction: ${item.quantity} from ${product.name} (New: ${newStock})`);
                }
            }

            // C3 FIX: Atomic Ledger Posting
            // Enforce 1.2 "Atomic stock + ledger + document write"
            // APPROVAL CHECK: Only post if NOT pending approval
            if (!requiresApproval) {
                await postSalesInvoice({
                    id: invoice.id,
                    invoiceNumber: invoiceNumber,
                    invoiceDate: new Date(invoiceDate),
                    customerId: customerId,
                    subtotal: subtotal.toNumber(),
                    totalTax: totalTax.toNumber(),
                    totalAmount: totalAmount.toNumber(),
                    discountAmount: discount.toNumber(),
                    roundOff: round.toNumber(),
                    companyId: req.user.companyId,
                    items: items.map((item: any) => ({
                        productId: item.productId,
                        quantity: Number(item.quantity),
                        rate: Number(item.rate)
                    }))
                }, tx); // Pass tx to ensure atomicity
            } else {
                // Creates Approval Request inside the transaction
                await tx.approvalRequest.create({
                    data: {
                        companyId: req.user.companyId,
                        entityType: 'INVOICE',
                        entityId: invoice.id,
                        requestedById: req.user.id,
                        amount: new Decimal(totalAmount),
                        status: 'PENDING',
                        approverRole: 'ADMIN' // Default for now
                    }
                });

                logger.info(`Invoice ${invoiceNumber} held for approval (Amount: ${totalAmount} > 50000)`);
            }

            // P0-5: Emit domain event for event-driven processing (Transactional)
            await eventBus.emit({
                companyId: req.user.companyId,
                eventType: EventTypes.INVOICE_CREATED,
                aggregateType: 'Invoice',
                aggregateId: invoice.id,
                payload: {
                    invoiceId: invoice.id,
                    invoiceNumber: invoice.invoiceNumber,
                    customerId: invoice.customerId,
                    invoiceDate: invoice.invoiceDate,
                    subtotal: Number(invoice.subtotal),
                    totalTax: Number(invoice.totalTax),
                    discountAmount: Number(invoice.discountAmount),
                    roundOff: Number(invoice.roundOff),
                    totalAmount: Number(invoice.totalAmount),
                    items: items.map((item: any) => ({
                        productId: item.productId,
                        quantity: Number(item.quantity),
                        rate: Number(item.rate),
                        batchId: item.batchId
                    }))
                },
                metadata: {
                    userId: req.user.id,
                    source: 'api'
                }
            }, tx);

            return fullInvoice;
        }, { timeout: 30000 });

        logger.info(`Invoice created: ${result!.invoiceNumber} by ${req.user.email}`);

        return res.status(201).json({
            success: true,
            message: 'Invoice created successfully',
            data: { invoice: result }
        });
    } catch (error: any) {
        logger.error('Create invoice error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error creating invoice',
            error: error.message
        });
    }
};

// @desc    Update invoice
// @route   PUT /api/v1/sales/invoices/:id
// @access  Private
export const updateInvoice = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { id } = req.params;
        const { status, notes, items, invoiceDate, dueDate } = req.body;

        const existingInvoice = await prisma.invoice.findUnique({
            where: { id, companyId: req.user.companyId },
            include: { items: true, customer: true }
        });

        if (!existingInvoice || existingInvoice.companyId !== req.user.companyId) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found'
            });
        }

        // FIX #2: Block updates on invoices with payments
        const hasPayments = Number(existingInvoice.amountPaid || 0) > 0;
        if (hasPayments) {
            return res.status(400).json({
                success: false,
                message: 'Cannot modify invoice with recorded payments. Create a Credit Note instead.',
                code: 'INVOICE_HAS_PAYMENTS'
            });
        }

        // C1 FIX: Block updates on finalized invoices (status-based locking)
        if (statusEngine.isLocked('SALES', existingInvoice)) {
            return res.status(400).json({
                success: false,
                message: `Cannot edit invoice with status: ${existingInvoice.status}. The invoice is locked.`,
                code: 'INVOICE_STATUS_LOCKED'
            });
        }

        // We need to perform all these operations in a transaction
        const result = await prisma.$transaction(async (tx) => {
            let updateData: any = {
                status,
                notes,
                invoiceDate: invoiceDate ? new Date(invoiceDate) : undefined,
                dueDate: dueDate ? new Date(dueDate) : undefined
            };

            let subtotal = Number(existingInvoice.subtotal);
            let totalTax = Number(existingInvoice.totalTax);

            if (items) {
                // RESTORED: Calculate NEW totals and prepare new items
                subtotal = 0;
                totalTax = 0;

                const newItemsData = items.map((item: any) => {
                    const total = Number(item.quantity) * Number(item.rate);
                    const tax = total * (Number(item.taxRate) / 100);

                    subtotal += total;
                    totalTax += tax;

                    return {
                        productId: item.productId,
                        productName: item.productName || 'Unknown Product',
                        quantity: Number(item.quantity),
                        rate: Number(item.rate),
                        taxRate: Number(item.taxRate),
                        taxAmount: tax,
                        total: total + tax,
                        batchId: item.batchId
                    };
                });

                updateData.items = {
                    deleteMany: {},
                    create: newItemsData
                };
            }

            // Calculate Totals with Discount/RoundOff
            const discount = req.body.discountAmount !== undefined ? Number(req.body.discountAmount) : Number(existingInvoice.discountAmount);
            const round = req.body.roundOff !== undefined ? Number(req.body.roundOff) : Number(existingInvoice.roundOff);

            const totalAmount = subtotal + totalTax - discount + round;

            updateData = {
                ...updateData,
                subtotal,
                totalTax,
                totalAmount,
                discountAmount: discount,
                roundOff: round,
            };

            // Re-Derive Status based on new totals
            const newDerivedStatus = statusEngine.deriveStatus('SALES', {
                status: existingInvoice.status, // Keep existing status logic base
                totalAmount,
                amountPaid: Number(existingInvoice.amountPaid), // Amount paid doesn't change here
                balanceAmount: totalAmount - Number(existingInvoice.amountPaid),
                dueDate: updateData.dueDate || existingInvoice.dueDate
            });

            const finalStatus = status ? status : newDerivedStatus;

            // Validate Transition if status is changing
            if (finalStatus !== existingInvoice.status) {
                const validation = statusEngine.validateTransition('SALES', existingInvoice, finalStatus);
                if (!validation.allowed) {
                    throw new Error(validation.reason || 'Status transition not allowed');
                }
            }

            updateData.status = finalStatus;

            // Update the invoice
            const updatedInvoice = await tx.invoice.update({
                where: { id },
                data: updateData,
                include: {
                    items: true,
                    customer: true
                }
            });

            // Atomic Ledger Update
            await updateSalesInvoice({
                id: updatedInvoice.id,
                invoiceNumber: updatedInvoice.invoiceNumber,
                invoiceDate: updatedInvoice.invoiceDate,
                customerId: updatedInvoice.customerId,
                subtotal: Number(updatedInvoice.subtotal),
                totalTax: Number(updatedInvoice.totalTax),
                discountAmount: Number(updatedInvoice.discountAmount),
                roundOff: Number(updatedInvoice.roundOff),
                totalAmount: Number(updatedInvoice.totalAmount),
                companyId: req.user.companyId,
                items: updatedInvoice.items.map((i: any) => ({
                    productId: i.productId,
                    quantity: Number(i.quantity),
                    rate: Number(i.rate)
                }))
            }, tx);

            return updatedInvoice;
        });

        // Ledger posting moved to Accounting Domain listener

        // Audit Log
        await AuditService.logChange(
            req.user.companyId,
            req.user.id,
            'INVOICE',
            result.id,
            'UPDATE',
            existingInvoice,
            result,
            req.ip,
            req.headers['user-agent'] || 'UNKNOWN',
            'SALES'
        );

        logger.info(`Invoice updated: ${result.invoiceNumber} by ${req.user.email}`);

        // Emit INVOICE_UPDATED
        eventBus.emit({
            companyId: req.user.companyId,
            eventType: EventTypes.INVOICE_UPDATED,
            aggregateType: 'Invoice',
            aggregateId: result.id,
            payload: {
                ...result,
                oldItems: existingInvoice.items,
                oldTotalAmount: Number(existingInvoice.totalAmount)
            },
            metadata: { userId: req.user.id, source: 'api' }
        });

        return res.status(200).json({
            success: true,
            message: 'Invoice updated successfully',
            data: { invoice: result }
        });
    } catch (error: any) {
        logger.error('Update invoice error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating invoice',
            error: error.message
        });
    }
};

// @desc    Delete invoice
// @route   DELETE /api/v1/sales/invoices/:id
// @access  Private
export const deleteInvoice = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { id } = req.params;

        const existingInvoice = await prisma.invoice.findUnique({
            where: { id, companyId: req.user.companyId },
            include: { items: true }
        });

        if (!existingInvoice || existingInvoice.companyId !== req.user.companyId) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found'
            });
        }

        // B1 FIX: Prevent deletion of invoices that have received payments or are not in DRAFT status
        const hasPayments = Number(existingInvoice.amountPaid || 0) > 0;
        const isNotDraft = existingInvoice.status !== INVOICE_STATUS.DRAFT;

        if (hasPayments) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete invoice with recorded payments. Create a Credit Note instead.'
            });
        }

        if (isNotDraft && existingInvoice.status !== INVOICE_STATUS.CANCELLED) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete invoice with status '${existingInvoice.status}'. Only DRAFT or CANCELLED invoices can be deleted.`
            });
        }

        // Cross-domain logic removed. 
        // Stock restoration and Party balance reduction handles by Event Handlers.

        await prisma.invoice.delete({
            where: { id, companyId: req.user.companyId }
        });

        // Decrement the sequence number to reuse the freed number
        await decrementSequence(req.user.companyId, 'INVOICE');

        // Audit Log
        await AuditService.logChange(
            req.user.companyId,
            req.user.id,
            'INVOICE',
            existingInvoice.id,
            'DELETE',
            existingInvoice,
            { status: 'DELETED' },
            req.ip,
            req.headers['user-agent'] || 'UNKNOWN',
            'SALES'
        );

        logger.info(`Invoice deleted: ${existingInvoice.invoiceNumber} by ${req.user.email}`);

        // Emit INVOICE_CANCELLED (treated as Delete)
        eventBus.emit({
            companyId: req.user.companyId,
            eventType: EventTypes.INVOICE_CANCELLED,
            aggregateType: 'Invoice',
            aggregateId: existingInvoice.id,
            payload: {
                ...existingInvoice,
                items: existingInvoice.items
            },
            metadata: { userId: req.user.id, source: 'api' }
        });

        return res.status(200).json({
            success: true,
            message: 'Invoice deleted successfully'
        });
    } catch (error: any) {
        logger.error('Delete invoice error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error deleting invoice',
            error: error.message
        });
    }
};

// @desc    Search invoices
// @route   GET /api/v1/sales/invoices/search
// @access  Private
export const searchInvoices = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { q } = req.query;

        if (!q) {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }

        const invoices = await prisma.invoice.findMany({
            where: {
                companyId: req.user.companyId,
                OR: [
                    { invoiceNumber: { contains: q as string } },
                ]
            },
            take: 10,
            orderBy: { invoiceDate: 'desc' },
            include: { customer: true }
        });

        return res.status(200).json({
            success: true,
            data: { invoices }
        });
    } catch (error: any) {
        logger.error('Search invoices error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error searching invoices',
            error: error.message
        });
    }
};

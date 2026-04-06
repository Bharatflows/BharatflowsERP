"use strict";
/**
 * Invoice Controller
 *
 * Handles core invoice CRUD operations.
 * Split from salesController.ts for better maintainability.
 * Fixed syntax errors and duplicates.
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
exports.searchInvoices = exports.deleteInvoice = exports.updateInvoice = exports.createInvoice = exports.getInvoice = exports.getInvoices = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
const logger_1 = __importDefault(require("../../config/logger"));
const sequenceService_1 = require("../../services/sequenceService");
const eventBus_1 = __importStar(require("../../services/eventBus")); // P0-5: Domain events
const auditService_1 = require("../../services/auditService");
const statusEngine_1 = require("../../services/status/statusEngine");
const statuses_1 = require("../../constants/statuses");
const periodLockService_1 = require("../../services/periodLockService");
const stockValidationService_1 = __importDefault(require("../../services/stockValidationService"));
const taxValidationService_1 = require("../../services/taxValidationService");
const postingService_1 = require("../../services/postingService");
// @desc    Get all invoices
// @route   GET /api/v1/sales/invoices
// @access  Private
const getInvoices = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, search } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {
            companyId: req.user.companyId,
            deletedAt: null // Exclude soft-deleted invoices
        };
        if (status) {
            where.status = status.toString().toUpperCase();
        }
        if (search) {
            where.OR = [
                { invoiceNumber: { contains: search } },
            ];
        }
        const [invoices, total] = await Promise.all([
            prisma_1.default.invoice.findMany({
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
            prisma_1.default.invoice.count({ where })
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
    }
    catch (error) {
        logger_1.default.error('Get invoices error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching invoices',
            error: error.message
        });
    }
};
exports.getInvoices = getInvoices;
// @desc    Get single invoice
// @route   GET /api/v1/sales/invoices/:id
// @access  Private
const getInvoice = async (req, res) => {
    try {
        const invoice = await prisma_1.default.invoice.findUnique({
            where: {
                id: req.params.id
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
    }
    catch (error) {
        logger_1.default.error('Get invoice error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching invoice',
            error: error.message
        });
    }
};
exports.getInvoice = getInvoice;
// @desc    Create invoice
// @route   POST /api/v1/sales/invoices
const gstRuleService_1 = require("../../services/gstRuleService");
const library_1 = require("@prisma/client/runtime/library");
// @access  Private
const createInvoice = async (req, res) => {
    try {
        const { customerId, items, invoiceDate, dueDate, status, notes } = req.body;
        const invoiceNumber = await (0, sequenceService_1.getNextNumber)(req.user.companyId, 'INVOICE');
        // Fetch Company and Customer details for Tax Calculation
        const [company, customer] = await Promise.all([
            prisma_1.default.company.findUnique({
                where: { id: req.user.companyId },
                select: { state: true }
            }),
            prisma_1.default.party.findUnique({
                where: { id: customerId },
                select: { creditPeriod: true, billingAddress: true, gstin: true }
            })
        ]);
        const supplierState = company?.state || '';
        const placeOfSupply = customer?.billingAddress?.state || ''; // Fallback needs handling
        if (!supplierState) {
            logger_1.default.warn('Company state not found for tax calculation');
        }
        // Calculate Taxes using Rule Engine
        const invoiceItems = [];
        let subtotal = new library_1.Decimal(0);
        let totalCGST = new library_1.Decimal(0);
        let totalSGST = new library_1.Decimal(0);
        let totalIGST = new library_1.Decimal(0);
        let totalCess = new library_1.Decimal(0);
        let totalTax = new library_1.Decimal(0);
        for (const item of items) {
            const quantity = new library_1.Decimal(item.quantity || 0);
            const rate = new library_1.Decimal(item.rate || 0);
            const taxRate = new library_1.Decimal(item.taxRate || 0);
            const cessRate = new library_1.Decimal(item.cessRate || 0);
            const taxableValue = quantity.mul(rate);
            const taxResult = gstRuleService_1.gstRuleService.calculateLineItem({
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
                total: taxResult.totalAmount,
                warehouseId: item.warehouseId, // Preserve warehouse ID
                batchId: item.batchId // Preserve batch ID
            });
        }
        // Calculate Total with Discount and Round Off
        const discount = new library_1.Decimal(req.body.discountAmount || 0);
        const round = new library_1.Decimal(req.body.roundOff || 0);
        // subtotal + totalTax - discount + round
        const totalAmount = subtotal.add(totalTax).sub(discount).add(round);
        // Auto-calculate Due Date based on Credit Terms (MSME Requirement)
        let derivedDueDate = dueDate ? new Date(dueDate) : null;
        if (!derivedDueDate && customer && customer.creditPeriod > 0) {
            derivedDueDate = new Date(invoiceDate);
            derivedDueDate.setDate(derivedDueDate.getDate() + customer.creditPeriod);
        }
        // Derive Status via Engine
        let derivedStatus = statusEngine_1.statusEngine.deriveStatus('SALES', {
            status: status || statuses_1.INVOICE_STATUS.DRAFT,
            totalAmount,
            amountPaid: 0,
            balanceAmount: totalAmount,
            dueDate: derivedDueDate
        });
        // APPROVAL WORKFLOW (P1): Dynamic check
        const { workflowService } = require('../../services/workflowService');
        const requiresApproval = await workflowService.checkApprovalRequired(req.user.companyId, 'Invoice', totalAmount.toNumber());
        if (requiresApproval && derivedStatus !== statuses_1.INVOICE_STATUS.DRAFT) {
            derivedStatus = 'PENDING_APPROVAL'; // Override status
        }
        // Phase 8: Check period lock before creating invoice
        await (0, periodLockService_1.requireUnlockedPeriod)(req.user.companyId, new Date(invoiceDate), 'invoice creation');
        // Phase 9: Validate stock availability before proceeding
        const stockItems = items
            .filter((item) => item.productId)
            .map((item) => ({
            productId: item.productId,
            quantity: Number(item.quantity),
            warehouseId: item.warehouseId
        }));
        if (stockItems.length > 0) {
            const stockValidation = await stockValidationService_1.default.validateMultipleItems(stockItems, req.user.companyId);
            if (!stockValidation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Insufficient stock for one or more items',
                    errors: stockValidation.errors,
                    code: 'INSUFFICIENT_STOCK'
                });
            }
        }
        // Phase 9.3: Batch Tracking Validation
        const productIds = items.filter((i) => i.productId).map((i) => i.productId);
        if (productIds.length > 0) {
            const batchTrackedProducts = await prisma_1.default.product.findMany({
                where: {
                    id: { in: productIds },
                    companyId: req.user.companyId,
                    isBatchTracked: true
                },
                select: { id: true, name: true }
            });
            const batchErrors = [];
            for (const product of batchTrackedProducts) {
                const item = items.find((i) => i.productId === product.id);
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
                const customerState = customer.billingAddress?.state;
                // 10.1.1 Validate GSTIN if present
                if (customer.gstin) {
                    const gstinValidation = taxValidationService_1.TaxValidationService.validateGSTIN(customer.gstin, customerState);
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
                    const taxValidation = taxValidationService_1.TaxValidationService.validateInvoiceTax(company.state, customerState, items.map((i) => ({
                        taxRate: new library_1.Decimal(i.taxRate || 0),
                        taxAmount: new library_1.Decimal(i.totalTax || 0),
                        cgst: new library_1.Decimal(i.cgst || 0),
                        sgst: new library_1.Decimal(i.sgst || 0),
                        igst: new library_1.Decimal(i.igst || 0),
                        total: new library_1.Decimal(i.totalAmount || 0),
                    })));
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
        const result = await prisma_1.default.$transaction(async (tx) => {
            const invoice = await tx.invoice.create({
                data: {
                    companyId: req.user.companyId,
                    userId: req.user.id,
                    customerId,
                    invoiceNumber,
                    invoiceDate: new Date(invoiceDate),
                    dueDate: derivedDueDate,
                    status: derivedStatus,
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
                    cgst: new library_1.Decimal(totalCGST),
                    sgst: new library_1.Decimal(totalSGST),
                    igst: new library_1.Decimal(totalIGST),
                    items: {
                        create: invoiceItems
                    }
                },
                include: {
                    items: true,
                    customer: true
                }
            });
            // C2 FIX: Atomic stock deduction within same transaction
            // This ensures inventory is updated atomically with invoice creation
            for (const item of items) {
                if (!item.productId)
                    continue;
                const product = await tx.product.findUnique({
                    where: { id: item.productId },
                    select: { id: true, name: true, currentStock: true, trackInventory: true }
                });
                if (product && product.trackInventory) {
                    const previousStock = product.currentStock;
                    const newStock = previousStock - Number(item.quantity);
                    // Update product stock
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { currentStock: newStock }
                    });
                    // Update batch stock if applicable
                    if (item.batchId) {
                        await tx.stockBatch.update({
                            where: { id: item.batchId },
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
                    logger_1.default.info(`[C2] Atomic stock deduction: ${item.quantity} from ${product.name} (New: ${newStock})`);
                }
            }
            // C3 FIX: Atomic Ledger Posting
            // Enforce 1.2 "Atomic stock + ledger + document write"
            // APPROVAL CHECK: Only post if NOT pending approval
            if (!requiresApproval) {
                await (0, postingService_1.postSalesInvoice)({
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
                    items: items.map((item) => ({
                        productId: item.productId,
                        quantity: Number(item.quantity),
                        rate: Number(item.rate)
                    }))
                }, tx); // Pass tx to ensure atomicity
            }
            else {
                // Creates Approval Request inside the transaction
                await tx.approvalRequest.create({
                    data: {
                        companyId: req.user.companyId,
                        entityType: 'INVOICE',
                        entityId: invoice.id,
                        requestedById: req.user.id,
                        amount: new library_1.Decimal(totalAmount),
                        status: 'PENDING',
                        approverRole: 'ADMIN' // Default for now
                    }
                });
                logger_1.default.info(`Invoice ${invoiceNumber} held for approval (Amount: ${totalAmount} > 50000)`);
            }
            // P0-5: Emit domain event for event-driven processing (Transactional)
            await eventBus_1.default.emit({
                companyId: req.user.companyId,
                eventType: eventBus_1.EventTypes.INVOICE_CREATED,
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
                    items: items.map((item) => ({
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
            return invoice;
        });
        logger_1.default.info(`Invoice created: ${result.invoiceNumber} by ${req.user.email}`);
        return res.status(201).json({
            success: true,
            message: 'Invoice created successfully',
            data: { invoice: result }
        });
    }
    catch (error) {
        logger_1.default.error('Create invoice error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error creating invoice',
            error: error.message
        });
    }
};
exports.createInvoice = createInvoice;
// @desc    Update invoice
// @route   PUT /api/v1/sales/invoices/:id
// @access  Private
const updateInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes, items, invoiceDate, dueDate } = req.body;
        const existingInvoice = await prisma_1.default.invoice.findUnique({
            where: { id },
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
        if (statusEngine_1.statusEngine.isLocked('SALES', existingInvoice)) {
            return res.status(400).json({
                success: false,
                message: `Cannot edit invoice with status: ${existingInvoice.status}. The invoice is locked.`,
                code: 'INVOICE_STATUS_LOCKED'
            });
        }
        // We need to perform all these operations in a transaction
        const result = await prisma_1.default.$transaction(async (tx) => {
            let updateData = {
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
                const newItemsData = items.map((item) => {
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
            const newDerivedStatus = statusEngine_1.statusEngine.deriveStatus('SALES', {
                status: existingInvoice.status, // Keep existing status logic base
                totalAmount,
                amountPaid: Number(existingInvoice.amountPaid), // Amount paid doesn't change here
                balanceAmount: totalAmount - Number(existingInvoice.amountPaid),
                dueDate: updateData.dueDate || existingInvoice.dueDate
            });
            const finalStatus = status ? status : newDerivedStatus;
            // Validate Transition if status is changing
            if (finalStatus !== existingInvoice.status) {
                const validation = statusEngine_1.statusEngine.validateTransition('SALES', existingInvoice, finalStatus);
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
            await (0, postingService_1.updateSalesInvoice)({
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
                items: updatedInvoice.items.map((i) => ({
                    productId: i.productId,
                    quantity: Number(i.quantity),
                    rate: Number(i.rate)
                }))
            }, tx);
            return updatedInvoice;
        });
        // Ledger posting moved to Accounting Domain listener
        // Audit Log
        await auditService_1.AuditService.logChange(req.user.companyId, req.user.id, 'INVOICE', result.id, 'UPDATE', existingInvoice, result, req.ip, req.headers['user-agent'] || 'UNKNOWN', 'SALES');
        logger_1.default.info(`Invoice updated: ${result.invoiceNumber} by ${req.user.email}`);
        // Emit INVOICE_UPDATED
        eventBus_1.default.emit({
            companyId: req.user.companyId,
            eventType: eventBus_1.EventTypes.INVOICE_UPDATED,
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
    }
    catch (error) {
        logger_1.default.error('Update invoice error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating invoice',
            error: error.message
        });
    }
};
exports.updateInvoice = updateInvoice;
// @desc    Delete invoice
// @route   DELETE /api/v1/sales/invoices/:id
// @access  Private
const deleteInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const existingInvoice = await prisma_1.default.invoice.findUnique({
            where: { id },
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
        const isNotDraft = existingInvoice.status !== statuses_1.INVOICE_STATUS.DRAFT;
        if (hasPayments) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete invoice with recorded payments. Create a Credit Note instead.'
            });
        }
        if (isNotDraft && existingInvoice.status !== statuses_1.INVOICE_STATUS.CANCELLED) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete invoice with status '${existingInvoice.status}'. Only DRAFT or CANCELLED invoices can be deleted.`
            });
        }
        // Cross-domain logic removed. 
        // Stock restoration and Party balance reduction handles by Event Handlers.
        await prisma_1.default.invoice.delete({
            where: { id }
        });
        // Decrement the sequence number to reuse the freed number
        await (0, sequenceService_1.decrementSequence)(req.user.companyId, 'INVOICE');
        // Audit Log
        await auditService_1.AuditService.logChange(req.user.companyId, req.user.id, 'INVOICE', existingInvoice.id, 'DELETE', existingInvoice, { status: 'DELETED' }, req.ip, req.headers['user-agent'] || 'UNKNOWN', 'SALES');
        logger_1.default.info(`Invoice deleted: ${existingInvoice.invoiceNumber} by ${req.user.email}`);
        // Emit INVOICE_CANCELLED (treated as Delete)
        eventBus_1.default.emit({
            companyId: req.user.companyId,
            eventType: eventBus_1.EventTypes.INVOICE_CANCELLED,
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
    }
    catch (error) {
        logger_1.default.error('Delete invoice error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error deleting invoice',
            error: error.message
        });
    }
};
exports.deleteInvoice = deleteInvoice;
// @desc    Search invoices
// @route   GET /api/v1/sales/invoices/search
// @access  Private
const searchInvoices = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }
        const invoices = await prisma_1.default.invoice.findMany({
            where: {
                companyId: req.user.companyId,
                OR: [
                    { invoiceNumber: { contains: q } },
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
    }
    catch (error) {
        logger_1.default.error('Search invoices error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error searching invoices',
            error: error.message
        });
    }
};
exports.searchInvoices = searchInvoices;
//# sourceMappingURL=invoiceController.js.map
/**
 * Posting Service
 * Automatically creates ledger postings when financial transactions occur
 */

import { PrismaClient } from '@prisma/client';
import accountingService from './accountingService';
import { accountingPostingService } from './accountingPostingService';
import logger from '../config/logger';

// Type definitions for SQLite (no enums)
type VoucherType = 'PAYMENT' | 'RECEIPT' | 'CONTRA' | 'JOURNAL' | 'SALES' | 'PURCHASE' | 'DEBIT_NOTE' | 'CREDIT_NOTE';
type PostingType = 'DEBIT' | 'CREDIT';

const prisma = new PrismaClient();

interface InvoiceItem {
    productId: string;
    quantity: number;
    rate: number;
}

interface InvoiceData {
    id: string;
    invoiceNumber: string;
    invoiceDate: Date;
    customerId: string;
    subtotal: number;
    totalTax: number;
    totalAmount: number;
    discountAmount?: number; // Optional
    roundOff?: number;       // Optional
    companyId: string;
    items?: InvoiceItem[];
}

export interface DebitNoteData {
    companyId: string;
    debitNoteNumber: string;
    debitNoteId: string;
    date: Date;
    supplierId: string;
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    type: string; // 'RETURN' or 'FINANCIAL'
}

export interface CreditNoteData {
    companyId: string;
    creditNoteNumber: string;
    id: string; // needed for reference
    date: Date;
    customerId: string;
    subtotal: number;
    totalTax: number;
    totalAmount: number;
}

interface PurchaseBillItem {
    productId?: string;
    productName: string;
    quantity: number;
    rate: number;
    total: number;
}

interface PurchaseBillData {
    id: string;
    billNumber: string;
    billDate: Date;
    supplierId: string;
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    discountAmount?: number;
    roundOff?: number;
    companyId: string;
    items?: PurchaseBillItem[];
}

interface ExpenseData {
    id: string;
    description: string;
    date: Date;
    amount: number; // This is the Base Amount (Subtotal)
    gstAmount?: number; // Optional GST
    totalAmount: number; // Total = Base + GST
    category: string;
    paymentMode: string; // CASH, BANK
    bankAccountId?: string;
    companyId: string;
}

interface PaymentData {
    companyId: string;
    partyId: string;
    amount: number;
    date: Date;
    mode: string;
    type: 'RECEIVED' | 'PAID';
    id: string;
}

export interface PDCData {
    companyId: string;
    pdcId: string;
    amount: number;
    type: 'RECEIVED' | 'ISSUED';
    partyId: string;
    clearedAt: Date;
}

export interface StockAdjustmentData {
    companyId: string;
    adjustmentId: string;
    adjustmentNumber: string;
    date: Date;
    type: 'INCREASE' | 'DECREASE' | 'WRITE_OFF' | 'DAMAGE';
    totalValue: number; // Value = quantity * costPrice
    reason: string;
}

export interface ManufacturingData {
    companyId: string;
    workOrderId: string;
    orderNumber: string;
    date: Date;
    finishedProductId: string;
    finishedProductName: string;
    quantityProduced: number;
    totalCost: number; // Sum of RM cost
}

export interface PayrollData {
    companyId: string;
    payrollId: string;
    employeeId: string;
    employeeName: string;
    month: string;
    date: Date;
    basic: number;
    additions: number;
    deductions: number;
    netPay: number;
}

export interface BankTransactionData {
    companyId: string;
    transactionId: string;
    accountId: string;
    date: Date;
    amount: number;
    type: 'credit' | 'debit';
    description: string;
    category: string; // Used to find correct expense ledger
}

// Phase 9: Wastage Data
export interface WastageData {
    companyId: string;
    wastageId: string;
    productId: string;
    productName: string;
    quantity: number;
    reason: string;
    estimatedCost: number;
    date: Date;
}

/**
 * Post a Sales Invoice to ledger
 * Entry:
 *   Dr. Sundry Debtors (Customer) - Total Amount
 *   Cr. Sales Account             - Subtotal
 *   Cr. GST Payable               - Tax Amount
 */
export async function postSalesInvoice(invoice: InvoiceData, tx: any = prisma): Promise<void> {
    try {
        // 1. Get ledgers
        const customerLedgerId = await accountingService.getOrCreatePartyLedger(invoice.companyId, invoice.customerId, tx);
        let salesLedgerId: string;
        try {
            salesLedgerId = await accountingService.getSystemLedgerByCode(invoice.companyId, 'SALES_GOODS', tx);
        } catch {
            salesLedgerId = await accountingService.getSystemLedgerByCode(invoice.companyId, 'SALES', tx);
        }

        let gstOutputLedgerId: string | null = null;
        if (invoice.totalTax > 0) {
            try {
                gstOutputLedgerId = await accountingService.getSystemLedgerByCode(invoice.companyId, 'GST_PAYABLE', tx);
            } catch (e) {
                logger.warn('GST_PAYABLE ledger missing');
            }
        }

        // COGS Ledgers
        const cogsLedgerId = await accountingService.getSystemLedgerByCode(invoice.companyId, 'COST_OF_GOODS_SOLD', tx).catch(() => null);
        const stockLedgerId = await accountingService.getSystemLedgerByCode(invoice.companyId, 'STOCK_IN_HAND', tx).catch(() => null);

        // 2. Prepare Postings
        const postings = [];

        // Debit Customer (Receivable)
        postings.push({
            ledgerId: customerLedgerId,
            amount: invoice.totalAmount,
            type: 'DEBIT' as PostingType,
            narration: `Invoice ${invoice.invoiceNumber}`
        });

        // Credit Sales (Income)
        postings.push({
            ledgerId: salesLedgerId,
            amount: invoice.subtotal,
            type: 'CREDIT' as PostingType,
            narration: `Sales Revenue`
        });

        // Credit GST Payable
        if (invoice.totalTax > 0 && gstOutputLedgerId) {
            postings.push({
                ledgerId: gstOutputLedgerId,
                amount: invoice.totalTax,
                type: 'CREDIT' as PostingType,
                narration: `Output Tax`
            });
        } else if (invoice.totalTax > 0) {
            // Fallback: Add tax to Sales if ledger missing
            postings[1].amount += invoice.totalTax;
        }

        // 3. COGS Calculation (Perpetual Inventory)
        if (cogsLedgerId && stockLedgerId && invoice.items && invoice.items.length > 0) {
            let totalCost = 0;

            // We need to fetch product costs.
            const productIds = invoice.items.map(i => i.productId).filter(Boolean);
            const products = await tx.product.findMany({
                where: { id: { in: productIds }, companyId: invoice.companyId },
                select: { id: true, purchasePrice: true, trackInventory: true }
            });

            for (const item of invoice.items) {
                const product = products.find((p: any) => p.id === item.productId);
                if (product && product.trackInventory) {
                    totalCost += (Number(product.purchasePrice || 0) * item.quantity);
                }
            }

            if (totalCost > 0) {
                postings.push({
                    ledgerId: cogsLedgerId,
                    amount: totalCost,
                    type: 'DEBIT' as PostingType,
                    narration: `COGS for Inv ${invoice.invoiceNumber}`
                });
                postings.push({
                    ledgerId: stockLedgerId,
                    amount: totalCost,
                    type: 'CREDIT' as PostingType,
                    narration: `Inventory Consumption`
                });
            }
        }

        // 4. Create Voucher
        await accountingService.createVoucher({
            date: invoice.invoiceDate,
            type: 'SALES',
            referenceType: 'INVOICE',
            referenceId: invoice.id,
            narration: `Sales Invoice ${invoice.invoiceNumber}`,
            companyId: invoice.companyId,
            postings
        }, tx);
        logger.info(`Posted Sales Invoice ${invoice.invoiceNumber}`);

    } catch (error) {
        logger.error('Error posting sales invoice:', error);
    }
}

/**
 * Cancel a Sales Invoice Ledger (Soft Delete)
 */
export async function cancelSalesInvoice(invoiceId: string, companyId: string, tx: any = prisma): Promise<void> {
    try {
        await accountingPostingService.voidVoucher(invoiceId, 'INVOICE', companyId, tx);
        logger.info(`Cancelled Ledger for Invoice ${invoiceId}`);
    } catch (error) {
        logger.error('Error cancelling sales invoice ledger:', error);
    }
}

/**
 * Update a Sales Invoice Ledger (Reverse + Repost)
 */
export async function updateSalesInvoice(invoice: InvoiceData, tx: any = prisma): Promise<void> {
    await cancelSalesInvoice(invoice.id, invoice.companyId, tx);
    await postSalesInvoice(invoice, tx);
}

/**
 * Post a Purchase Bill to ledger
 * Entry:
 *   Dr. Purchase Account    - Subtotal
 *   Dr. GST Input           - Tax Amount
 *   Cr. Sundry Creditors    - Total Amount
 */
export async function postPurchaseBill(bill: PurchaseBillData, tx: any = prisma): Promise<void> {
    try {
        // 1. Get ledgers
        const supplierLedgerId = await accountingService.getOrCreatePartyLedger(bill.companyId, bill.supplierId, tx);
        const purchaseExpenseLedgerId = await accountingService.getSystemLedgerByCode(bill.companyId, 'PURCHASE_GOODS', tx)
            .catch(() => accountingService.getSystemLedgerByCode(bill.companyId, 'PURCHASE', tx));

        const stockLedgerId = await accountingService.getSystemLedgerByCode(bill.companyId, 'STOCK_IN_HAND', tx).catch(() => null);

        let gstInputLedgerId: string | null = null;
        if (bill.taxAmount > 0) {
            try {
                gstInputLedgerId = await accountingService.getSystemLedgerByCode(bill.companyId, 'GST_INPUT', tx);
            } catch (e) {
                logger.warn('GST_INPUT ledger missing');
            }
        }

        // 2. Classify Items (Inventory vs Expense)
        let inventoryAmount = 0;
        let expenseAmount = 0;

        if (bill.items && bill.items.length > 0) {
            const productIds = bill.items.map(i => i.productId).filter((id): id is string => !!id);
            const products = await tx.product.findMany({
                where: { id: { in: productIds }, companyId: bill.companyId },
                select: { id: true, trackInventory: true }
            });

            for (const item of bill.items) {
                const product = products.find((p: any) => p.id === item.productId);
                const baseAmount = item.quantity * item.rate;

                if (product && product.trackInventory) {
                    inventoryAmount += baseAmount;
                } else {
                    expenseAmount += baseAmount;
                }
            }
        } else {
            expenseAmount = bill.subtotal;
        }

        // Adjust for discounts or mismatches
        const totalCalculated = inventoryAmount + expenseAmount;
        if (Math.abs(totalCalculated - bill.subtotal) > 1 && totalCalculated > 0) {
            const diff = bill.subtotal - totalCalculated;
            expenseAmount += diff;
        } else if (totalCalculated === 0) {
            expenseAmount = bill.subtotal;
        }

        // 3. Prepare Postings
        const postings = [];

        // Debit Inventory (Asset)
        if (inventoryAmount > 0 && stockLedgerId) {
            postings.push({
                ledgerId: stockLedgerId,
                amount: inventoryAmount,
                type: 'DEBIT' as PostingType,
                narration: `Inventory Addition`
            });
        } else if (inventoryAmount > 0) {
            expenseAmount += inventoryAmount;
        }

        // Debit Expense
        if (expenseAmount > 0) {
            postings.push({
                ledgerId: purchaseExpenseLedgerId,
                amount: expenseAmount,
                type: 'DEBIT' as PostingType,
                narration: `Purchase Expense / Non-Inventory`
            });
        }

        // Debit GST Input (Asset)
        if (bill.taxAmount > 0 && gstInputLedgerId) {
            postings.push({
                ledgerId: gstInputLedgerId,
                amount: bill.taxAmount,
                type: 'DEBIT' as PostingType,
                narration: `Input Tax Credit`
            });
        } else if (bill.taxAmount > 0) {
            const lastExp = postings.find(p => p.ledgerId === purchaseExpenseLedgerId);
            if (lastExp) lastExp.amount += bill.taxAmount;
        }

        // Credit Supplier (Payable)
        postings.push({
            ledgerId: supplierLedgerId,
            amount: bill.totalAmount,
            type: 'CREDIT' as PostingType,
            narration: `Bill ${bill.billNumber}`
        });

        // 4. Create Voucher
        await accountingService.createVoucher({
            date: bill.billDate,
            type: 'PURCHASE',
            referenceType: 'PURCHASE_BILL',
            referenceId: bill.id,
            narration: `Purchase Bill ${bill.billNumber}`,
            companyId: bill.companyId,
            postings
        }, tx);
        logger.info(`Posted Purchase Bill ${bill.billNumber}`);

    } catch (error) {
        logger.error('Error posting purchase bill:', error);
    }
}

/**
 * Cancel a Purchase Bill Ledger
 */
export async function cancelPurchaseBill(billId: string, companyId: string, tx: any = prisma): Promise<void> {
    try {
        await accountingPostingService.voidVoucher(billId, 'PURCHASE_BILL', companyId, tx);
        logger.info(`Cancelled Ledger for Purchase Bill ${billId}`);
    } catch (error) {
        logger.error('Error cancelling purchase bill ledger:', error);
    }
}

/**
 * Update a Purchase Bill Ledger (Reverse + Repost)
 */
export async function updatePurchaseBill(bill: PurchaseBillData, tx: any = prisma): Promise<void> {
    await cancelPurchaseBill(bill.id, bill.companyId, tx);
    await postPurchaseBill(bill, tx);
}

/**
 * Post an Expense to ledger
 * Entry:
 *   Dr. Expense Account    - Base Amount
 *   Dr. GST Input (opt)    - GST Amount
 *   Cr. Cash / Bank        - Total Amount
 */
export async function postExpense(expense: ExpenseData): Promise<void> {
    try {
        // Get expense ledger (use misc expenses if category not mapped)
        let expenseLedgerId: string;
        try {
            expenseLedgerId = await accountingService.getSystemLedgerByCode(
                expense.companyId,
                expense.category.toUpperCase().replace(/\s+/g, '_')
            );
        } catch {
            expenseLedgerId = await accountingService.getSystemLedgerByCode(
                expense.companyId,
                'MISC_EXPENSES'
            );
        }

        // Get cash/bank ledger
        const cashLedgerId = await accountingService.getSystemLedgerByCode(
            expense.companyId,
            expense.paymentMode === 'BANK' ? 'BANK_ACCOUNTS' : 'CASH'
        );

        const postings: any[] = [
            {
                ledgerId: expenseLedgerId,
                amount: expense.amount, // Base amount
                type: 'DEBIT' as PostingType,
                narration: expense.description
            },
            {
                ledgerId: cashLedgerId,
                amount: expense.totalAmount, // Total paid
                type: 'CREDIT' as PostingType,
                narration: expense.description
            }
        ];

        // Add GST Input Credit if applicable
        if (expense.gstAmount && expense.gstAmount > 0) {
            try {
                const gstInputLedgerId = await accountingService.getSystemLedgerByCode(
                    expense.companyId,
                    'GST_INPUT'
                );
                postings.push({
                    ledgerId: gstInputLedgerId,
                    amount: expense.gstAmount,
                    type: 'DEBIT' as PostingType,
                    narration: `GST on ${expense.description}`
                });
            } catch (e) {
                // Fallback: Add GST to expense cost if ledger missing
                postings[0].amount += expense.gstAmount;
            }
        }

        // voucherNumber generated in createVoucher

        await accountingService.createVoucher({
            // voucherNumber auto-generated
            date: expense.date,
            type: 'PAYMENT',
            referenceType: 'EXPENSE',
            referenceId: expense.id,
            narration: expense.description,
            companyId: expense.companyId,
            postings
        });

        logger.info(`Posted Expense ${expense.id} to ledger`);
    } catch (error) {
        logger.error('Error posting expense:', error);
    }
}

/**
 * Post a Payment (Receipt or Payment)
 * Receipt Entry:
 *   Dr. Cash / Bank              - Amount
 *   Cr. Sundry Debtors (Customer) - Amount
 * Payment Entry:
 *   Dr. Sundry Creditors (Supplier) - Amount
 *   Cr. Cash / Bank                 - Amount
 */
export async function postPayment(payment: PaymentData, tx: any = prisma): Promise<void> {
    try {
        // Get party ledger
        const partyLedgerId = await accountingService.getOrCreatePartyLedger(
            payment.companyId,
            payment.partyId,
            tx
        );

        // Get cash/bank ledger
        const cashLedgerId = await accountingService.getSystemLedgerByCode(
            payment.companyId,
            payment.mode === 'CASH' ? 'CASH' : 'BANK_ACCOUNTS',
            tx
        );

        const isReceipt = payment.type === 'RECEIVED';
        const voucherType: VoucherType = isReceipt ? 'RECEIPT' : 'PAYMENT';

        // voucherNumber generated in createVoucher

        const postings = isReceipt
            ? [
                { ledgerId: cashLedgerId, amount: payment.amount, type: 'DEBIT' as PostingType },
                { ledgerId: partyLedgerId, amount: payment.amount, type: 'CREDIT' as PostingType }
            ]
            : [
                { ledgerId: partyLedgerId, amount: payment.amount, type: 'DEBIT' as PostingType },
                { ledgerId: cashLedgerId, amount: payment.amount, type: 'CREDIT' as PostingType }
            ];

        await accountingService.createVoucher({
            // voucherNumber auto-generated
            date: payment.date,
            type: voucherType,
            referenceType: isReceipt ? 'RECEIPT' : 'PAYMENT',
            referenceId: payment.id,
            narration: `${isReceipt ? 'Receipt from' : 'Payment to'} party`,
            companyId: payment.companyId,
            postings
        }, tx);

        logger.info(`Posted ${voucherType} ${payment.id} to ledger`);
    } catch (error) {
        logger.error('Error posting payment:', error);
    }
}

/**
 * Post a Cleared PDC to ledger
 * Receipt Entry:
 *   Dr. Bank Accounts            - Amount
 *   Cr. Sundry Debtors (Customer) - Amount
 * Payment Entry:
 *   Dr. Sundry Creditors (Supplier) - Amount
 *   Cr. Bank Accounts               - Amount
 */
export async function postPDCClear(pdc: PDCData): Promise<void> {
    try {
        // Get party ledger
        const partyLedgerId = await accountingService.getOrCreatePartyLedger(
            pdc.companyId,
            pdc.partyId
        );

        // Get bank ledger (PDCs always clear through bank)
        const bankLedgerId = await accountingService.getSystemLedgerByCode(
            pdc.companyId,
            'BANK_ACCOUNTS'
        );

        const isReceipt = pdc.type === 'RECEIVED';
        const voucherType: VoucherType = isReceipt ? 'RECEIPT' : 'PAYMENT';

        // voucherNumber generated in createVoucher

        const postings = isReceipt
            ? [
                { ledgerId: bankLedgerId, amount: pdc.amount, type: 'DEBIT' as PostingType, narration: 'PDC Cleared' },
                { ledgerId: partyLedgerId, amount: pdc.amount, type: 'CREDIT' as PostingType, narration: 'PDC Cleared' }
            ]
            : [
                { ledgerId: partyLedgerId, amount: pdc.amount, type: 'DEBIT' as PostingType, narration: 'PDC Cleared' },
                { ledgerId: bankLedgerId, amount: pdc.amount, type: 'CREDIT' as PostingType, narration: 'PDC Cleared' }
            ];

        await accountingService.createVoucher({
            // voucherNumber auto-generated
            date: pdc.clearedAt,
            type: voucherType,
            referenceType: 'POST_DATED_CHEQUE',
            referenceId: pdc.pdcId,
            narration: `PDC Cleared - ${isReceipt ? 'Receipt' : 'Payment'}`,
            companyId: pdc.companyId,
            postings
        });

        logger.info(`Posted PDC Clear ${pdc.pdcId} to ledger`);
    } catch (error) {
        logger.error('Error posting PDC clear:', error);
    }
}

/**
 * Post a Stock Adjustment to ledger
 * 
 * INCREASE (found extra stock):
 *   Dr. Stock/Inventory Account  - Value
 *   Cr. Stock Adjustment Income  - Value
 * 
 * DECREASE/WRITE_OFF/DAMAGE:
 *   Dr. Stock Adjustment Expense - Value
 *   Cr. Stock/Inventory Account  - Value
 */
export async function postStockAdjustment(adjustment: StockAdjustmentData): Promise<void> {
    try {
        // Get Stock/Inventory ledger
        let stockLedgerId: string;
        try {
            stockLedgerId = await accountingService.getSystemLedgerByCode(
                adjustment.companyId,
                'STOCK_IN_HAND'
            );
        } catch {
            // Fallback to creating one or using misc
            stockLedgerId = await accountingService.getSystemLedgerByCode(
                adjustment.companyId,
                'CURRENT_ASSETS'
            );
        }

        // Get adjustment ledger based on type
        let adjustmentLedgerId: string;
        let isIncrease = adjustment.type === 'INCREASE';

        try {
            if (isIncrease) {
                adjustmentLedgerId = await accountingService.getSystemLedgerByCode(
                    adjustment.companyId,
                    'OTHER_INCOME'
                );
            } else {
                adjustmentLedgerId = await accountingService.getSystemLedgerByCode(
                    adjustment.companyId,
                    'MISC_EXPENSES'
                );
            }
        } catch {
            // Use fallback
            adjustmentLedgerId = await accountingService.getSystemLedgerByCode(
                adjustment.companyId,
                isIncrease ? 'SALES_GOODS' : 'OFFICE_EXPENSES'
            );
        }

        // voucherNumber generated in createVoucher

        const postings = isIncrease
            ? [
                {
                    ledgerId: stockLedgerId,
                    amount: adjustment.totalValue,
                    type: 'DEBIT' as PostingType,
                    narration: `Stock Increase - ${adjustment.reason}`
                },
                {
                    ledgerId: adjustmentLedgerId,
                    amount: adjustment.totalValue,
                    type: 'CREDIT' as PostingType,
                    narration: `Stock Adjustment Income`
                }
            ]
            : [
                {
                    ledgerId: adjustmentLedgerId,
                    amount: adjustment.totalValue,
                    type: 'DEBIT' as PostingType,
                    narration: `Stock ${adjustment.type} - ${adjustment.reason}`
                },
                {
                    ledgerId: stockLedgerId,
                    amount: adjustment.totalValue,
                    type: 'CREDIT' as PostingType,
                    narration: `Stock Reduction`
                }
            ];

        await accountingService.createVoucher({
            // voucherNumber auto-generated
            date: adjustment.date,
            type: 'JOURNAL',
            referenceType: 'STOCK_ADJUSTMENT',
            referenceId: adjustment.adjustmentId,
            narration: `Stock Adjustment ${adjustment.adjustmentNumber} - ${adjustment.type}: ${adjustment.reason}`,
            companyId: adjustment.companyId,
            postings
        });

        logger.info(`Posted Stock Adjustment ${adjustment.adjustmentNumber} to ledger`);
    } catch (error) {
        logger.error('Error posting stock adjustment:', error);
    }
}

/**
 * Cancel a Stock Adjustment Ledger
 */
export async function cancelStockAdjustment(adjustmentId: string, companyId: string): Promise<void> {
    try {
        const voucher = await prisma.voucher.findFirst({
            where: { referenceId: adjustmentId, referenceType: 'STOCK_ADJUSTMENT', companyId }
        });

        if (voucher) {
            await accountingService.updateVoucherStatus(voucher.id, 'CANCELLED');
            logger.info(`Cancelled Ledger for Stock Adjustment ${adjustmentId}`);
        }
    } catch (error) {
        logger.error('Error cancelling stock adjustment ledger:', error);
    }
}


/**
 * Post a Debit Note to ledger
 * Entry (Purchase Return):
 *   Dr. Sundry Creditors (Supplier) - Total Amount (Reverses Liability)
 *   Cr. Purchase Return             - Subtotal     (Reduces Expense)
 *   Cr. GST Input Credit            - Tax Amount   (Reverses ITC)
 */
export async function postDebitNote(note: DebitNoteData): Promise<void> {
    try {
        // 1. Get ledgers
        const supplierLedgerId = await accountingService.getOrCreatePartyLedger(note.companyId, note.supplierId);
        const purchaseReturnLedgerId = await accountingService.getSystemLedgerByCode(note.companyId, 'PURCHASE_RETURN');

        let gstInputLedgerId: string | null = null;
        if (note.taxAmount > 0) {
            try {
                gstInputLedgerId = await accountingService.getSystemLedgerByCode(note.companyId, 'GST_INPUT');
            } catch (e) {
                logger.warn('GST_INPUT ledger missing for Debit Note');
            }
        }

        // voucherNumber generated in createVoucher

        // 2. Prepare Postings
        const postings = [];

        // Debit Supplier (Reduce Liability)
        postings.push({
            ledgerId: supplierLedgerId,
            amount: note.totalAmount,
            type: 'DEBIT' as PostingType,
            narration: `Debit Note ${note.debitNoteNumber}`
        });

        // Credit Purchase Return
        postings.push({
            ledgerId: purchaseReturnLedgerId,
            amount: note.subtotal,
            type: 'CREDIT' as PostingType,
            narration: `Return Basic Value`
        });

        // Credit GST Input (Reverse Input Tax Credit)
        if (note.taxAmount > 0 && gstInputLedgerId) {
            postings.push({
                ledgerId: gstInputLedgerId,
                amount: note.taxAmount,
                type: 'CREDIT' as PostingType,
                narration: `Reverse ITC`
            });
        } else if (note.taxAmount > 0) {
            // Fallback: Add tax to Purchase Return if GST ledger missing
            const returnEntry = postings.find(p => p.ledgerId === purchaseReturnLedgerId);
            if (returnEntry) {
                returnEntry.amount += note.taxAmount;
            }
        }

        // 3. Create Voucher
        await accountingService.createVoucher({
            // voucherNumber auto-generated
            date: note.date,
            type: 'JOURNAL', // Use Journal for Adjustments
            referenceType: 'DEBIT_NOTE',
            referenceId: note.debitNoteId,
            narration: `Debit Note ${note.debitNoteNumber} - Purchase Return`,
            companyId: note.companyId,
            postings
        });

        console.log(`Posted Debit Note ${note.debitNoteNumber}`);

    } catch (error) {
        console.error('Error posting Debit Note:', error);
    }
}

/**
 * Post a Credit Note to ledger
 * Entry (Sales Return):
 *   Dr. Sales Return                - Subtotal     (Reduces Income)
 *   Dr. GST Payable                 - Tax Amount   (Reverses Output Tax)
 *   Cr. Sundry Debtors (Customer)   - Total Amount (Reduces Receivable)
 */
export async function postCreditNote(note: CreditNoteData): Promise<void> {
    try {
        // 1. Get ledgers
        const customerLedgerId = await accountingService.getOrCreatePartyLedger(note.companyId, note.customerId);
        let salesReturnLedgerId: string;

        try {
            salesReturnLedgerId = await accountingService.getSystemLedgerByCode(note.companyId, 'SALES_RETURN');
        } catch {
            // Fallback
            salesReturnLedgerId = await accountingService.getSystemLedgerByCode(note.companyId, 'SALES_GOODS');
        }

        let gstPayableLedgerId: string | null = null;
        if (note.totalTax > 0) {
            try {
                gstPayableLedgerId = await accountingService.getSystemLedgerByCode(note.companyId, 'GST_PAYABLE');
            } catch (e) {
                console.warn('GST_PAYABLE ledger missing for Credit Note');
            }
        }

        // voucherNumber generated in createVoucher

        // 2. Prepare Postings
        const postings = [];

        // Debit Sales Return (Reduce Income)
        postings.push({
            ledgerId: salesReturnLedgerId,
            amount: note.subtotal,
            type: 'DEBIT' as PostingType, // Sales is Credit, Return is Debit
            narration: `Return Basic Value`
        });

        // Debit GST Payable (Reverse Output Tax)
        if (note.totalTax > 0 && gstPayableLedgerId) {
            postings.push({
                ledgerId: gstPayableLedgerId,
                amount: note.totalTax,
                type: 'DEBIT' as PostingType,
                narration: 'Reverse Output Tax'
            });
        } else if (note.totalTax > 0) {
            // Fallback: Add tax to Sales Return entry
            postings[0].amount += note.totalTax;
        }

        // Credit Customer (Reduce Receivable)
        postings.push({
            ledgerId: customerLedgerId,
            amount: note.totalAmount,
            type: 'CREDIT' as PostingType,
            narration: `Credit Note ${note.creditNoteNumber}`
        });

        // 3. Create Voucher
        await accountingService.createVoucher({
            // voucherNumber auto-generated
            date: note.date,
            type: 'JOURNAL', // Use Journal for Adjustments
            referenceType: 'CREDIT_NOTE',
            referenceId: note.id,
            narration: `Credit Note ${note.creditNoteNumber} - Sales Return`,
            companyId: note.companyId,
            postings
        });

        console.log(`Posted Credit Note ${note.creditNoteNumber}`);

    } catch (error) {
        console.error('Error posting Credit Note:', error);
    }
}

/**
 * Post Manufacturing Journal (FG Production)
 * Entry:
 *   Dr. Finished Goods (Asset)    - Total Cost
 *   Cr. Raw Materials (Asset)     - Total Cost
 *   (or Cr. Work In Progress if using WIP)
 */
export async function postManufacturingJournal(data: ManufacturingData): Promise<void> {
    try {
        const fgLedgerId = await accountingService.getSystemLedgerByCode(data.companyId, 'STOCK_IN_HAND'); // Or specific FG Ledger
        const rmLedgerId = await accountingService.getSystemLedgerByCode(data.companyId, 'PURCHASE_GOODS'); // Simplifying: Reducing Purchase Cost
        // Ideally: RM Asset -> WIP -> FG Asset. 
        // MVP: Debit Stock (FG value up), Credit Purchases (Consumed RM value moved)

        const postings = [
            {
                ledgerId: fgLedgerId,
                amount: data.totalCost,
                type: 'DEBIT' as PostingType,
                narration: `Production of ${data.quantityProduced} ${data.finishedProductName}`
            },
            {
                ledgerId: rmLedgerId,
                amount: data.totalCost,
                type: 'CREDIT' as PostingType,
                narration: `RM Consumption for ${data.orderNumber}`
            }
        ];

        await accountingService.createVoucher({
            date: data.date,
            type: 'JOURNAL',
            referenceType: 'WORK_ORDER',
            referenceId: data.workOrderId,
            narration: `Manufacturing: ${data.orderNumber}`,
            companyId: data.companyId,
            postings
        });
        console.log(`Posted Manufacturing Journal for ${data.orderNumber}`);
    } catch (error) {
        console.error('Error posting Manufacturing Journal:', error);
    }
}

/**
 * Post Payroll Journal
 * Entry:
 *   Dr. Salary Expense            - Gross Pay (Basic + Additions)
 *   Cr. Salary Payable (Liability)- Net Pay
 *   (Deductions handling skipped for MVP - ideally Cr. TDS/PF Payable)
 */
export async function postPayrollJournal(data: PayrollData): Promise<void> {
    try {
        const salaryExpenseId = await accountingService.getSystemLedgerByCode(data.companyId, 'SALARY_EXPENSE');
        const salaryPayableId = await accountingService.getSystemLedgerByCode(data.companyId, 'SALARY_PAYABLE');

        const grossPay = data.basic + data.additions;

        const postings = [
            {
                ledgerId: salaryExpenseId,
                amount: grossPay,
                type: 'DEBIT' as PostingType,
                narration: `Salary Expense: ${data.employeeName}`
            },
            {
                ledgerId: salaryPayableId,
                amount: data.netPay, // Assuming Deductions reduce payout but might need separate liability ledgers
                type: 'CREDIT' as PostingType,
                narration: `Salary Payable: ${data.employeeName}`
            }
        ];

        // Handle deduction difference if any (e.g. Put to Other Income or Liability for MVP to balance)
        // Or if Deductions > 0, we credit that to Retention/TDS ledger
        if (grossPay > data.netPay) { // Deductions exist
            const diff = grossPay - data.netPay;
            // For now, let's credit to same payable or a deductions ledger if exists, else it stays unbalanced?
            // Vouchers MUST balance.
            // Dr Expense (100)
            // Cr Payable (90)
            // Cr Deductions (10) - Let's assume deductions are internal/liability
            try {
                const deductionLedgerId = await accountingService.getSystemLedgerByCode(data.companyId, 'DUTIES_TAXES'); // Placeholder
                postings.push({
                    ledgerId: deductionLedgerId,
                    amount: diff,
                    type: 'CREDIT' as PostingType,
                    narration: 'Payroll Deductions'
                });
            } catch {
                // Determine if we just reduce expense recording or what.
                // Safest: Credit Payable (make it gross) and then perform payment of net? 
                // No, standard is Dr Expense, Cr Payable.
                // Let's force balance on Payable for MVP if deduction ledger missing, or log warning.
                postings[1].amount += diff; // Add back to payable so it effectively ignores deduction separation
            }
        }

        await accountingService.createVoucher({
            date: data.date,
            type: 'JOURNAL', // Accrual basis
            referenceType: 'PAYROLL',
            referenceId: data.payrollId,
            narration: `Payroll for ${data.month}: ${data.employeeName}`,
            companyId: data.companyId,
            postings
        });
        console.log(`Posted Payroll Journal for ${data.employeeName}`);
    } catch (error) {
        console.error('Error posting Payroll Journal:', error);
    }
}

/**
 * Post Direct Bank Transaction
 * Logic: Matches category to Expense Ledger or default Suspense
 */
export async function postBankTransaction(data: BankTransactionData): Promise<void> {
    try {
        const bankLedgerId = await accountingService.getSystemLedgerByCode(data.companyId, 'BANK_ACCOUNTS');

        // Find Contra Ledger (Expense/Income)
        // Try mapping Category -> Ledger Code
        let contraLedgerId: string;
        try {
            contraLedgerId = await accountingService.getSystemLedgerByCode(data.companyId, data.category.toUpperCase().replace(/\s+/g, '_'));
        } catch {
            // Fallback
            contraLedgerId = await accountingService.getSystemLedgerByCode(
                data.companyId,
                data.type === 'debit' ? 'MISC_EXPENSES' : 'OTHER_INCOME'
            );
        }

        const isDeposit = data.type === 'credit'; // Money In
        // Deposit: Dr Bank, Cr Income/Party
        // Withdrawal: Dr Expense/Party, Cr Bank

        const postings = isDeposit ? [
            { ledgerId: bankLedgerId, amount: data.amount, type: 'DEBIT' as PostingType },
            { ledgerId: contraLedgerId, amount: data.amount, type: 'CREDIT' as PostingType }
        ] : [
            { ledgerId: contraLedgerId, amount: data.amount, type: 'DEBIT' as PostingType },
            { ledgerId: bankLedgerId, amount: data.amount, type: 'CREDIT' as PostingType }
        ];

        await accountingService.createVoucher({
            date: data.date,
            type: isDeposit ? 'RECEIPT' : 'PAYMENT',
            referenceType: 'BANK_TRANSACTION',
            referenceId: data.transactionId,
            narration: `${data.type.toUpperCase()}: ${data.description}`,
            companyId: data.companyId,
            postings
        });
        console.log(`Posted Bank Transaction ${data.transactionId}`);
    } catch (error) {
        console.error('Error posting Bank Transaction:', error);
    }
}

/**
 * Phase 9: Post Wastage to ledger
 * Entry:
 *   Dr. Stock Loss / Production Loss (Expense) - Estimated Cost
 *   Cr. Stock-in-Hand / Inventory (Asset)      - Estimated Cost
 */
export async function postWastage(wastage: WastageData): Promise<void> {
    try {
        if (wastage.estimatedCost <= 0) {
            console.log(`Skipping wastage posting for ${wastage.wastageId} - no cost`);
            return;
        }

        // Get Stock/Inventory ledger
        let stockLedgerId: string;
        try {
            stockLedgerId = await accountingService.getSystemLedgerByCode(
                wastage.companyId,
                'STOCK_IN_HAND'
            );
        } catch {
            stockLedgerId = await accountingService.getSystemLedgerByCode(
                wastage.companyId,
                'CURRENT_ASSETS'
            );
        }

        // Get loss ledger
        let lossLedgerId: string;
        try {
            lossLedgerId = await accountingService.getSystemLedgerByCode(
                wastage.companyId,
                'STOCK_LOSS'
            );
        } catch {
            lossLedgerId = await accountingService.getSystemLedgerByCode(
                wastage.companyId,
                'MISC_EXPENSES'
            );
        }

        const postings = [
            {
                ledgerId: lossLedgerId,
                amount: wastage.estimatedCost,
                type: 'DEBIT' as PostingType,
                narration: `Wastage Loss: ${wastage.productName} (${wastage.reason})`
            },
            {
                ledgerId: stockLedgerId,
                amount: wastage.estimatedCost,
                type: 'CREDIT' as PostingType,
                narration: `Stock Reduction: ${wastage.quantity} units`
            }
        ];

        await accountingService.createVoucher({
            date: wastage.date,
            type: 'JOURNAL',
            referenceType: 'WASTAGE',
            referenceId: wastage.wastageId,
            narration: `Wastage: ${wastage.productName} - ${wastage.reason}`,
            companyId: wastage.companyId,
            postings
        });

        console.log(`Posted Wastage ${wastage.wastageId} to ledger`);
    } catch (error) {
        console.error('Error posting wastage:', error);
    }
}

// ========== ESCROW POSTING (Prompt 3) ==========

export interface EscrowCreationData {
    companyId: string;
    escrowId: string;
    escrowNumber: string;
    amount: number;
    payerId: string;
    payeeId: string;
    date: Date;
}

export interface EscrowReleaseData {
    companyId: string;
    escrowId: string;
    escrowNumber: string;
    amount: number;
    payeeId: string;
    date: Date;
}

/**
 * Post Escrow Creation (Funds Held)
 * Dr. Bank Accounts (Asset)
 * Cr. Escrow Payable (Liability)
 */
export async function postEscrowCreation(data: EscrowCreationData, tx: any = prisma): Promise<void> {
    try {
        // Get Bank Ledger (Assuming funds received in Bank)
        const bankLedgerId = await accountingService.getSystemLedgerByCode(data.companyId, 'BANK_ACCOUNTS', tx);

        // Get or Create Escrow Payable Ledger (Liability)
        let escrowLedgerId: string;
        try {
            escrowLedgerId = await accountingService.getSystemLedgerByCode(data.companyId, 'ESCROW_PAYABLE', tx);
        } catch {
            // Create if missing? Or map to Suspense/Liability
            // For now, assume it might need creation logic or fallback
            escrowLedgerId = await accountingService.getSystemLedgerByCode(data.companyId, 'CURRENT_LIABILITIES', tx);
        }

        const postings = [
            {
                ledgerId: bankLedgerId,
                amount: data.amount,
                type: 'DEBIT' as PostingType,
                narration: `Escrow Funds Received - ${data.escrowNumber}`
            },
            {
                ledgerId: escrowLedgerId,
                amount: data.amount,
                type: 'CREDIT' as PostingType,
                narration: `Escrow Held for ${data.payeeId}`
            }
        ];

        await accountingService.createVoucher({
            date: data.date,
            type: 'JOURNAL', // Or PAYMENT/RECEIPT depending on perspective. JOURNAL is safe.
            referenceType: 'ESCROW',
            referenceId: data.escrowId,
            narration: `Escrow Creation ${data.escrowNumber}`,
            companyId: data.companyId,
            postings
        }, tx);

        console.log(`Posted Escrow Creation ${data.escrowNumber}`);
    } catch (error) {
        console.error('Error posting escrow creation:', error);
    }
}

/**
 * Post Escrow Release (Funds Payout)
 * Dr. Escrow Payable (Liability)
 * Cr. Bank Accounts (Asset) - or Party Payable if intermediate
 */
export async function postEscrowRelease(data: EscrowReleaseData, tx: any = prisma): Promise<void> {
    try {
        const bankLedgerId = await accountingService.getSystemLedgerByCode(data.companyId, 'BANK_ACCOUNTS', tx);

        let escrowLedgerId: string;
        try {
            escrowLedgerId = await accountingService.getSystemLedgerByCode(data.companyId, 'ESCROW_PAYABLE', tx);
        } catch {
            escrowLedgerId = await accountingService.getSystemLedgerByCode(data.companyId, 'CURRENT_LIABILITIES', tx);
        }

        const postings = [
            {
                ledgerId: escrowLedgerId,
                amount: data.amount,
                type: 'DEBIT' as PostingType,
                narration: `Escrow Released - ${data.escrowNumber}`
            },
            {
                ledgerId: bankLedgerId,
                amount: data.amount,
                type: 'CREDIT' as PostingType,
                narration: `Payout to ${data.payeeId}`
            }
        ];

        await accountingService.createVoucher({
            date: data.date,
            type: 'PAYMENT',
            referenceType: 'ESCROW',
            referenceId: data.escrowId,
            narration: `Escrow Release ${data.escrowNumber}`,
            companyId: data.companyId,
            postings
        }, tx);

        console.log(`Posted Escrow Release ${data.escrowNumber}`);
    } catch (error) {
        console.error('Error posting escrow release:', error);
    }
}

export default {
    postSalesInvoice,
    postPurchaseBill,
    postExpense,
    postPayment,
    postPDCClear,
    postCreditNote,
    postDebitNote,
    postStockAdjustment,
    postManufacturingJournal,
    postPayrollJournal,
    postBankTransaction,
    postWastage,
    postEscrowCreation,
    postEscrowRelease
};

/**
 * Posting Service
 * Automatically creates ledger postings when financial transactions occur
 */

import { PrismaClient, VoucherType, PostingType } from '@prisma/client';
import accountingService from './accountingService';

const prisma = new PrismaClient();

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

interface PurchaseBillData {
    id: string;
    billNumber: string;
    billDate: Date;
    supplierId: string;
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    companyId: string;
}

interface ExpenseData {
    id: string;
    description: string;
    date: Date;
    amount: number;
    category: string;
    paymentMode: string; // CASH, BANK
    bankAccountId?: string;
    companyId: string;
}

interface PaymentData {
    id: string;
    date: Date;
    partyId: string;
    amount: number;
    type: 'RECEIVED' | 'MADE';
    mode: 'CASH' | 'BANK' | 'UPI';
    bankAccountId?: string;
    invoiceId?: string;
    billId?: string;
    companyId: string;
}

/**
 * Post a Sales Invoice to ledger
 * Entry: 
 *   Dr. Sundry Debtors (Customer)  - Total Amount
 *   Cr. Sales Account              - Subtotal
 *   Cr. GST Payable                - Tax Amount
 */
export async function postSalesInvoice(invoice: InvoiceData): Promise<void> {
    try {
        // Get or create customer ledger
        const customerLedgerId = await accountingService.getOrCreatePartyLedger(
            invoice.companyId,
            invoice.customerId
        );

        // Get system ledgers
        const salesLedgerId = await accountingService.getSystemLedgerByCode(
            invoice.companyId,
            'SALES_GOODS'
        );

        const postings: any[] = [
            {
                ledgerId: customerLedgerId,
                amount: invoice.totalAmount,
                type: 'DEBIT' as PostingType,
                narration: `Sales Invoice ${invoice.invoiceNumber}`
            },
            {
                ledgerId: salesLedgerId,
                amount: invoice.subtotal,
                type: 'CREDIT' as PostingType,
                narration: `Sales Invoice ${invoice.invoiceNumber}`
            }
        ];

        // Add GST posting if there's tax
        if (invoice.totalTax > 0) {
            const gstLedgerId = await accountingService.getSystemLedgerByCode(
                invoice.companyId,
                'CGST_PAYABLE' // Simplified - in real app, split CGST/SGST/IGST
            );
            postings.push({
                ledgerId: gstLedgerId,
                amount: invoice.totalTax,
                type: 'CREDIT' as PostingType,
                narration: `GST on Invoice ${invoice.invoiceNumber}`
            });
        }

        // Add Discount Allowed (Debit Expense)
        if (invoice.discountAmount && invoice.discountAmount > 0) {
            const discountLedgerId = await accountingService.getSystemLedgerByCode(
                invoice.companyId,
                'DISCOUNT_ALLOWED'
            );
            postings.push({
                ledgerId: discountLedgerId,
                amount: invoice.discountAmount,
                type: 'DEBIT' as PostingType,
                narration: `Discount on Invoice ${invoice.invoiceNumber}`
            });
        }

        // Add Round Off (Debit or Credit)
        // Formula: Total = Sub + Tax - Disc + Round
        // If Round > 0 (e.g. +0.40 to round up), we effectively earned more or customer pays more? 
        // Logic: Customer pays 100.40. Sub+Tax=100. Round=0.40.
        // Dr Customer 100.40. Cr Sales 100. Diff 0.40 Credit needed.
        // So Round > 0 -> Credit RoundOff (Income/Gain)
        // If Round < 0 (e.g. -0.40 to round down). Customer pays 99.60. Sub+Tax=100.
        // Dr Customer 99.60. Cr Sales 100. Diff 0.40 Debit needed.
        // So Round < 0 -> Debit RoundOff (Expense/Loss)

        if (invoice.roundOff && invoice.roundOff !== 0) {
            const roundOffLedgerId = await accountingService.getSystemLedgerByCode(
                invoice.companyId,
                'ROUND_OFF'
            );
            const isGain = invoice.roundOff > 0;
            postings.push({
                ledgerId: roundOffLedgerId,
                amount: Math.abs(invoice.roundOff),
                type: isGain ? 'CREDIT' as PostingType : 'DEBIT' as PostingType,
                narration: `Round Off on Invoice ${invoice.invoiceNumber}`
            });
        }

        const voucherNumber = await accountingService.getNextVoucherNumber(
            invoice.companyId,
            'SALES'
        );

        await accountingService.createVoucher({
            voucherNumber,
            date: invoice.invoiceDate,
            type: 'SALES',
            referenceType: 'INVOICE',
            referenceId: invoice.id,
            narration: `Sales Invoice ${invoice.invoiceNumber}`,
            companyId: invoice.companyId,
            postings
        });

        console.log(`Posted Sales Invoice ${invoice.invoiceNumber} to ledger`);
    } catch (error) {
        console.error('Error posting sales invoice:', error);
        // Don't throw - we don't want to fail the invoice creation
    }
}

/**
 * Post a Purchase Bill to ledger
 * Entry:
 *   Dr. Purchases Account          - Subtotal
 *   Dr. GST Input Credit           - Tax Amount
 *   Cr. Sundry Creditors (Supplier) - Total Amount
 */
export async function postPurchaseBill(bill: PurchaseBillData): Promise<void> {
    try {
        // Get or create supplier ledger
        const supplierLedgerId = await accountingService.getOrCreatePartyLedger(
            bill.companyId,
            bill.supplierId
        );

        // Get system ledgers
        const purchasesLedgerId = await accountingService.getSystemLedgerByCode(
            bill.companyId,
            'PURCHASES'
        );

        const postings: any[] = [
            {
                ledgerId: purchasesLedgerId,
                amount: bill.subtotal,
                type: 'DEBIT' as PostingType,
                narration: `Purchase Bill ${bill.billNumber}`
            },
            {
                ledgerId: supplierLedgerId,
                amount: bill.totalAmount,
                type: 'CREDIT' as PostingType,
                narration: `Purchase Bill ${bill.billNumber}`
            }
        ];

        // Add GST input credit if there's tax
        // Add GST input credit if there's tax
        if (bill.taxAmount > 0) {
            try {
                const gstInputLedgerId = await accountingService.getSystemLedgerByCode(
                    bill.companyId,
                    'GST_INPUT'
                );

                // Correct Accounting:
                // Dr. Purchases (Subtotal)
                // Dr. GST Input (Tax)
                // Cr. Supplier (Total)

                postings[0].amount = bill.subtotal; // Reduce purchases to subtotal

                // Insert GST Input Debit
                postings.splice(1, 0, {
                    ledgerId: gstInputLedgerId,
                    amount: bill.taxAmount,
                    type: 'DEBIT' as PostingType,
                    narration: `GST Input on Bill ${bill.billNumber}`
                });
            } catch (err) {
                console.warn('GST_INPUT ledger not found, falling back to simplified posting (merged with purchases). Please re-seed ledgers.');
                // Fallback: Leave as is (Total Amount to Purchases)
                postings[0].amount = bill.totalAmount;
            }
        }

        const voucherNumber = await accountingService.getNextVoucherNumber(
            bill.companyId,
            'PURCHASE'
        );

        await accountingService.createVoucher({
            voucherNumber,
            date: bill.billDate,
            type: 'PURCHASE',
            referenceType: 'BILL',
            referenceId: bill.id,
            narration: `Purchase Bill ${bill.billNumber}`,
            companyId: bill.companyId,
            postings
        });

        console.log(`Posted Purchase Bill ${bill.billNumber} to ledger`);
    } catch (error) {
        console.error('Error posting purchase bill:', error);
    }
}

/**
 * Post an Expense to ledger
 * Entry:
 *   Dr. Expense Account    - Amount
 *   Cr. Cash / Bank        - Amount
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

        const voucherNumber = await accountingService.getNextVoucherNumber(
            expense.companyId,
            'PAYMENT'
        );

        await accountingService.createVoucher({
            voucherNumber,
            date: expense.date,
            type: 'PAYMENT',
            referenceType: 'EXPENSE',
            referenceId: expense.id,
            narration: expense.description,
            companyId: expense.companyId,
            postings: [
                {
                    ledgerId: expenseLedgerId,
                    amount: expense.amount,
                    type: 'DEBIT' as PostingType,
                    narration: expense.description
                },
                {
                    ledgerId: cashLedgerId,
                    amount: expense.amount,
                    type: 'CREDIT' as PostingType,
                    narration: expense.description
                }
            ]
        });

        console.log(`Posted Expense ${expense.id} to ledger`);
    } catch (error) {
        console.error('Error posting expense:', error);
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
export async function postPayment(payment: PaymentData): Promise<void> {
    try {
        // Get party ledger
        const partyLedgerId = await accountingService.getOrCreatePartyLedger(
            payment.companyId,
            payment.partyId
        );

        // Get cash/bank ledger
        const cashLedgerId = await accountingService.getSystemLedgerByCode(
            payment.companyId,
            payment.mode === 'CASH' ? 'CASH' : 'BANK_ACCOUNTS'
        );

        const isReceipt = payment.type === 'RECEIVED';
        const voucherType: VoucherType = isReceipt ? 'RECEIPT' : 'PAYMENT';

        const voucherNumber = await accountingService.getNextVoucherNumber(
            payment.companyId,
            voucherType
        );

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
            voucherNumber,
            date: payment.date,
            type: voucherType,
            referenceType: isReceipt ? 'RECEIPT' : 'PAYMENT',
            referenceId: payment.id,
            narration: `${isReceipt ? 'Receipt from' : 'Payment to'} party`,
            companyId: payment.companyId,
            postings
        });

        console.log(`Posted ${voucherType} ${payment.id} to ledger`);
    } catch (error) {
        console.error('Error posting payment:', error);
    }
}

export default {
    postSalesInvoice,
    postPurchaseBill,
    postExpense,
    postPayment,
    postCreditNote,
    postDebitNote
};
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
                console.warn('GST_INPUT ledger missing for Debit Note');
            }
        }

        const voucherNumber = await accountingService.getNextVoucherNumber(note.companyId, 'JOURNAL');

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
            voucherNumber,
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

        const voucherNumber = await accountingService.getNextVoucherNumber(note.companyId, 'JOURNAL');

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
            voucherNumber,
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

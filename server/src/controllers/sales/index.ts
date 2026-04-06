/**
 * Sales Controllers - Re-exports
 * 
 * This file re-exports all sales-related controllers for backward compatibility.
 * The original salesController.ts has been split into:
 * - invoiceController.ts (core CRUD)
 * - invoiceActionsController.ts (payment, status, PDF, email)
 */

// Invoice CRUD operations
export {
    getInvoices,
    getInvoice,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    searchInvoices
} from './invoiceController';

// Invoice actions (payments, PDF, email)
export {
    recordPayment,
    updateInvoiceStatus,
    downloadInvoicePDF,
    sendInvoiceEmail
} from './invoiceActionsController';

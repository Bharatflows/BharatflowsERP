/**
 * Sales Controllers - Re-exports
 *
 * This file re-exports all sales-related controllers for backward compatibility.
 * The original salesController.ts has been split into:
 * - invoiceController.ts (core CRUD)
 * - invoiceActionsController.ts (payment, status, PDF, email)
 */
export { getInvoices, getInvoice, createInvoice, updateInvoice, deleteInvoice, searchInvoices } from './invoiceController';
export { recordPayment, updateInvoiceStatus, downloadInvoicePDF, sendInvoiceEmail } from './invoiceActionsController';
//# sourceMappingURL=index.d.ts.map
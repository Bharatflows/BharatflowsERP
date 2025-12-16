"use strict";
/**
 * Sales Controllers - Re-exports
 *
 * This file re-exports all sales-related controllers for backward compatibility.
 * The original salesController.ts has been split into:
 * - invoiceController.ts (core CRUD)
 * - invoiceActionsController.ts (payment, status, PDF, email)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendInvoiceEmail = exports.downloadInvoicePDF = exports.updateInvoiceStatus = exports.recordPayment = exports.searchInvoices = exports.deleteInvoice = exports.updateInvoice = exports.createInvoice = exports.getInvoice = exports.getInvoices = void 0;
// Invoice CRUD operations
var invoiceController_1 = require("./invoiceController");
Object.defineProperty(exports, "getInvoices", { enumerable: true, get: function () { return invoiceController_1.getInvoices; } });
Object.defineProperty(exports, "getInvoice", { enumerable: true, get: function () { return invoiceController_1.getInvoice; } });
Object.defineProperty(exports, "createInvoice", { enumerable: true, get: function () { return invoiceController_1.createInvoice; } });
Object.defineProperty(exports, "updateInvoice", { enumerable: true, get: function () { return invoiceController_1.updateInvoice; } });
Object.defineProperty(exports, "deleteInvoice", { enumerable: true, get: function () { return invoiceController_1.deleteInvoice; } });
Object.defineProperty(exports, "searchInvoices", { enumerable: true, get: function () { return invoiceController_1.searchInvoices; } });
// Invoice actions (payments, PDF, email)
var invoiceActionsController_1 = require("./invoiceActionsController");
Object.defineProperty(exports, "recordPayment", { enumerable: true, get: function () { return invoiceActionsController_1.recordPayment; } });
Object.defineProperty(exports, "updateInvoiceStatus", { enumerable: true, get: function () { return invoiceActionsController_1.updateInvoiceStatus; } });
Object.defineProperty(exports, "downloadInvoicePDF", { enumerable: true, get: function () { return invoiceActionsController_1.downloadInvoicePDF; } });
Object.defineProperty(exports, "sendInvoiceEmail", { enumerable: true, get: function () { return invoiceActionsController_1.sendInvoiceEmail; } });
//# sourceMappingURL=index.js.map
"use strict";
/**
 * Reports Controllers - Re-exports
 *
 * This file re-exports all report-related controllers for backward compatibility.
 * The original reportsController.ts has been split into:
 * - financialReportsController.ts (P&L, Balance Sheet)
 * - agingReportsController.ts (Receivables, Payables aging)
 * - transactionReportsController.ts (Sales, Purchase, Inventory, Party Statement)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPartyStatement = exports.getInventoryReport = exports.getPurchaseReport = exports.getSalesReport = exports.getAgingPayables = exports.getAgingReceivables = exports.getDashboardSummary = exports.getBalanceSheet = exports.getProfitLoss = void 0;
// Financial Reports
var financialReportsController_1 = require("./financialReportsController");
Object.defineProperty(exports, "getProfitLoss", { enumerable: true, get: function () { return financialReportsController_1.getProfitLoss; } });
Object.defineProperty(exports, "getBalanceSheet", { enumerable: true, get: function () { return financialReportsController_1.getBalanceSheet; } });
Object.defineProperty(exports, "getDashboardSummary", { enumerable: true, get: function () { return financialReportsController_1.getDashboardSummary; } });
// Aging Reports
var agingReportsController_1 = require("./agingReportsController");
Object.defineProperty(exports, "getAgingReceivables", { enumerable: true, get: function () { return agingReportsController_1.getAgingReceivables; } });
Object.defineProperty(exports, "getAgingPayables", { enumerable: true, get: function () { return agingReportsController_1.getAgingPayables; } });
// Transaction Reports
var transactionReportsController_1 = require("./transactionReportsController");
Object.defineProperty(exports, "getSalesReport", { enumerable: true, get: function () { return transactionReportsController_1.getSalesReport; } });
Object.defineProperty(exports, "getPurchaseReport", { enumerable: true, get: function () { return transactionReportsController_1.getPurchaseReport; } });
Object.defineProperty(exports, "getInventoryReport", { enumerable: true, get: function () { return transactionReportsController_1.getInventoryReport; } });
Object.defineProperty(exports, "getPartyStatement", { enumerable: true, get: function () { return transactionReportsController_1.getPartyStatement; } });
//# sourceMappingURL=index.js.map
/**
 * Reports Controllers - Re-exports
 * 
 * This file re-exports all report-related controllers for backward compatibility.
 * The original reportsController.ts has been split into:
 * - financialReportsController.ts (P&L, Balance Sheet)
 * - agingReportsController.ts (Receivables, Payables aging)
 * - transactionReportsController.ts (Sales, Purchase, Inventory, Party Statement)
 */

// Financial Reports
export {
    getProfitLoss,
    getBalanceSheet,
    getDashboardSummary
} from './financialReportsController';

// Aging Reports
export {
    getAgingReceivables,
    getAgingPayables
} from './agingReportsController';

// Transaction Reports
export {
    getSalesReport,
    getPurchaseReport,
    getInventoryReport,
    getPartyStatement
} from './transactionReportsController';

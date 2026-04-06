import express from 'express';
import { protect } from '../middleware/auth';
import * as reportsController from '../controllers/reports';
import * as accountingController from '../controllers/accountingController';
import * as exportController from '../controllers/reports/exportController';
import * as ageingController from '../controllers/ageingController';

const router = express.Router();
router.use(protect);

// Financial Reports
router.get('/dashboard', reportsController.getDashboardSummary as any);
router.get('/profit-loss', accountingController.getProfitLoss as any);
router.get('/profit-loss-trends', reportsController.getProfitLossTrends as any);
router.get('/balance-sheet', accountingController.getBalanceSheet as any);
router.get('/cash-flow-forecast', reportsController.getCashFlowForecast as any);

// Aging Reports (Legacy)
router.get('/aging-receivables', reportsController.getAgingReceivables as any);
router.get('/aging-payables', reportsController.getAgingPayables as any);

// P0: Enhanced Ageing Reports with Party Breakdown
router.get('/ageing/receivables', ageingController.getReceivablesAgeing as any);
router.get('/ageing/payables', ageingController.getPayablesAgeing as any);
router.get('/ageing/msme-compliance', ageingController.getMSMEComplianceReport as any);

// Business Reports
router.get('/sales', reportsController.getSalesReport as any);
router.get('/purchase', reportsController.getPurchaseReport as any);
router.get('/inventory', reportsController.getInventoryReport as any);

// Party Statement
router.get('/party-statement/:partyId', reportsController.getPartyStatement as any);

// Export Reports (CSV/Excel)
router.get('/export/:type', exportController.exportReport as any);

// P2: Budget vs Actual
router.get('/budget-vs-actual', reportsController.getBudgetVsActual as any);
router.post('/budget', reportsController.saveBudget as any);
router.get('/budget-alerts', reportsController.getBudgetAlerts as any);

// P2: Supplier Dependency Analysis
router.get('/supplier-dependency', reportsController.analyzeConcentration as any);

// P2: Exchange Rates
router.get('/exchange-rates', reportsController.getExchangeRates as any);
router.post('/convert-currency', reportsController.convertCurrency as any);

export default router;

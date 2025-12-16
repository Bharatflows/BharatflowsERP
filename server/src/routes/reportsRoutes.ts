import express from 'express';
import { protect } from '../middleware/auth';
import * as reportsController from '../controllers/reports';
import * as exportController from '../controllers/reports/exportController';

const router = express.Router();
router.use(protect);

// Financial Reports
router.get('/dashboard', reportsController.getDashboardSummary);
router.get('/profit-loss', reportsController.getProfitLoss);
router.get('/balance-sheet', reportsController.getBalanceSheet);

// Aging Reports
router.get('/aging-receivables', reportsController.getAgingReceivables);
router.get('/aging-payables', reportsController.getAgingPayables);

// Business Reports
router.get('/sales', reportsController.getSalesReport);
router.get('/purchase', reportsController.getPurchaseReport);
router.get('/inventory', reportsController.getInventoryReport);

// Party Statement
router.get('/party-statement/:partyId', reportsController.getPartyStatement);

// Export Reports (CSV/Excel)
router.get('/export/:type', exportController.exportReport);

export default router;

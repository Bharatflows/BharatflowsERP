/**
 * Accounting Routes
 * API endpoints for Chart of Accounts, Vouchers, and Financial Reports
 */

import { Router } from 'express';
import accountingController, { cancelVoucher } from '../controllers/accountingController';
import * as receiptsController from '../controllers/accounting/receiptsController';
import * as reportsController from '../controllers/accounting/reportsController';
import currencyController from '../controllers/accounting/currencyController';
import budgetController from '../controllers/accounting/budgetController';
import { protect } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(protect);

// ==================== LEDGER GROUPS ====================
router.get('/ledger-groups', accountingController.getLedgerGroups);
router.post('/ledger-groups', accountingController.createLedgerGroup);
router.post('/seed-defaults', accountingController.seedDefaultGroups);

// ==================== LEDGERS (Chart of Accounts) ====================
router.get('/ledgers', accountingController.getLedgers);
router.post('/ledgers', accountingController.createLedger);
router.get('/ledgers/:id', accountingController.getLedger);
router.put('/ledgers/:id', accountingController.updateLedger);
router.get('/ledgers/:id/balance', accountingController.getLedgerBalance);

// ==================== VOUCHERS ====================
router.get('/vouchers', accountingController.getVouchers);
router.post('/vouchers', accountingController.createVoucher);
router.get('/vouchers/:id', accountingController.getVoucher);
router.post('/vouchers/:id/cancel', cancelVoucher);  // B5

// ==================== RECEIPTS (Party Payments) ====================
router.get('/receipts', receiptsController.getReceipts);
router.post('/receipts', receiptsController.createReceipt);

// Financial Reports
router.get('/reports/profit-loss', reportsController.getProfitLoss);
router.get('/reports/balance-sheet', reportsController.getBalanceSheet);

// ==================== REPORTS ====================
router.get('/trial-balance', accountingController.getTrialBalance);

// ==================== CURRENCIES ====================
router.get('/currencies', currencyController.getCurrencies);
// router.get('/currencies/common', currencyController.getCommonCurrencies);
router.get('/currencies/base', currencyController.getBaseCurrency);
// router.post('/currencies', currencyController.createCurrency);
// router.post('/currencies/initialize', currencyController.initializeDefaultCurrencies);
// router.post('/currencies/convert', currencyController.convertAmount);
// router.post('/currencies/convert-to-base', currencyController.convertToBaseCurrency);
// router.post('/currencies/forex-gain-loss', currencyController.calculateForexGainLoss);
// router.get('/currencies/:id', currencyController.getCurrency);
// router.put('/currencies/:id', currencyController.updateCurrency);
// router.delete('/currencies/:id', currencyController.deleteCurrency);
// router.post('/currencies/:id/set-base', currencyController.setBaseCurrency);
// router.post('/currencies/:id/exchange-rate', currencyController.updateExchangeRate);
// router.get('/currencies/:id/exchange-rate-history', currencyController.getExchangeRateHistory);

import costCenterController from '../controllers/accounting/costCenterController';

// ==================== COST CENTERS ====================
router.get('/cost-centers', costCenterController.getCostCenters);
router.post('/cost-centers', costCenterController.createCostCenter);
router.get('/cost-centers/:id', costCenterController.getCostCenter);
router.put('/cost-centers/:id', costCenterController.updateCostCenter);
router.delete('/cost-centers/:id', costCenterController.deleteCostCenter);

// ==================== BUDGETS ====================
router.get('/budgets', budgetController.getBudgets);
router.get('/budgets/summary', budgetController.getBudgetSummary);
router.post('/budgets', budgetController.createBudget);
router.post('/budgets/check-availability', budgetController.checkBudgetAvailability);
router.get('/budgets/:id', budgetController.getBudget);
router.put('/budgets/:id', budgetController.updateBudget);
router.delete('/budgets/:id', budgetController.deleteBudget);
router.get('/budgets/:id/variance-report', budgetController.getBudgetVarianceReport);
router.post('/budgets/:id/refresh-actuals', budgetController.refreshBudgetActuals);
router.post('/budgets/:id/items', budgetController.addBudgetItem);
router.put('/budgets/items/:itemId', budgetController.updateBudgetItem);
router.delete('/budgets/items/:itemId', budgetController.deleteBudgetItem);

export default router;

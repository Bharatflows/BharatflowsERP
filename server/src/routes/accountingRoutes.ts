/**
 * Accounting Routes
 * API endpoints for Chart of Accounts, Vouchers, and Financial Reports
 */

import { Router } from 'express';
import accountingController from '../controllers/accountingController';
import * as receiptsController from '../controllers/accounting/receiptsController';
import * as reportsController from '../controllers/accounting/reportsController';
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
router.get('/ledgers/:id/balance', accountingController.getLedgerBalance);

// ==================== VOUCHERS ====================
router.get('/vouchers', accountingController.getVouchers);
router.post('/vouchers', accountingController.createVoucher);
router.get('/vouchers/:id', accountingController.getVoucher);

// ==================== RECEIPTS (Party Payments) ====================
router.get('/receipts', receiptsController.getReceipts);
router.post('/receipts', receiptsController.createReceipt);

// Financial Reports
router.get('/reports/profit-loss', reportsController.getProfitLoss);
router.get('/reports/balance-sheet', reportsController.getBalanceSheet);

// ==================== REPORTS ====================
router.get('/trial-balance', accountingController.getTrialBalance);

export default router;

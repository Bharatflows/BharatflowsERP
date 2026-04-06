import express from 'express';
import { protect, ProtectedRequest, checkCustomRole } from '../middleware/auth';
import { sensitiveOpsLimiter } from '../middleware/rateLimiter';
import {
    getAccounts,
    getAccount,
    createAccount,
    updateAccount,
    deleteAccount,
    getTransactions,
    createTransaction,
    deleteTransaction,
    getDashboardSummary,
    getCashFlowTrends,
    getCashFlowForecast,
    getPaymentReminders,
    createPaymentReminder,
    updatePaymentReminder,
    deletePaymentReminder,
    sendReminder,
    syncBankAccount
} from '../controllers/bankingController';
import * as pdcController from '../controllers/pdcController';
import logger from '../config/logger';

const router = express.Router();

router.use(protect);
router.use(sensitiveOpsLimiter); // Strict rate limiting for financial operations
router.use(checkCustomRole('banking.view')); // Base permission for all banking routes

// Dashboard
router.get('/dashboard', getDashboardSummary);
router.get('/cash-flow-trends', getCashFlowTrends);
router.get('/cash-flow-forecast', getCashFlowForecast);

// P1: Cashflow Projection (forward-looking based on receivables/payables)
router.get('/cashflow-projection', async (req, res) => {
    try {
        const cashflowService = (await import('../services/cashflowProjectionService')).default;
        const companyId = (req as unknown as ProtectedRequest).user.companyId;
        const projection = await cashflowService.generateProjection(companyId, 90);
        res.json({ success: true, data: projection });
    } catch (error: any) {
        logger.error('Cashflow projection error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Bank Accounts
router.route('/accounts')
    .get(getAccounts)
    .post(createAccount);

router.route('/accounts/:id')
    .get(getAccount)
    .put(updateAccount)
    .delete(deleteAccount);

router.post('/accounts/:id/sync', syncBankAccount);

// Transactions
router.route('/transactions')
    .get(getTransactions)
    .post(createTransaction);

router.route('/transactions/:id')
    .delete(deleteTransaction);

// Payment Reminders
router.route('/reminders')
    .get(getPaymentReminders)
    .post(createPaymentReminder);

router.route('/reminders/:id')
    .put(updatePaymentReminder)
    .delete(deletePaymentReminder);

router.post('/reminders/:id/send', sendReminder);

// P0-10: Post-Dated Cheques (PDC)
router.get('/pdcs/reminders', pdcController.getPDCReminders);
router.get('/pdcs', pdcController.getPDCs);
router.get('/pdcs/:id', pdcController.getPDC);
router.post('/pdcs', pdcController.createPDC);
router.post('/pdcs/:id/deposit', pdcController.depositPDC);
router.post('/pdcs/:id/clear', pdcController.clearPDC);
router.post('/pdcs/:id/bounce', pdcController.bouncePDC);

export default router;

import express from 'express';
import { protect } from '../middleware/auth';
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
    getPaymentReminders,
    createPaymentReminder,
    updatePaymentReminder,
    deletePaymentReminder,
    sendReminder
} from '../controllers/bankingController';

const router = express.Router();

router.use(protect);

// Dashboard
router.get('/dashboard', getDashboardSummary);

// Bank Accounts
router.route('/accounts')
    .get(getAccounts)
    .post(createAccount);

router.route('/accounts/:id')
    .get(getAccount)
    .put(updateAccount)
    .delete(deleteAccount);

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

export default router;

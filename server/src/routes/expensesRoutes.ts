import express from 'express';
import { protect } from '../middleware/auth';
import {
    getExpenses,
    getExpense,
    createExpense,
    updateExpense,
    deleteExpense,
    approveExpense,
    rejectExpense,
    markAsPaid,
    getDashboardStats,
    getVendorPaymentSummary,
    recordVendorPayment,
    getBudgetVsActualReport,
    getCategoryTrendReport,
    getVendorSummaryReport,
    getTaxReport
} from '../controllers/expensesController';

const router = express.Router();

router.use(protect);

router.route('/dashboard/stats').get(getDashboardStats);
router.route('/vendor-payments').get(getVendorPaymentSummary);
router.route('/vendor-payments/pay').post(recordVendorPayment);
router.route('/reports/budget-vs-actual').get(getBudgetVsActualReport);
router.route('/reports/category-trend').get(getCategoryTrendReport);
router.route('/reports/vendor-summary').get(getVendorSummaryReport);
router.route('/reports/tax').get(getTaxReport);

router.route('/')
    .get(getExpenses)
    .post(createExpense);

router.route('/:id')
    .get(getExpense)
    .put(updateExpense)
    .delete(deleteExpense);

router.post('/:id/approve', approveExpense);
router.post('/:id/reject', rejectExpense);
router.post('/:id/paid', markAsPaid);

export default router;


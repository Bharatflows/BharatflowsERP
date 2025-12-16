import express from 'express';
import { getDashboardStats, getRecentTransactions, getSalesChart } from '../controllers/dashboardController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.get('/stats', protect, getDashboardStats);
router.get('/kpis', protect, getDashboardStats);
router.get('/recent-transactions', protect, getRecentTransactions);
router.get('/sales-chart', protect, getSalesChart);

export default router;


import { Router } from 'express';
import { dashboardController } from '../controllers/dashboardController';

const router = Router();

// Retrieve Comprehensive Stats
router.get('/stats', dashboardController.getStats);

// Retrieve Chart Data
router.get('/cash-flow', dashboardController.getCashFlow);

// Retrieve Ticker Tape Data
router.get('/ticker', dashboardController.getTickerData);

// KPI Aggregate Data
router.get('/kpis', dashboardController.getKPIs);

// Top Customers by Revenue
router.get('/top-customers', dashboardController.getTopCustomers);

// Payment Aging Buckets
router.get('/payment-aging', dashboardController.getPaymentAging);

// Revenue Trend (6 months)
router.get('/revenue-trend', dashboardController.getRevenueTrend);

// GST Breakdown (CGST/SGST/IGST)
router.get('/gst-breakdown', dashboardController.getGSTBreakdown);

export default router;

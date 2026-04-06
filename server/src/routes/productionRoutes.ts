import express from 'express';
import { protect } from '../middleware/auth';
import {
    getBOMs,
    getBOM,
    createBOM,
    updateBOM,
    deleteBOM,
    getWorkOrders,
    getWorkOrder,
    createWorkOrder,
    updateWorkOrder,
    deleteWorkOrder,
    getDashboard,
    getProductionPlans,
    createProductionPlan,
    updateProductionPlan,
    getInspections,
    createInspection
} from '../controllers/productionController';

const router = express.Router();

router.use(protect);

// Dashboard
router.get('/dashboard', getDashboard);

// BOM Routes
router.route('/boms')
    .get(getBOMs)
    .post(createBOM);

router.route('/boms/:id')
    .get(getBOM)
    .put(updateBOM)
    .delete(deleteBOM);

// Work Order Routes
router.route('/work-orders')
    .get(getWorkOrders)
    .post(createWorkOrder);

router.route('/work-orders/:id')
    .get(getWorkOrder)
    .put(updateWorkOrder)
    .delete(deleteWorkOrder);

// Production Plan Routes
router.route('/production-plans')
    .get(getProductionPlans)
    .post(createProductionPlan);

router.route('/production-plans/:id')
    .put(updateProductionPlan);

// Quality Control Routes
router.route('/inspections')
    .get(getInspections)
    .post(createInspection);

export default router;

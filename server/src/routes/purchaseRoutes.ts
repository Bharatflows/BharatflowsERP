import express from 'express';
import { protect } from '../middleware/auth';
import {
  getPurchaseOrders,
  getPurchaseOrder,
  createPurchaseOrder,
  updatePurchaseOrder,
  updatePurchaseOrderStatus,
  deletePurchaseOrder,
  getPurchaseBills,
  getPurchaseBill,
  createPurchaseBill,
  updatePurchaseBill,
  deletePurchaseBill,
  getGRNs,
  getGRN,
  createGRN,
  updateGRN,
  deleteGRN
} from '../controllers/purchase';
import * as debitNoteController from '../controllers/purchase/debitNoteController';


const router = express.Router();

router.use(protect);

// Purchase Bills routes (must come BEFORE /:id route)
router.route('/bills')
  .get(getPurchaseBills)
  .post(createPurchaseBill);

router.route('/bills/:id')
  .get(getPurchaseBill)
  .put(updatePurchaseBill)
  .delete(deletePurchaseBill);

// GRN routes (must come BEFORE /:id route)
router.route('/grn')
  .get(getGRNs)
  .post(createGRN);

router.route('/grn/:id')
  .get(getGRN)
  .put(updateGRN)
  .delete(deleteGRN);

// Debit Note routes
router.route('/debit-notes')
  .get(debitNoteController.getDebitNotes)
  .post(debitNoteController.createDebitNote);

router.route('/debit-notes/:id')
  .get(debitNoteController.getDebitNote)
  .delete(debitNoteController.deleteDebitNote);

// Purchase Orders routes (generic routes come LAST)
router.route('/')
  .get(getPurchaseOrders)
  .post(createPurchaseOrder);

// Status update route (must come before /:id)
router.patch('/:id/status', updatePurchaseOrderStatus);

router.route('/:id')
  .get(getPurchaseOrder)
  .put(updatePurchaseOrder)
  .delete(deletePurchaseOrder);

export default router;

import express from 'express';
import { protect } from '../middleware/auth';
import { validateFinancialYear } from '../middleware/validateFinancialYear';  // P0: FY locking
import { checkCustomRole } from '../middleware/customRoleMiddleware';  // C3: Custom role enforcement
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
  deleteGRN,
  convertPOToGRN,
  convertPOToBill
} from '../controllers/purchase';
import * as debitNoteController from '../controllers/purchase/debitNoteController';


const router = express.Router();

router.use(protect);

// Purchase Bills routes (must come BEFORE /:id route)
// P0: Validate FY before creating/updating bills
// C3 FIX: Apply custom role permissions
router.get('/bills', checkCustomRole('purchase', 'read'), getPurchaseBills);
router.post('/bills', checkCustomRole('purchase', 'create'), validateFinancialYear('billDate'), createPurchaseBill);
router.get('/bills/:id', checkCustomRole('purchase', 'read'), getPurchaseBill);
router.put('/bills/:id', checkCustomRole('purchase', 'update'), validateFinancialYear('billDate'), updatePurchaseBill);
router.delete('/bills/:id', checkCustomRole('purchase', 'delete'), deletePurchaseBill);

// GRN routes (must come BEFORE /:id route)
router.route('/grn')
  .get(getGRNs)
  .post(createGRN);

router.route('/grn/:id')
  .get(getGRN)
  .put(updateGRN)
  .delete(deleteGRN);

// Debit Note routes
// P0: Validate FY before creating debit notes
router.get('/debit-notes', debitNoteController.getDebitNotes);
router.post('/debit-notes', validateFinancialYear('debitNoteDate'), debitNoteController.createDebitNote);
router.get('/debit-notes/:id', debitNoteController.getDebitNote);
router.delete('/debit-notes/:id', debitNoteController.deleteDebitNote);

// Purchase Orders routes (generic routes come LAST)
router.route('/')
  .get(getPurchaseOrders)
  .post(createPurchaseOrder);

// Status update route (must come before /:id)
router.patch('/:id/status', updatePurchaseOrderStatus);

// Conversion routes (must come before /:id)
router.post('/:id/convert-to-grn', convertPOToGRN);
router.post('/:id/convert-to-bill', convertPOToBill);

router.route('/:id')
  .get(getPurchaseOrder)
  .put(updatePurchaseOrder)
  .delete(deletePurchaseOrder);

export default router;

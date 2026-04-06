"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const validate_1 = __importDefault(require("../middleware/validate")); // Audit Fix: Zod validation
const expenses_schema_1 = require("../schemas/expenses.schema"); // Audit Fix
const expensesController_1 = require("../controllers/expensesController");
const router = express_1.default.Router();
router.use(auth_1.protect);
router.route('/dashboard/stats').get(expensesController_1.getDashboardStats);
router.route('/vendor-payments').get(expensesController_1.getVendorPaymentSummary);
router.route('/vendor-payments/pay').post(expensesController_1.recordVendorPayment);
router.route('/reports/budget-vs-actual').get(expensesController_1.getBudgetVsActualReport);
router.route('/reports/category-trend').get(expensesController_1.getCategoryTrendReport);
router.route('/reports/vendor-summary').get(expensesController_1.getVendorSummaryReport);
router.route('/reports/tax').get(expensesController_1.getTaxReport);
// AUDIT FIX: Added Zod validation to create/update
router.route('/')
    .get(expensesController_1.getExpenses)
    .post((0, validate_1.default)(expenses_schema_1.createExpenseSchema), expensesController_1.createExpense);
router.route('/:id')
    .get(expensesController_1.getExpense)
    .put((0, validate_1.default)(expenses_schema_1.updateExpenseSchema), expensesController_1.updateExpense)
    .delete(expensesController_1.deleteExpense);
router.post('/:id/approve', expensesController_1.approveExpense);
router.post('/:id/reject', expensesController_1.rejectExpense);
router.post('/:id/paid', expensesController_1.markAsPaid);
exports.default = router;
//# sourceMappingURL=expensesRoutes.js.map
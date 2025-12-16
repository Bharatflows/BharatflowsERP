"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const bankingController_1 = require("../controllers/bankingController");
const router = express_1.default.Router();
router.use(auth_1.protect);
// Dashboard
router.get('/dashboard', bankingController_1.getDashboardSummary);
// Bank Accounts
router.route('/accounts')
    .get(bankingController_1.getAccounts)
    .post(bankingController_1.createAccount);
router.route('/accounts/:id')
    .get(bankingController_1.getAccount)
    .put(bankingController_1.updateAccount)
    .delete(bankingController_1.deleteAccount);
// Transactions
router.route('/transactions')
    .get(bankingController_1.getTransactions)
    .post(bankingController_1.createTransaction);
router.route('/transactions/:id')
    .delete(bankingController_1.deleteTransaction);
// Payment Reminders
router.route('/reminders')
    .get(bankingController_1.getPaymentReminders)
    .post(bankingController_1.createPaymentReminder);
router.route('/reminders/:id')
    .put(bankingController_1.updatePaymentReminder)
    .delete(bankingController_1.deletePaymentReminder);
router.post('/reminders/:id/send', bankingController_1.sendReminder);
exports.default = router;
//# sourceMappingURL=bankingRoutes.js.map
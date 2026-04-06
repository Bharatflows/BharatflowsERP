"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const rateLimiter_1 = require("../middleware/rateLimiter");
const bankingController_1 = require("../controllers/bankingController");
const pdcController = __importStar(require("../controllers/pdcController"));
const logger_1 = __importDefault(require("../config/logger"));
const router = express_1.default.Router();
router.use(auth_1.protect);
router.use(rateLimiter_1.sensitiveOpsLimiter); // Strict rate limiting for financial operations
router.use((0, auth_1.checkCustomRole)('banking.view')); // Base permission for all banking routes
// Dashboard
router.get('/dashboard', bankingController_1.getDashboardSummary);
router.get('/cash-flow-trends', bankingController_1.getCashFlowTrends);
router.get('/cash-flow-forecast', bankingController_1.getCashFlowForecast);
// P1: Cashflow Projection (forward-looking based on receivables/payables)
router.get('/cashflow-projection', async (req, res) => {
    try {
        const cashflowService = (await Promise.resolve().then(() => __importStar(require('../services/cashflowProjectionService')))).default;
        const companyId = req.user.companyId;
        const projection = await cashflowService.generateProjection(companyId, 90);
        res.json({ success: true, data: projection });
    }
    catch (error) {
        logger_1.default.error('Cashflow projection error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
// Bank Accounts
router.route('/accounts')
    .get(bankingController_1.getAccounts)
    .post(bankingController_1.createAccount);
router.route('/accounts/:id')
    .get(bankingController_1.getAccount)
    .put(bankingController_1.updateAccount)
    .delete(bankingController_1.deleteAccount);
router.post('/accounts/:id/sync', bankingController_1.syncBankAccount);
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
// P0-10: Post-Dated Cheques (PDC)
router.get('/pdcs/reminders', pdcController.getPDCReminders);
router.get('/pdcs', pdcController.getPDCs);
router.get('/pdcs/:id', pdcController.getPDC);
router.post('/pdcs', pdcController.createPDC);
router.post('/pdcs/:id/deposit', pdcController.depositPDC);
router.post('/pdcs/:id/clear', pdcController.clearPDC);
router.post('/pdcs/:id/bounce', pdcController.bouncePDC);
exports.default = router;
//# sourceMappingURL=bankingRoutes.js.map
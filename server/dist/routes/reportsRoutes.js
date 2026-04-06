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
const reportsController = __importStar(require("../controllers/reports"));
const accountingController = __importStar(require("../controllers/accountingController"));
const exportController = __importStar(require("../controllers/reports/exportController"));
const ageingController = __importStar(require("../controllers/ageingController"));
const router = express_1.default.Router();
router.use(auth_1.protect);
// Financial Reports
router.get('/dashboard', reportsController.getDashboardSummary);
router.get('/profit-loss', accountingController.getProfitLoss);
router.get('/profit-loss-trends', reportsController.getProfitLossTrends);
router.get('/balance-sheet', accountingController.getBalanceSheet);
router.get('/cash-flow-forecast', reportsController.getCashFlowForecast);
// Aging Reports (Legacy)
router.get('/aging-receivables', reportsController.getAgingReceivables);
router.get('/aging-payables', reportsController.getAgingPayables);
// P0: Enhanced Ageing Reports with Party Breakdown
router.get('/ageing/receivables', ageingController.getReceivablesAgeing);
router.get('/ageing/payables', ageingController.getPayablesAgeing);
router.get('/ageing/msme-compliance', ageingController.getMSMEComplianceReport);
// Business Reports
router.get('/sales', reportsController.getSalesReport);
router.get('/purchase', reportsController.getPurchaseReport);
router.get('/inventory', reportsController.getInventoryReport);
// Party Statement
router.get('/party-statement/:partyId', reportsController.getPartyStatement);
// Export Reports (CSV/Excel)
router.get('/export/:type', exportController.exportReport);
// P2: Budget vs Actual
router.get('/budget-vs-actual', reportsController.getBudgetVsActual);
router.post('/budget', reportsController.saveBudget);
router.get('/budget-alerts', reportsController.getBudgetAlerts);
// P2: Supplier Dependency Analysis
router.get('/supplier-dependency', reportsController.analyzeConcentration);
// P2: Exchange Rates
router.get('/exchange-rates', reportsController.getExchangeRates);
router.post('/convert-currency', reportsController.convertCurrency);
exports.default = router;
//# sourceMappingURL=reportsRoutes.js.map
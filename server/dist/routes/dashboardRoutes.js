"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dashboardController_1 = require("../controllers/dashboardController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.get('/stats', auth_1.protect, dashboardController_1.getDashboardStats);
router.get('/kpis', auth_1.protect, dashboardController_1.getDashboardStats);
router.get('/recent-transactions', auth_1.protect, dashboardController_1.getRecentTransactions);
router.get('/sales-chart', auth_1.protect, dashboardController_1.getSalesChart);
exports.default = router;
//# sourceMappingURL=dashboardRoutes.js.map
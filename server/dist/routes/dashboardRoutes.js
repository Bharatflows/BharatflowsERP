"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboardController_1 = require("../controllers/dashboardController");
const router = (0, express_1.Router)();
// Retrieve Chart Data
router.get('/cash-flow', dashboardController_1.dashboardController.getCashFlow);
// Retrieve Ticker Tape Data
router.get('/ticker', dashboardController_1.dashboardController.getTickerData);
exports.default = router;
//# sourceMappingURL=dashboardRoutes.js.map
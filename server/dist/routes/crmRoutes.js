"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const crmController_1 = require("../controllers/crmController");
const router = express_1.default.Router();
router.use(auth_1.protect);
// Dashboard
router.get('/dashboard', crmController_1.getDashboard);
router.get('/funnel', crmController_1.getSalesFunnel);
// Lead Management
router.route('/leads')
    .get(crmController_1.getLeads)
    .post(crmController_1.createLead);
router.route('/leads/:id')
    .get(crmController_1.getLead)
    .put(crmController_1.updateLead)
    .delete(crmController_1.deleteLead);
router.put('/leads/:id/status', crmController_1.updateLeadStatus);
// Activity Logging
router.post('/activities', crmController_1.addActivity);
router.get('/activities', crmController_1.getActivities);
// Customer Scoring (Phase 11)
router.post('/scores/:customerId', crmController_1.recalculateScore);
exports.default = router;
//# sourceMappingURL=crmRoutes.js.map
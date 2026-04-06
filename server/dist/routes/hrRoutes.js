"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const hrController_1 = require("../controllers/hrController");
const router = express_1.default.Router();
router.use(auth_1.protect);
router.route('/employees')
    .get((0, auth_1.checkCustomRole)('hr.view'), hrController_1.getEmployees)
    .post((0, auth_1.checkCustomRole)('hr.manage'), hrController_1.createEmployee);
router.route('/employees/:id')
    .get(hrController_1.getEmployee)
    .put(hrController_1.updateEmployee)
    .delete(hrController_1.deleteEmployee);
// Dashboard & Stats
router.get('/dashboard/stats', hrController_1.getDashboardStats);
// Attendance
router.get('/attendance', hrController_1.getAttendance);
router.get('/attendance/daily', hrController_1.getDailyAttendance);
router.post('/attendance', hrController_1.markAttendance);
// Leaves
router.get('/leaves', hrController_1.getLeaves);
router.post('/leaves', hrController_1.applyLeave);
router.put('/leaves/:id/status', hrController_1.updateLeaveStatus);
// Payroll
router.get('/payroll', hrController_1.getPayrollRuns);
router.post('/payroll/generate', hrController_1.generatePayroll);
exports.default = router;
//# sourceMappingURL=hrRoutes.js.map
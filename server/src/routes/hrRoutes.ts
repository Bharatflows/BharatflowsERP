import express from 'express';
import { protect, checkCustomRole } from '../middleware/auth';
import {
    getEmployees,
    getEmployee,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    markAttendance,
    applyLeave,
    generatePayroll,
    getDashboardStats,
    getAttendance,
    getDailyAttendance,
    getLeaves,
    updateLeaveStatus,
    getPayrollRuns
} from '../controllers/hrController';

const router = express.Router();

router.use(protect);

router.route('/employees')
    .get(checkCustomRole('hr.view'), getEmployees)
    .post(checkCustomRole('hr.manage'), createEmployee);

router.route('/employees/:id')
    .get(getEmployee)
    .put(updateEmployee)
    .delete(deleteEmployee);

// Dashboard & Stats
router.get('/dashboard/stats', getDashboardStats);

// Attendance
router.get('/attendance', getAttendance);
router.get('/attendance/daily', getDailyAttendance);
router.post('/attendance', markAttendance);

// Leaves
router.get('/leaves', getLeaves);
router.post('/leaves', applyLeave);
router.put('/leaves/:id/status', updateLeaveStatus);

// Payroll
router.get('/payroll', getPayrollRuns);
router.post('/payroll/generate', generatePayroll);

export default router;

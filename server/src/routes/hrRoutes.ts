import express from 'express';
import { protect } from '../middleware/auth';
import {
    getEmployees,
    getEmployee,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    markAttendance,
    applyLeave,
    generatePayroll
} from '../controllers/hrController';

const router = express.Router();

router.use(protect);

router.route('/employees')
    .get(getEmployees)
    .post(createEmployee);

router.route('/employees/:id')
    .get(getEmployee)
    .put(updateEmployee)
    .delete(deleteEmployee);

router.post('/attendance', markAttendance);
router.post('/leaves', applyLeave);
router.post('/payroll/generate', generatePayroll);

export default router;

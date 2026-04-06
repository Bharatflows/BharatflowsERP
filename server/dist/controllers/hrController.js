"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPayrollRuns = exports.updateLeaveStatus = exports.getLeaves = exports.getDailyAttendance = exports.getAttendance = exports.getDashboardStats = exports.generatePayroll = exports.applyLeave = exports.markAttendance = exports.deleteEmployee = exports.updateEmployee = exports.createEmployee = exports.getEmployee = exports.getEmployees = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const eventBus_1 = __importDefault(require("../services/eventBus"));
const logger_1 = __importDefault(require("../config/logger"));
// ... existing employee functions ...
const getEmployees = async (req, res) => {
    try {
        const companyId = req.user?.companyId;
        const employees = await prisma_1.default.employee.findMany({
            where: { companyId },
            orderBy: { name: 'asc' }
        });
        res.json({
            success: true,
            count: employees.length,
            data: employees
        });
    }
    catch (error) {
        logger_1.default.error('Error fetching employees:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
exports.getEmployees = getEmployees;
const getEmployee = async (req, res) => {
    try {
        const employee = await prisma_1.default.employee.findFirst({
            where: {
                id: req.params.id,
                companyId: req.user?.companyId
            }
        });
        if (!employee) {
            res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
            return;
        }
        res.json({
            success: true,
            data: employee
        });
    }
    catch (error) {
        logger_1.default.error('Error fetching employee:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
exports.getEmployee = getEmployee;
const createEmployee = async (req, res) => {
    try {
        const { name, email, phone, department, designation, joiningDate, dateOfBirth, salary, employeeId, status } = req.body;
        const companyId = req.user?.companyId;
        const employee = await prisma_1.default.employee.create({
            data: {
                companyId: companyId,
                name,
                email,
                phone,
                department,
                designation,
                joiningDate: new Date(joiningDate),
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                salary: Number(salary),
                employeeId: employeeId || `EMP-${Date.now()}`,
                status: status || 'ACTIVE'
            }
        });
        res.status(201).json({
            success: true,
            data: employee
        });
    }
    catch (error) {
        logger_1.default.error('Error creating employee:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
exports.createEmployee = createEmployee;
const updateEmployee = async (req, res) => {
    try {
        const { name, email, phone, department, designation, joiningDate, dateOfBirth, salary, status } = req.body;
        const employeeId = req.params.id;
        const companyId = req.user?.companyId;
        const existingEmployee = await prisma_1.default.employee.findFirst({
            where: { id: employeeId, companyId }
        });
        if (!existingEmployee) {
            res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
            return;
        }
        const updatedEmployee = await prisma_1.default.employee.update({
            where: { id: employeeId },
            data: {
                name,
                email,
                phone,
                department,
                designation,
                joiningDate: new Date(joiningDate),
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                salary: Number(salary),
                status
            }
        });
        res.json({
            success: true,
            data: updatedEmployee
        });
    }
    catch (error) {
        logger_1.default.error('Error updating employee:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
exports.updateEmployee = updateEmployee;
const deleteEmployee = async (req, res) => {
    try {
        const employee = await prisma_1.default.employee.findFirst({
            where: {
                id: req.params.id,
                companyId: req.user?.companyId
            }
        });
        if (!employee) {
            res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
            return;
        }
        await prisma_1.default.employee.delete({
            where: { id: req.params.id }
        });
        res.json({
            success: true,
            data: {}
        });
    }
    catch (error) {
        logger_1.default.error('Error deleting employee:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
exports.deleteEmployee = deleteEmployee;
// ATTENDANCE
// B4: Attendance is LOCKED after payroll generation for that month
const markAttendance = async (req, res) => {
    try {
        const { employeeId, date, status, checkIn, checkOut } = req.body;
        const companyId = req.user.companyId;
        // B4: Check if payroll already exists for this employee + month
        const attendanceDate = new Date(date);
        const monthKey = `${attendanceDate.getFullYear()}-${String(attendanceDate.getMonth() + 1).padStart(2, '0')}`;
        const existingPayroll = await prisma_1.default.payrollRun.findFirst({
            where: {
                companyId,
                employeeId,
                month: monthKey,
                status: { not: 'CANCELLED' }
            }
        });
        if (existingPayroll) {
            res.status(400).json({
                success: false,
                message: `Attendance locked for ${monthKey} - payroll already generated`,
                code: 'ATTENDANCE_LOCKED_BY_PAYROLL'
            });
            return;
        }
        const attendance = await prisma_1.default.attendance.upsert({
            where: {
                companyId_employeeId_date: {
                    companyId,
                    employeeId,
                    date: new Date(date)
                }
            },
            update: {
                status,
                checkIn: checkIn ? new Date(checkIn) : undefined,
                checkOut: checkOut ? new Date(checkOut) : undefined
            },
            create: {
                companyId,
                employeeId,
                date: new Date(date),
                status,
                checkIn: checkIn ? new Date(checkIn) : undefined,
                checkOut: checkOut ? new Date(checkOut) : undefined
            }
        });
        res.json({ success: true, data: attendance });
    }
    catch (error) {
        logger_1.default.error('Mark attendance error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.markAttendance = markAttendance;
// LEAVE MANAGEMENT
const applyLeave = async (req, res) => {
    try {
        const { employeeId, type, startDate, endDate, reason } = req.body;
        const companyId = req.user.companyId;
        const leave = await prisma_1.default.leave.create({
            data: {
                employeeId,
                companyId,
                type,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                reason,
                status: 'PENDING'
            }
        });
        res.status(201).json({ success: true, data: leave });
    }
    catch (error) {
        logger_1.default.error('Apply leave error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.applyLeave = applyLeave;
// PAYROLL
// B3: Includes ledger entry emission for salary expense
const generatePayroll = async (req, res) => {
    try {
        const { employeeId, month, additions, deductions } = req.body;
        const companyId = req.user.companyId;
        const userId = req.user.id;
        // Check for duplicate payroll for same employee + month
        const existingPayroll = await prisma_1.default.payrollRun.findFirst({
            where: {
                companyId,
                employeeId,
                month,
                status: { not: 'CANCELLED' }
            }
        });
        if (existingPayroll) {
            res.status(400).json({
                success: false,
                message: `Payroll already generated for ${month}. Cancel existing payroll first.`,
                code: 'DUPLICATE_PAYROLL'
            });
            return;
        }
        const employee = await prisma_1.default.employee.findUnique({ where: { id: employeeId } });
        if (!employee) {
            res.status(404).json({ success: false, message: 'Employee not found' });
            return;
        }
        const basic = Number(employee.salary);
        const netPay = basic + Number(additions || 0) - Number(deductions || 0);
        const payroll = await prisma_1.default.payrollRun.create({
            data: {
                employeeId,
                companyId,
                month,
                basic,
                additions: Number(additions || 0),
                deductions: Number(deductions || 0),
                netPay,
                status: 'GENERATED'
            }
        });
        // B3: Emit event for ledger posting (Salary Expense, Salary Payable)
        try {
            await eventBus_1.default.emit({
                companyId,
                eventType: 'PAYROLL_GENERATED',
                aggregateType: 'PayrollRun',
                aggregateId: payroll.id,
                payload: {
                    payrollId: payroll.id,
                    employeeId,
                    employeeName: employee.name,
                    month,
                    basic,
                    additions: Number(additions || 0),
                    deductions: Number(deductions || 0),
                    netPay
                },
                metadata: { userId, source: 'api' }
            });
            logger_1.default.info(`[B3] PAYROLL_GENERATED event emitted for ${employee.name} - ${month}`);
        }
        catch (eventError) {
            logger_1.default.warn(`Failed to emit PAYROLL_GENERATED event: ${eventError}`);
        }
        // --- ENHANCEMENT: HR Payroll Reminder ---
        try {
            await prisma_1.default.activity.create({
                data: {
                    companyId,
                    type: 'TASK',
                    subject: `Payroll Disbursement: ${month}`,
                    description: `Disburse salary for ${employee.name}. Monthly Net Pay: ₹${netPay}`,
                    date: new Date(),
                    priority: 'HIGH',
                    isCompleted: false,
                    createdBy: userId
                }
            });
        }
        catch (err) {
            logger_1.default.error('Failed to create payroll reminder task:', err);
        }
        res.status(201).json({ success: true, data: payroll });
    }
    catch (error) {
        logger_1.default.error('Generate payroll error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.generatePayroll = generatePayroll;
// DASHBOARD STATS
const getDashboardStats = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // Total employees
        const totalEmployees = await prisma_1.default.employee.count({
            where: { companyId, status: 'ACTIVE' }
        });
        // Today's attendance
        const todayAttendance = await prisma_1.default.attendance.findMany({
            where: {
                companyId,
                date: today
            }
        });
        const presentToday = todayAttendance.filter(a => ['PRESENT', 'LATE', 'HALF_DAY'].includes(a.status)).length;
        const absentToday = todayAttendance.filter(a => a.status === 'ABSENT').length;
        // Pending leave requests
        const pendingLeaves = await prisma_1.default.leave.count({
            where: {
                companyId,
                status: 'PENDING'
            }
        });
        // Department distribution
        const employees = await prisma_1.default.employee.findMany({
            where: { companyId, status: 'ACTIVE' },
            select: { department: true }
        });
        const departmentMap = employees.reduce((acc, emp) => {
            acc[emp.department] = (acc[emp.department] || 0) + 1;
            return acc;
        }, {});
        const departmentData = Object.entries(departmentMap).map(([name, count]) => ({
            name,
            value: count
        }));
        // Attendance trend (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const attendanceRecords = await prisma_1.default.attendance.groupBy({
            by: ['date'],
            where: {
                companyId,
                date: { gte: sixMonthsAgo }
            },
            _count: { status: true }
        });
        // Recent activities (leaves and new joinings)
        const recentLeaves = await prisma_1.default.leave.findMany({
            where: { companyId },
            include: { employee: { select: { name: true, employeeId: true } } },
            orderBy: { startDate: 'desc' },
            take: 5
        });
        const recentJoinings = await prisma_1.default.employee.findMany({
            where: { companyId },
            orderBy: { joiningDate: 'desc' },
            take: 5,
            select: { name: true, employeeId: true, joiningDate: true, department: true }
        });
        res.json({
            success: true,
            data: {
                totalEmployees,
                presentToday,
                absentToday,
                pendingLeaves,
                departmentData,
                attendanceTrend: attendanceRecords,
                recentLeaves,
                recentJoinings
            }
        });
    }
    catch (error) {
        logger_1.default.error('Get dashboard stats error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getDashboardStats = getDashboardStats;
// GET ATTENDANCE
const getAttendance = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const { date, employeeId } = req.query;
        const where = { companyId };
        if (date) {
            const targetDate = new Date(date);
            targetDate.setHours(0, 0, 0, 0);
            where.date = targetDate;
        }
        if (employeeId) {
            where.employeeId = employeeId;
        }
        const attendance = await prisma_1.default.attendance.findMany({
            where,
            include: {
                employee: {
                    select: {
                        id: true,
                        name: true,
                        employeeId: true,
                        department: true
                    }
                }
            },
            orderBy: { date: 'desc' }
        });
        res.json({ success: true, data: attendance });
    }
    catch (error) {
        logger_1.default.error('Get attendance error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getAttendance = getAttendance;
// GET DAILY ATTENDANCE - Returns ALL employees with their attendance status for a date
const getDailyAttendance = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const { date } = req.query;
        const targetDate = date ? new Date(date) : new Date();
        targetDate.setHours(0, 0, 0, 0);
        // Get all employees
        const employees = await prisma_1.default.employee.findMany({
            where: { companyId, status: 'ACTIVE' },
            select: {
                id: true,
                employeeId: true,
                name: true,
                department: true,
                designation: true
            },
            orderBy: { name: 'asc' }
        });
        // Get attendance records for the date
        const attendanceRecords = await prisma_1.default.attendance.findMany({
            where: {
                companyId,
                date: targetDate
            }
        });
        // Create a map of employeeId to attendance
        const attendanceMap = new Map(attendanceRecords.map(a => [a.employeeId, a]));
        // Merge employees with their attendance
        const dailyAttendance = employees.map(emp => {
            const attendance = attendanceMap.get(emp.id);
            return {
                id: emp.id,
                employeeId: emp.employeeId,
                name: emp.name,
                department: emp.department,
                designation: emp.designation,
                status: attendance?.status || 'NOT_MARKED',
                checkIn: attendance?.checkIn || null,
                checkOut: attendance?.checkOut || null,
                attendanceId: attendance?.id || null
            };
        });
        res.json({ success: true, data: dailyAttendance, date: targetDate });
    }
    catch (error) {
        logger_1.default.error('Get daily attendance error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getDailyAttendance = getDailyAttendance;
// GET LEAVES
const getLeaves = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const { status, employeeId } = req.query;
        const where = { companyId };
        if (status) {
            where.status = status;
        }
        if (employeeId) {
            where.employeeId = employeeId;
        }
        const leaves = await prisma_1.default.leave.findMany({
            where,
            include: {
                employee: {
                    select: {
                        id: true,
                        name: true,
                        employeeId: true,
                        department: true
                    }
                }
            },
            orderBy: { startDate: 'desc' }
        });
        res.json({ success: true, data: leaves });
    }
    catch (error) {
        logger_1.default.error('Get leaves error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getLeaves = getLeaves;
// UPDATE LEAVE STATUS
const updateLeaveStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const companyId = req.user.companyId;
        const leave = await prisma_1.default.leave.findFirst({
            where: { id, companyId }
        });
        if (!leave) {
            res.status(404).json({ success: false, message: 'Leave request not found' });
            return;
        }
        const updatedLeave = await prisma_1.default.leave.update({
            where: { id },
            data: { status },
            include: {
                employee: {
                    select: {
                        id: true,
                        name: true,
                        employeeId: true
                    }
                }
            }
        });
        res.json({ success: true, data: updatedLeave });
    }
    catch (error) {
        logger_1.default.error('Update leave status error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateLeaveStatus = updateLeaveStatus;
// GET PAYROLL RUNS
const getPayrollRuns = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const { month, employeeId } = req.query;
        const where = { companyId };
        if (month) {
            where.month = month;
        }
        if (employeeId) {
            where.employeeId = employeeId;
        }
        const payrollRuns = await prisma_1.default.payrollRun.findMany({
            where,
            include: {
                employee: {
                    select: {
                        id: true,
                        name: true,
                        employeeId: true,
                        department: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, data: payrollRuns });
    }
    catch (error) {
        logger_1.default.error('Get payroll runs error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getPayrollRuns = getPayrollRuns;
//# sourceMappingURL=hrController.js.map
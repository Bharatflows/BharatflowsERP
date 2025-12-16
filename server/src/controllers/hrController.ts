import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';

// ... existing employee functions ...
export const getEmployees = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user?.companyId;

        const employees = await prisma.employee.findMany({
            where: { companyId },
            orderBy: { name: 'asc' }
        });

        res.json({
            success: true,
            count: employees.length,
            data: employees
        });
    } catch (error) {
        console.error('Error fetching employees:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

export const getEmployee = async (req: AuthRequest, res: Response) => {
    try {
        const employee = await prisma.employee.findFirst({
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
    } catch (error) {
        console.error('Error fetching employee:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

export const createEmployee = async (req: AuthRequest, res: Response) => {
    try {
        const {
            name,
            email,
            phone,
            department,
            designation,
            joiningDate,
            dateOfBirth,
            salary,
            employeeId,
            status
        } = req.body;

        const companyId = req.user?.companyId;

        const employee = await prisma.employee.create({
            data: {
                companyId: companyId!,
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
    } catch (error) {
        console.error('Error creating employee:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

export const updateEmployee = async (req: AuthRequest, res: Response) => {
    try {
        const {
            name,
            email,
            phone,
            department,
            designation,
            joiningDate,
            dateOfBirth,
            salary,
            status
        } = req.body;

        const employeeId = req.params.id;
        const companyId = req.user?.companyId;

        const existingEmployee = await prisma.employee.findFirst({
            where: { id: employeeId, companyId }
        });

        if (!existingEmployee) {
            res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
            return;
        }

        const updatedEmployee = await prisma.employee.update({
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
    } catch (error) {
        console.error('Error updating employee:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

export const deleteEmployee = async (req: AuthRequest, res: Response) => {
    try {
        const employee = await prisma.employee.findFirst({
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

        await prisma.employee.delete({
            where: { id: req.params.id }
        });

        res.json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.error('Error deleting employee:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// ATTENDANCE

export const markAttendance = async (req: AuthRequest, res: Response) => {
    try {
        const { employeeId, date, status, checkIn, checkOut } = req.body;
        const companyId = req.user!.companyId;

        const attendance = await prisma.attendance.upsert({
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
    } catch (error: any) {
        console.error('Mark attendance error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// LEAVE MANAGEMENT

export const applyLeave = async (req: AuthRequest, res: Response) => {
    try {
        const { employeeId, type, startDate, endDate, reason } = req.body;
        const companyId = req.user!.companyId;

        const leave = await prisma.leave.create({
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
    } catch (error: any) {
        console.error('Apply leave error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// PAYROLL

export const generatePayroll = async (req: AuthRequest, res: Response) => {
    try {
        const { employeeId, month, additions, deductions } = req.body;
        const companyId = req.user!.companyId;

        const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
        if (!employee) {
            res.status(404).json({ success: false, message: 'Employee not found' });
            return;
        }

        const basic = Number(employee.salary);
        const netPay = basic + Number(additions || 0) - Number(deductions || 0);

        const payroll = await prisma.payrollRun.create({
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

        res.status(201).json({ success: true, data: payroll });
    } catch (error: any) {
        console.error('Generate payroll error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

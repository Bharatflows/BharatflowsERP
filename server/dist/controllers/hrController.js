"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteEmployee = exports.updateEmployee = exports.createEmployee = exports.getEmployee = exports.getEmployees = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// @desc    Get all employees
// @route   GET /api/v1/hr/employees
// @access  Private
const getEmployees = async (req, res) => {
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
    }
    catch (error) {
        console.error('Error fetching employees:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
exports.getEmployees = getEmployees;
// @desc    Get single employee
// @route   GET /api/v1/hr/employees/:id
// @access  Private
const getEmployee = async (req, res) => {
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
    }
    catch (error) {
        console.error('Error fetching employee:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
exports.getEmployee = getEmployee;
// @desc    Create employee
// @route   POST /api/v1/hr/employees
// @access  Private
const createEmployee = async (req, res) => {
    try {
        const { name, email, phone, department, designation, joiningDate, dateOfBirth, salary, employeeId, status } = req.body;
        const companyId = req.user?.companyId;
        const employee = await prisma.employee.create({
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
        console.error('Error creating employee:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
exports.createEmployee = createEmployee;
// @desc    Update employee
// @route   PUT /api/v1/hr/employees/:id
// @access  Private
const updateEmployee = async (req, res) => {
    try {
        const { name, email, phone, department, designation, joiningDate, dateOfBirth, salary, status } = req.body;
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
    }
    catch (error) {
        console.error('Error updating employee:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
exports.updateEmployee = updateEmployee;
// @desc    Delete employee
// @route   DELETE /api/v1/hr/employees/:id
// @access  Private
const deleteEmployee = async (req, res) => {
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
    }
    catch (error) {
        console.error('Error deleting employee:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
exports.deleteEmployee = deleteEmployee;
//# sourceMappingURL=hrController.js.map
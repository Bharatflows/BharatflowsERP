"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.approveExpense = exports.deleteExpense = exports.updateExpense = exports.createExpense = exports.getExpense = exports.getExpenses = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// @desc    Get all expenses
// @route   GET /api/v1/expenses
// @access  Private
const getExpenses = async (req, res) => {
    try {
        const companyId = req.user?.companyId;
        const expenses = await prisma.expense.findMany({
            where: { companyId },
            orderBy: { date: 'desc' }
        });
        res.json({
            success: true,
            count: expenses.length,
            data: expenses
        });
    }
    catch (error) {
        console.error('Error fetching expenses:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
exports.getExpenses = getExpenses;
// @desc    Get single expense
// @route   GET /api/v1/expenses/:id
// @access  Private
const getExpense = async (req, res) => {
    try {
        const expense = await prisma.expense.findFirst({
            where: {
                id: req.params.id,
                companyId: req.user?.companyId
            }
        });
        if (!expense) {
            res.status(404).json({
                success: false,
                message: 'Expense not found'
            });
            return;
        }
        res.json({
            success: true,
            data: expense
        });
    }
    catch (error) {
        console.error('Error fetching expense:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
exports.getExpense = getExpense;
// @desc    Create expense
// @route   POST /api/v1/expenses
// @access  Private
const createExpense = async (req, res) => {
    try {
        const { category, amount, date, description, vendor, paymentMethod, gstAmount, notes } = req.body;
        const companyId = req.user?.companyId;
        const expense = await prisma.expense.create({
            data: {
                companyId: companyId,
                category,
                amount: Number(amount),
                date: new Date(date),
                description,
                vendor,
                paymentMethod,
                gstAmount: Number(gstAmount || 0),
                notes,
                status: 'PENDING'
            }
        });
        res.status(201).json({
            success: true,
            data: expense
        });
    }
    catch (error) {
        console.error('Error creating expense:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
exports.createExpense = createExpense;
// @desc    Update expense
// @route   PUT /api/v1/expenses/:id
// @access  Private
const updateExpense = async (req, res) => {
    try {
        const { category, amount, date, description, vendor, paymentMethod, gstAmount, notes, status } = req.body;
        const expenseId = req.params.id;
        const companyId = req.user?.companyId;
        const existingExpense = await prisma.expense.findFirst({
            where: { id: expenseId, companyId }
        });
        if (!existingExpense) {
            res.status(404).json({
                success: false,
                message: 'Expense not found'
            });
            return;
        }
        const updatedExpense = await prisma.expense.update({
            where: { id: expenseId },
            data: {
                category,
                amount: Number(amount),
                date: new Date(date),
                description,
                vendor,
                paymentMethod,
                gstAmount: Number(gstAmount || 0),
                notes,
                status
            }
        });
        res.json({
            success: true,
            data: updatedExpense
        });
    }
    catch (error) {
        console.error('Error updating expense:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
exports.updateExpense = updateExpense;
// @desc    Delete expense
// @route   DELETE /api/v1/expenses/:id
// @access  Private
const deleteExpense = async (req, res) => {
    try {
        const expense = await prisma.expense.findFirst({
            where: {
                id: req.params.id,
                companyId: req.user?.companyId
            }
        });
        if (!expense) {
            res.status(404).json({
                success: false,
                message: 'Expense not found'
            });
            return;
        }
        await prisma.expense.delete({
            where: { id: req.params.id }
        });
        res.json({
            success: true,
            data: {}
        });
    }
    catch (error) {
        console.error('Error deleting expense:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
exports.deleteExpense = deleteExpense;
// @desc    Approve expense
// @route   POST /api/v1/expenses/:id/approve
// @access  Private
const approveExpense = async (req, res) => {
    try {
        const expenseId = req.params.id;
        const companyId = req.user?.companyId;
        const expense = await prisma.expense.findFirst({
            where: { id: expenseId, companyId }
        });
        if (!expense) {
            res.status(404).json({
                success: false,
                message: 'Expense not found'
            });
            return;
        }
        const updatedExpense = await prisma.expense.update({
            where: { id: expenseId },
            data: { status: 'APPROVED' }
        });
        res.json({
            success: true,
            data: updatedExpense
        });
    }
    catch (error) {
        console.error('Error approving expense:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
exports.approveExpense = approveExpense;
//# sourceMappingURL=expensesController.js.map
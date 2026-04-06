"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTaxReport = exports.getVendorSummaryReport = exports.getCategoryTrendReport = exports.getBudgetVsActualReport = exports.getDashboardStats = exports.recordVendorPayment = exports.getVendorPaymentSummary = exports.markAsPaid = exports.rejectExpense = exports.approveExpense = exports.deleteExpense = exports.updateExpense = exports.createExpense = exports.getExpense = exports.getExpenses = void 0;
const client_1 = require("@prisma/client");
// P0: postingService calls moved to domain event subscriber
const eventBus_1 = __importStar(require("../services/eventBus")); // P0: Domain events
const auditService_1 = require("../services/auditService"); // D1: Audit logging
const logger_1 = __importDefault(require("../config/logger"));
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
        logger_1.default.error('Error fetching expenses:', error);
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
        logger_1.default.error('Error fetching expense:', error);
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
        const expenseDate = new Date(date);
        const month = String(expenseDate.getMonth() + 1).padStart(2, '0');
        const year = expenseDate.getFullYear();
        const fiscalKey = `${year}-${month}`;
        // Get or create sequence for this month
        const sequence = await prisma.sequence.upsert({
            where: {
                companyId_documentType_fiscalYear: {
                    companyId: companyId,
                    documentType: 'EXPENSE',
                    fiscalYear: fiscalKey
                }
            },
            update: {
                nextNumber: { increment: 1 }
            },
            create: {
                companyId: companyId,
                documentType: 'EXPENSE',
                prefix: 'EXP',
                format: 'EXP-MM-NNN',
                fiscalYear: fiscalKey,
                nextNumber: 2
            }
        });
        // Generate expense number: EXP-12-001
        const seqNum = sequence.nextNumber - 1;
        const expenseNumber = `EXP-${month}-${String(seqNum).padStart(3, '0')}`;
        // Auto-create category if it doesn't exist
        let policyWarning = null;
        if (category) {
            const expenseCategory = await prisma.expenseCategory.upsert({
                where: {
                    companyId_name: {
                        companyId: companyId,
                        name: category
                    }
                },
                update: {},
                create: {
                    companyId: companyId,
                    name: category,
                    description: `Auto-created for ${category} expenses`,
                    budget: 0,
                    color: '#6b7280'
                }
            });
            // Check policy limit
            if (expenseCategory.maxAmount && Number(amount) > Number(expenseCategory.maxAmount)) {
                policyWarning = `Amount exceeds category limit of ₹${Number(expenseCategory.maxAmount).toLocaleString('en-IN')}`;
            }
        }
        const gstVal = Number(gstAmount || 0);
        const amountVal = Number(amount);
        // Auto-detect status based on payment method
        const initialStatus = paymentMethod ? 'PAID' : 'PENDING';
        const expense = await prisma.expense.create({
            data: {
                companyId: companyId,
                expenseNumber,
                category,
                amount: amountVal,
                date: expenseDate,
                description,
                vendor,
                paymentMethod,
                gstAmount: gstVal,
                notes: policyWarning ? `${notes || ''}\n⚠️ POLICY WARNING: ${policyWarning}` : notes,
                status: initialStatus
            }
        });
        // P0: Emit domain event instead of direct postingService call
        // The Accounting domain will subscribe to this event and handle ledger posting
        try {
            await eventBus_1.default.emit({
                companyId: companyId,
                eventType: eventBus_1.EventTypes.EXPENSE_CREATED,
                aggregateType: 'Expense',
                aggregateId: expense.id,
                payload: {
                    expenseId: expense.id,
                    expenseNumber: expense.expenseNumber,
                    category: expense.category,
                    amount: Number(expense.amount),
                    gstAmount: Number(expense.gstAmount || 0),
                    totalAmount: Number(expense.amount) + Number(expense.gstAmount || 0),
                    date: expense.date.toISOString(),
                    description: expense.description,
                    vendor: expense.vendor,
                    paymentMethod: expense.paymentMethod,
                    status: expense.status
                },
                metadata: {
                    userId: req.user?.id || 'system',
                    source: 'api'
                }
            });
        }
        catch (eventError) {
            logger_1.default.warn('Failed to emit EXPENSE_CREATED event:', eventError);
        }
        // D1: Audit log for expense creation
        try {
            await auditService_1.AuditService.logChange(companyId, req.user?.id || 'system', 'INVOICE', // Using INVOICE as closest EntityType for Expense
            expense.id, 'CREATE', null, { expenseNumber: expense.expenseNumber, amount: amountVal, category, vendor }, req.ip || 'UNKNOWN', req.headers['user-agent'] || 'UNKNOWN', 'EXPENSES');
        }
        catch (auditError) {
            logger_1.default.warn('Failed to log expense audit:', auditError);
        }
        res.status(201).json({
            success: true,
            data: expense,
            policyWarning
        });
    }
    catch (error) {
        logger_1.default.error('Error creating expense:', error);
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
        logger_1.default.error('Error updating expense:', error);
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
        // D1: Audit log for expense deletion
        try {
            await auditService_1.AuditService.logChange(req.user?.companyId, req.user?.id || 'system', 'INVOICE', expense.id, 'DELETE', { expenseNumber: expense.expenseNumber, amount: Number(expense.amount), category: expense.category }, null, req.ip || 'UNKNOWN', req.headers['user-agent'] || 'UNKNOWN', 'EXPENSES');
        }
        catch (auditError) {
            logger_1.default.warn('Failed to log expense delete audit:', auditError);
        }
        res.json({
            success: true,
            data: {}
        });
    }
    catch (error) {
        logger_1.default.error('Error deleting expense:', error);
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
        const userId = req.user?.id;
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
        if (expense.status !== 'PENDING') {
            res.status(400).json({
                success: false,
                message: `Cannot approve expense with status: ${expense.status}`
            });
            return;
        }
        const updatedExpense = await prisma.expense.update({
            where: { id: expenseId },
            data: {
                status: 'APPROVED',
                approvedById: userId,
                approvalDate: new Date()
            },
            include: {
                approvedBy: {
                    select: { id: true, name: true, email: true }
                }
            }
        });
        // Emit EXPENSE_APPROVED event
        try {
            await eventBus_1.default.emit({
                companyId: companyId,
                eventType: eventBus_1.EventTypes.EXPENSE_APPROVED,
                aggregateType: 'Expense',
                aggregateId: updatedExpense.id,
                payload: {
                    expenseId: updatedExpense.id,
                    expenseNumber: expense.expenseNumber,
                    amount: Number(expense.amount),
                    approvedById: userId,
                    approvalDate: updatedExpense.approvalDate
                },
                metadata: { userId: userId || 'system', source: 'api' }
            });
        }
        catch (eventError) {
            logger_1.default.warn('Failed to emit EXPENSE_APPROVED event:', eventError);
        }
        res.json({
            success: true,
            data: updatedExpense
        });
    }
    catch (error) {
        logger_1.default.error('Error approving expense:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
exports.approveExpense = approveExpense;
// @desc    Reject expense
// @route   POST /api/v1/expenses/:id/reject
// @access  Private
const rejectExpense = async (req, res) => {
    try {
        const expenseId = req.params.id;
        const companyId = req.user?.companyId;
        const { reason } = req.body;
        if (!reason) {
            res.status(400).json({
                success: false,
                message: 'Rejection reason is required'
            });
            return;
        }
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
        if (expense.status !== 'PENDING') {
            res.status(400).json({
                success: false,
                message: `Cannot reject expense with status: ${expense.status}`
            });
            return;
        }
        const updatedExpense = await prisma.expense.update({
            where: { id: expenseId },
            data: {
                status: 'REJECTED',
                rejectionReason: reason
            }
        });
        res.json({
            success: true,
            data: updatedExpense
        });
    }
    catch (error) {
        logger_1.default.error('Error rejecting expense:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
exports.rejectExpense = rejectExpense;
// @desc    Mark expense as paid
// @route   POST /api/v1/expenses/:id/paid
// @access  Private
const markAsPaid = async (req, res) => {
    try {
        const expenseId = req.params.id;
        const companyId = req.user?.companyId;
        const userId = req.user?.id;
        const { paymentMethod } = req.body;
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
        // P0: Emit domain event for ledger posting
        try {
            await eventBus_1.default.emit({
                companyId: companyId,
                eventType: 'EXPENSE_PAID',
                aggregateType: 'Expense',
                aggregateId: expense.id,
                payload: {
                    expenseId: expense.id,
                    description: expense.description || expense.category,
                    date: new Date().toISOString(),
                    amount: Number(expense.amount),
                    gstAmount: Number(expense.gstAmount || 0),
                    totalAmount: Number(expense.amount) + Number(expense.gstAmount || 0),
                    category: expense.category,
                    paymentMethod: paymentMethod || expense.paymentMethod
                },
                metadata: {
                    userId: userId || 'system',
                    source: 'api'
                }
            });
        }
        catch (eventError) {
            logger_1.default.warn('Failed to emit EXPENSE_PAID event:', eventError);
        }
        const updatedExpense = await prisma.expense.update({
            where: { id: expenseId },
            data: {
                status: 'PAID',
                paymentMethod: paymentMethod || expense.paymentMethod
            }
        });
        res.json({
            success: true,
            data: updatedExpense
        });
    }
    catch (error) {
        logger_1.default.error('Error marking expense as paid:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
exports.markAsPaid = markAsPaid;
// @desc    Get vendor payment summary (aggregated from expenses)
// @route   GET /api/v1/expenses/vendor-payments
// @access  Private
const getVendorPaymentSummary = async (req, res) => {
    try {
        const companyId = req.user?.companyId;
        // Get all expenses grouped by vendor
        const expenses = await prisma.expense.findMany({
            where: { companyId },
            orderBy: { date: 'desc' }
        });
        // Aggregate by vendor
        const vendorMap = new Map();
        expenses.forEach(expense => {
            const vendor = expense.vendor || 'Unknown';
            const existing = vendorMap.get(vendor) || {
                vendor,
                totalDue: 0,
                paid: 0,
                pending: 0,
                lastPayment: '',
                status: 'current',
                expenseIds: []
            };
            const amount = Number(expense.amount);
            existing.totalDue += amount;
            existing.expenseIds.push(expense.id);
            if (expense.status === 'PAID') {
                existing.paid += amount;
                if (!existing.lastPayment || new Date(expense.date) > new Date(existing.lastPayment)) {
                    existing.lastPayment = expense.date.toISOString();
                }
            }
            else {
                existing.pending += amount;
            }
            vendorMap.set(vendor, existing);
        });
        // Determine status for each vendor
        const vendors = Array.from(vendorMap.values()).map(v => {
            if (v.pending === 0) {
                v.status = 'paid';
            }
            else {
                // Check if any pending expenses are overdue (older than 30 days)
                const hasOverdue = expenses.some(e => e.vendor === v.vendor &&
                    e.status !== 'PAID' &&
                    new Date(e.date) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
                v.status = hasOverdue ? 'overdue' : 'current';
            }
            return v;
        });
        res.json({
            success: true,
            count: vendors.length,
            data: vendors
        });
    }
    catch (error) {
        logger_1.default.error('Error fetching vendor payments:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
exports.getVendorPaymentSummary = getVendorPaymentSummary;
// @desc    Mark expenses as paid (for vendor payment)
// @route   POST /api/v1/expenses/vendor-payments/pay
// @access  Private
const recordVendorPayment = async (req, res) => {
    try {
        const companyId = req.user?.companyId;
        const { vendor, amount, paymentMethod } = req.body;
        if (!vendor || !amount) {
            res.status(400).json({
                success: false,
                message: 'Vendor and amount are required'
            });
            return;
        }
        // Get pending expenses for this vendor
        const pendingExpenses = await prisma.expense.findMany({
            where: {
                companyId,
                vendor,
                status: { not: 'PAID' }
            },
            orderBy: { date: 'asc' }
        });
        let remainingAmount = Number(amount);
        const updatedExpenses = [];
        // Mark expenses as paid up to the amount
        for (const expense of pendingExpenses) {
            if (remainingAmount <= 0)
                break;
            const expenseAmount = Number(expense.amount);
            if (remainingAmount >= expenseAmount) {
                // Fully pay this expense
                const updated = await prisma.expense.update({
                    where: { id: expense.id },
                    data: {
                        status: 'PAID',
                        paymentMethod: paymentMethod || expense.paymentMethod
                    }
                });
                updatedExpenses.push(updated);
                remainingAmount -= expenseAmount;
            }
        }
        res.json({
            success: true,
            message: `Paid ₹${amount} to ${vendor}`,
            data: {
                expensesPaid: updatedExpenses.length,
                remainingAmount
            }
        });
    }
    catch (error) {
        logger_1.default.error('Error recording vendor payment:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
exports.recordVendorPayment = recordVendorPayment;
// @desc    Get expense dashboard statistics
// @route   GET /api/v1/expenses/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res) => {
    try {
        const companyId = req.user?.companyId;
        // Get total budget from all categories
        const categoryBudgets = await prisma.expenseCategory.aggregate({
            where: { companyId },
            _sum: { budget: true }
        });
        const totalBudget = Number(categoryBudgets._sum.budget || 0);
        // 1. Get current month's total expenses
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const currentMonthExpenses = await prisma.expense.aggregate({
            where: {
                companyId,
                date: {
                    gte: firstDayOfMonth,
                    lte: lastDayOfMonth
                }
            },
            _sum: {
                amount: true
            }
        });
        // 2. Get last month's total expenses for comparison
        const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        const lastMonthExpenses = await prisma.expense.aggregate({
            where: {
                companyId,
                date: {
                    gte: firstDayOfLastMonth,
                    lte: lastDayOfLastMonth
                }
            },
            _sum: {
                amount: true
            }
        });
        // 3. Get category-wise breakdown (current month)
        const expensesByCategory = await prisma.expense.groupBy({
            by: ['category'],
            where: {
                companyId,
                date: {
                    gte: firstDayOfMonth,
                    lte: lastDayOfMonth
                }
            },
            _sum: {
                amount: true
            }
        });
        // 4. Get recent 5 expenses
        const recentExpenses = await prisma.expense.findMany({
            where: { companyId },
            orderBy: { date: 'desc' },
            take: 5
        });
        // 5. Get pending payments (expenses with status PENDING)
        const pendingPayments = await prisma.expense.findMany({
            where: {
                companyId,
                status: 'PENDING'
            },
            orderBy: { date: 'asc' },
            take: 5
        });
        // Calculate pending total
        const pendingTotal = await prisma.expense.aggregate({
            where: {
                companyId,
                status: 'PENDING'
            },
            _sum: {
                amount: true
            },
            _count: true
        });
        // Calculate percentage change
        const currentTotal = Number(currentMonthExpenses._sum.amount || 0);
        const lastTotal = Number(lastMonthExpenses._sum.amount || 0);
        let percentChange = 0;
        if (lastTotal > 0) {
            percentChange = ((currentTotal - lastTotal) / lastTotal) * 100;
        }
        else if (currentTotal > 0) {
            percentChange = 100;
        }
        // Format chart data (last 6 months)
        const monthlyData = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const start = new Date(d.getFullYear(), d.getMonth(), 1);
            const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
            const monthExpenses = await prisma.expense.aggregate({
                where: {
                    companyId,
                    date: {
                        gte: start,
                        lte: end
                    }
                },
                _sum: {
                    amount: true
                }
            });
            monthlyData.push({
                month: start.toLocaleString('default', { month: 'short' }),
                amount: Number(monthExpenses._sum.amount || 0),
                budget: totalBudget
            });
        }
        // Standardize colors for categories
        const categoryColors = {
            'Rent': '#2563eb',
            'Salaries': '#10b981',
            'Utilities': '#f97316',
            'Transport': '#8b5cf6',
            'Marketing': '#f59e0b',
            'Office Supplies': '#ec4899',
            'Others': '#6b7280'
        };
        const categoryBreakdown = expensesByCategory.map(item => ({
            name: item.category,
            value: Number(item._sum.amount || 0),
            color: categoryColors[item.category] || '#6b7280'
        }));
        res.json({
            success: true,
            data: {
                kpi: {
                    currentMonthTotal: currentTotal,
                    percentChange: Number(percentChange.toFixed(1)),
                    pendingAmount: Number(pendingTotal._sum.amount || 0),
                    pendingCount: pendingTotal._count,
                    budgetUtilization: totalBudget > 0 ? (currentTotal / totalBudget) * 100 : 0
                },
                monthlyData,
                categoryBreakdown,
                recentExpenses,
                pendingPayments
            }
        });
    }
    catch (error) {
        logger_1.default.error('Error fetching dashboard stats:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
exports.getDashboardStats = getDashboardStats;
// @desc    Get budget vs actual report
// @route   GET /api/v1/expenses/reports/budget-vs-actual
// @access  Private
const getBudgetVsActualReport = async (req, res) => {
    try {
        const companyId = req.user?.companyId;
        const { months = 6 } = req.query;
        // Get total budget from all categories
        const categoryBudgets = await prisma.expenseCategory.aggregate({
            where: { companyId },
            _sum: { budget: true }
        });
        const totalBudget = Number(categoryBudgets._sum.budget || 0);
        const now = new Date();
        const data = [];
        for (let i = Number(months) - 1; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const start = new Date(d.getFullYear(), d.getMonth(), 1);
            const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
            const expenses = await prisma.expense.aggregate({
                where: {
                    companyId,
                    date: { gte: start, lte: end }
                },
                _sum: { amount: true }
            });
            const actual = Number(expenses._sum.amount || 0);
            data.push({
                month: start.toLocaleString('default', { month: 'short' }),
                year: start.getFullYear(),
                expenses: actual,
                budget: totalBudget,
                variance: actual - totalBudget
            });
        }
        res.json({
            success: true,
            data
        });
    }
    catch (error) {
        logger_1.default.error('Error generating budget vs actual report:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
exports.getBudgetVsActualReport = getBudgetVsActualReport;
// @desc    Get category trend report
// @route   GET /api/v1/expenses/reports/category-trend
// @access  Private
const getCategoryTrendReport = async (req, res) => {
    try {
        const companyId = req.user?.companyId;
        const { months = 6 } = req.query;
        const now = new Date();
        const data = [];
        for (let i = Number(months) - 1; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const start = new Date(d.getFullYear(), d.getMonth(), 1);
            const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
            const categoryExpenses = await prisma.expense.groupBy({
                by: ['category'],
                where: {
                    companyId,
                    date: { gte: start, lte: end }
                },
                _sum: { amount: true }
            });
            const monthData = {
                month: start.toLocaleString('default', { month: 'short' }),
                year: start.getFullYear()
            };
            categoryExpenses.forEach(item => {
                monthData[item.category] = Number(item._sum.amount || 0);
            });
            data.push(monthData);
        }
        res.json({
            success: true,
            data
        });
    }
    catch (error) {
        logger_1.default.error('Error generating category trend report:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
exports.getCategoryTrendReport = getCategoryTrendReport;
// @desc    Get vendor summary report
// @route   GET /api/v1/expenses/reports/vendor-summary
// @access  Private
const getVendorSummaryReport = async (req, res) => {
    try {
        const companyId = req.user?.companyId;
        const vendorExpenses = await prisma.expense.groupBy({
            by: ['vendor'],
            where: { companyId },
            _sum: { amount: true },
            _count: true
        });
        const data = vendorExpenses.map(item => ({
            name: item.vendor || 'Unknown',
            value: Number(item._sum.amount || 0),
            count: item._count
        }));
        // Assign colors
        const colors = ['#2563eb', '#10b981', '#f97316', '#8b5cf6', '#ec4899', '#f59e0b', '#6b7280'];
        data.forEach((item, index) => {
            item.color = colors[index % colors.length];
        });
        res.json({
            success: true,
            data
        });
    }
    catch (error) {
        logger_1.default.error('Error generating vendor summary report:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
exports.getVendorSummaryReport = getVendorSummaryReport;
// @desc    Get tax (GST) report
// @route   GET /api/v1/expenses/reports/tax
// @access  Private
const getTaxReport = async (req, res) => {
    try {
        const companyId = req.user?.companyId;
        const { months = 6 } = req.query;
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth() - Number(months) + 1, 1);
        const expensesWithTax = await prisma.expense.aggregate({
            where: {
                companyId,
                date: { gte: startDate },
                gstAmount: { gt: 0 }
            },
            _sum: {
                amount: true,
                gstAmount: true
            }
        });
        const totalAmount = Number(expensesWithTax._sum.amount || 0);
        const totalTax = Number(expensesWithTax._sum.gstAmount || 0);
        const taxableAmount = totalAmount - totalTax;
        const data = [
            {
                name: "GST Input",
                taxableAmount: taxableAmount,
                taxAmount: totalTax,
                percentage: taxableAmount > 0 ? ((totalTax / taxableAmount) * 100).toFixed(1) : "0"
            }
        ];
        res.json({
            success: true,
            data
        });
    }
    catch (error) {
        logger_1.default.error('Error generating tax report:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
exports.getTaxReport = getTaxReport;
//# sourceMappingURL=expensesController.js.map
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
exports.syncBankAccount = exports.getCashFlowForecast = exports.getCashFlowTrends = exports.sendReminder = exports.deletePaymentReminder = exports.updatePaymentReminder = exports.createPaymentReminder = exports.getPaymentReminders = exports.getDashboardSummary = exports.deleteTransaction = exports.createTransaction = exports.getTransactions = exports.deleteAccount = exports.updateAccount = exports.createAccount = exports.getAccount = exports.getAccounts = void 0;
const client_1 = require("@prisma/client");
const bankingIntegrationService_1 = require("../services/bankingIntegrationService");
const auditService_1 = require("../services/auditService"); // D1: Audit logging
const eventBus_1 = __importStar(require("../services/eventBus"));
const logger_1 = __importDefault(require("../config/logger"));
const prisma = new client_1.PrismaClient();
// @desc    Get all bank accounts
// @route   GET /api/v1/banking/accounts
// @access  Private
const getAccounts = async (req, res) => {
    try {
        const companyId = req.user?.companyId;
        const accounts = await prisma.bankAccount.findMany({
            where: { companyId },
            orderBy: { name: 'asc' }
        });
        res.json({
            success: true,
            count: accounts.length,
            data: accounts
        });
    }
    catch (error) {
        logger_1.default.error('Error fetching bank accounts:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
exports.getAccounts = getAccounts;
// @desc    Get single bank account
// @route   GET /api/v1/banking/accounts/:id
// @access  Private
const getAccount = async (req, res) => {
    try {
        const account = await prisma.bankAccount.findFirst({
            where: {
                id: req.params.id,
                companyId: req.user?.companyId
            }
        });
        if (!account) {
            res.status(404).json({
                success: false,
                message: 'Bank account not found'
            });
            return;
        }
        res.json({
            success: true,
            data: account
        });
    }
    catch (error) {
        logger_1.default.error('Error fetching bank account:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
exports.getAccount = getAccount;
// @desc    Create bank account
// @route   POST /api/v1/banking/accounts
// @access  Private
const createAccount = async (req, res) => {
    try {
        const { name, bankName, accountNumber, ifsc, type, balance, status } = req.body;
        const companyId = req.user?.companyId;
        const account = await prisma.bankAccount.create({
            data: {
                companyId: companyId,
                name,
                bankName,
                accountNumber,
                ifsc,
                type,
                balance: Number(balance),
                status: status || 'ACTIVE',
                lastReconciled: new Date()
            }
        });
        res.status(201).json({
            success: true,
            data: account
        });
    }
    catch (error) {
        logger_1.default.error('Error creating bank account:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
exports.createAccount = createAccount;
// @desc    Update bank account
// @route   PUT /api/v1/banking/accounts/:id
// @access  Private
const updateAccount = async (req, res) => {
    try {
        const { name, bankName, accountNumber, ifsc, type, balance, status } = req.body;
        const accountId = req.params.id;
        const companyId = req.user?.companyId;
        const existingAccount = await prisma.bankAccount.findFirst({
            where: { id: accountId, companyId }
        });
        if (!existingAccount) {
            res.status(404).json({
                success: false,
                message: 'Bank account not found'
            });
            return;
        }
        const updatedAccount = await prisma.bankAccount.update({
            where: { id: accountId },
            data: {
                name,
                bankName,
                accountNumber,
                ifsc,
                type,
                balance: Number(balance),
                status
            }
        });
        res.json({
            success: true,
            data: updatedAccount
        });
    }
    catch (error) {
        logger_1.default.error('Error updating bank account:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
exports.updateAccount = updateAccount;
// @desc    Delete bank account
// @route   DELETE /api/v1/banking/accounts/:id
// @access  Private
const deleteAccount = async (req, res) => {
    try {
        const account = await prisma.bankAccount.findFirst({
            where: {
                id: req.params.id,
                companyId: req.user?.companyId
            }
        });
        if (!account) {
            res.status(404).json({
                success: false,
                message: 'Bank account not found'
            });
            return;
        }
        await prisma.bankAccount.delete({
            where: { id: req.params.id }
        });
        res.json({
            success: true,
            data: {}
        });
    }
    catch (error) {
        logger_1.default.error('Error deleting bank account:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
exports.deleteAccount = deleteAccount;
// @desc    Get transactions
// @route   GET /api/v1/banking/transactions
// @access  Private
const getTransactions = async (req, res) => {
    try {
        const companyId = req.user?.companyId;
        const { accountId } = req.query;
        const whereClause = { companyId };
        if (accountId) {
            whereClause.accountId = accountId;
        }
        const transactions = await prisma.transaction.findMany({
            where: whereClause,
            include: {
                account: true
            },
            orderBy: { date: 'desc' }
        });
        res.json({
            success: true,
            count: transactions.length,
            data: transactions
        });
    }
    catch (error) {
        logger_1.default.error('Error fetching transactions:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
exports.getTransactions = getTransactions;
// @desc    Create transaction
// @route   POST /api/v1/banking/transactions
// @access  Private
const createTransaction = async (req, res) => {
    try {
        const { accountId, date, description, category, amount, type, // 'credit' or 'debit'
        reference, partyId } = req.body;
        const companyId = req.user?.companyId;
        if (!accountId || !amount || !type) {
            res.status(400).json({
                success: false,
                message: 'Account, amount, and type are required'
            });
            return;
        }
        // Use transaction to ensure data integrity
        const result = await prisma.$transaction(async (tx) => {
            // 1. Get current account balance
            const account = await tx.bankAccount.findUnique({
                where: { id: accountId },
                select: { balance: true }
            });
            if (!account) {
                throw new Error('Bank account not found');
            }
            const currentBalance = Number(account.balance);
            const transactionAmount = Number(amount);
            // Calculate new balance
            const newBalance = type === 'credit'
                ? currentBalance + transactionAmount
                : currentBalance - transactionAmount;
            // 2. Create the transaction
            const transaction = await tx.transaction.create({
                data: {
                    companyId: companyId,
                    accountId,
                    date: new Date(date),
                    description: description || '',
                    category: category || 'General',
                    amount: transactionAmount,
                    type,
                    reference,
                    status: 'CLEARED'
                },
                include: {
                    account: true
                }
            });
            // 3. Update account balance
            await tx.bankAccount.update({
                where: { id: accountId },
                data: {
                    balance: newBalance,
                    updatedAt: new Date()
                }
            });
            // Emit event for Ledger Posting
            await eventBus_1.default.emit({
                companyId: companyId,
                eventType: eventBus_1.EventTypes.BANK_TRANSACTION_CREATED,
                aggregateType: 'Transaction',
                aggregateId: transaction.id,
                payload: {
                    transactionId: transaction.id,
                    accountId,
                    date: transaction.date,
                    amount: transactionAmount,
                    type,
                    description: description || '',
                    category: category || 'General'
                },
                metadata: { userId: req.user?.id || 'system', source: 'api' }
            }, tx);
            // 4. If partyId is provided, update party balance
            if (partyId) {
                await tx.party.update({
                    where: { id: partyId },
                    data: {
                        currentBalance: {
                            // If we receive money (credit), reduce receivable
                            // If we pay money (debit), reduce payable
                            decrement: transactionAmount
                        }
                    }
                });
            }
            return { transaction, newBalance };
        });
        logger_1.default.info(`Transaction created: ${result.transaction.id} - Bank balance updated to ${result.newBalance}`);
        // D1: Audit log for transaction creation
        try {
            await auditService_1.AuditService.logChange(companyId, req.user?.id || 'system', 'INVOICE', // Using INVOICE as closest EntityType for Transaction
            result.transaction.id, 'CREATE', null, {
                description: result.transaction.description,
                amount: Number(result.transaction.amount),
                type: result.transaction.type,
                accountId
            }, req.ip || 'UNKNOWN', req.headers['user-agent'] || 'UNKNOWN', 'BANKING');
        }
        catch (auditError) {
            logger_1.default.warn('Failed to log transaction audit:', auditError);
        }
        res.status(201).json({
            success: true,
            data: result.transaction
        });
    }
    catch (error) {
        logger_1.default.error('Error creating transaction:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server Error'
        });
    }
};
exports.createTransaction = createTransaction;
// @desc    Delete transaction (with balance reversal)
// @route   DELETE /api/v1/banking/transactions/:id
// @access  Private
const deleteTransaction = async (req, res) => {
    try {
        const transactionId = req.params.id;
        const companyId = req.user?.companyId;
        const existingTransaction = await prisma.transaction.findFirst({
            where: { id: transactionId, companyId }
        });
        if (!existingTransaction) {
            res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
            return;
        }
        // Use transaction to ensure data integrity
        await prisma.$transaction(async (tx) => {
            // 1. Reverse the balance change
            const reverseAmount = existingTransaction.type === 'credit'
                ? -Number(existingTransaction.amount)
                : Number(existingTransaction.amount);
            await tx.bankAccount.update({
                where: { id: existingTransaction.accountId },
                data: {
                    balance: {
                        increment: reverseAmount
                    }
                }
            });
            // 2. Delete the transaction
            await tx.transaction.delete({
                where: { id: transactionId }
            });
        });
        // D1: Audit log for transaction deletion
        try {
            await auditService_1.AuditService.logChange(companyId, req.user?.id || 'system', 'INVOICE', existingTransaction.id, 'DELETE', {
                description: existingTransaction.description,
                amount: Number(existingTransaction.amount),
                type: existingTransaction.type
            }, null, req.ip || 'UNKNOWN', req.headers['user-agent'] || 'UNKNOWN', 'BANKING');
        }
        catch (auditError) {
            logger_1.default.warn('Failed to log transaction delete audit:', auditError);
        }
        res.json({
            success: true,
            message: 'Transaction deleted and balance reversed'
        });
    }
    catch (error) {
        logger_1.default.error('Error deleting transaction:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
exports.deleteTransaction = deleteTransaction;
// @desc    Get banking dashboard summary
// @route   GET /api/v1/banking/dashboard
// @access  Private
const getDashboardSummary = async (req, res) => {
    try {
        const companyId = req.user?.companyId;
        // Get all accounts with balances
        const accounts = await prisma.bankAccount.findMany({
            where: { companyId },
            orderBy: { name: 'asc' }
        });
        // Calculate totals
        const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
        const bankBalance = accounts
            .filter(acc => acc.type === 'Current' || acc.type === 'Savings')
            .reduce((sum, acc) => sum + Number(acc.balance), 0);
        const cashBalance = accounts
            .filter(acc => acc.type === 'Cash')
            .reduce((sum, acc) => sum + Number(acc.balance), 0);
        // Get recent transactions (last 10)
        const recentTransactions = await prisma.transaction.findMany({
            where: { companyId },
            include: { account: true },
            orderBy: { date: 'desc' },
            take: 10
        });
        // Get overdue payment reminders count
        const overdueReminders = await prisma.paymentReminder.count({
            where: {
                companyId,
                status: 'overdue',
                scheduledFor: { lt: new Date() }
            }
        });
        res.json({
            success: true,
            data: {
                accounts: accounts.map(acc => ({
                    id: acc.id,
                    name: acc.name,
                    number: `**** ${acc.accountNumber.slice(-4)}`,
                    balance: Number(acc.balance),
                    type: acc.type,
                    trend: Number(acc.balance) >= 0 ? 'up' : 'down',
                    // Integration Meta
                    provider: acc.provider,
                    syncActive: acc.syncActive,
                    lastSyncAt: acc.lastSyncAt
                })),
                summary: {
                    totalBalance,
                    bankBalance,
                    cashBalance
                },
                recentTransactions: recentTransactions.map(tx => ({
                    id: tx.id,
                    date: tx.date,
                    description: tx.description,
                    amount: Number(tx.amount),
                    type: tx.type,
                    status: tx.status,
                    accountName: tx.account.name
                })),
                overdueReminders
            }
        });
    }
    catch (error) {
        logger_1.default.error('Error fetching dashboard summary:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
exports.getDashboardSummary = getDashboardSummary;
// @desc    Get payment reminders
// @route   GET /api/v1/banking/reminders
// @access  Private
const getPaymentReminders = async (req, res) => {
    try {
        const companyId = req.user?.companyId;
        const { type, status } = req.query;
        const whereClause = { companyId };
        if (type)
            whereClause.type = type;
        if (status)
            whereClause.status = status;
        // Update overdue status for past due reminders
        await prisma.paymentReminder.updateMany({
            where: {
                companyId,
                status: 'upcoming',
                scheduledFor: { lt: new Date() }
            },
            data: { status: 'overdue' }
        });
        const reminders = await prisma.paymentReminder.findMany({
            where: whereClause,
            include: { party: true, invoice: true },
            orderBy: { scheduledFor: 'asc' }
        });
        res.json({
            success: true,
            count: reminders.length,
            data: reminders.map(r => ({
                id: r.id,
                partyName: r.party?.name || 'Unknown',
                amount: Number(r.invoice?.totalAmount || 0),
                dueDate: r.scheduledFor,
                type: r.type,
                status: r.status,
                description: r.message,
                lastReminded: r.sentAt
            }))
        });
    }
    catch (error) {
        logger_1.default.error('Error fetching payment reminders:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
exports.getPaymentReminders = getPaymentReminders;
// @desc    Create payment reminder
// @route   POST /api/v1/banking/reminders
// @access  Private
const createPaymentReminder = async (req, res) => {
    try {
        const { partyId, invoiceId, amount, dueDate, type, description } = req.body;
        const companyId = req.user?.companyId;
        if (!partyId || !amount || !dueDate || !type) {
            res.status(400).json({
                success: false,
                message: 'partyId, amount, dueDate, and type are required'
            });
            return;
        }
        const status = new Date(dueDate) < new Date() ? 'overdue' : 'upcoming';
        const reminder = await prisma.paymentReminder.create({
            data: {
                companyId: companyId,
                partyId,
                invoiceId,
                // amount is derived from invoice
                scheduledFor: new Date(dueDate),
                type,
                status,
                message: description || ''
            },
            include: { party: true }
        });
        res.status(201).json({
            success: true,
            data: reminder
        });
    }
    catch (error) {
        logger_1.default.error('Error creating payment reminder:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
exports.createPaymentReminder = createPaymentReminder;
// @desc    Update payment reminder
// @route   PUT /api/v1/banking/reminders/:id
// @access  Private
const updatePaymentReminder = async (req, res) => {
    try {
        const reminderId = req.params.id;
        const companyId = req.user?.companyId;
        const { amount, dueDate, status, description } = req.body;
        const existing = await prisma.paymentReminder.findFirst({
            where: { id: reminderId, companyId }
        });
        if (!existing) {
            res.status(404).json({
                success: false,
                message: 'Payment reminder not found'
            });
            return;
        }
        const reminder = await prisma.paymentReminder.update({
            where: { id: reminderId },
            data: {
                // amount cannot be updated here as it's from invoice
                ...(dueDate && { scheduledFor: new Date(dueDate) }),
                ...(status && { status }),
                ...(description !== undefined && { message: description })
            },
            include: { party: true }
        });
        res.json({
            success: true,
            data: reminder
        });
    }
    catch (error) {
        logger_1.default.error('Error updating payment reminder:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
exports.updatePaymentReminder = updatePaymentReminder;
// @desc    Delete payment reminder
// @route   DELETE /api/v1/banking/reminders/:id
// @access  Private
const deletePaymentReminder = async (req, res) => {
    try {
        const reminderId = req.params.id;
        const companyId = req.user?.companyId;
        const existing = await prisma.paymentReminder.findFirst({
            where: { id: reminderId, companyId }
        });
        if (!existing) {
            res.status(404).json({
                success: false,
                message: 'Payment reminder not found'
            });
            return;
        }
        await prisma.paymentReminder.delete({
            where: { id: reminderId }
        });
        res.json({
            success: true,
            data: {}
        });
    }
    catch (error) {
        logger_1.default.error('Error deleting payment reminder:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
exports.deletePaymentReminder = deletePaymentReminder;
// @desc    Send reminder (update lastRemindedAt)
// @route   POST /api/v1/banking/reminders/:id/send
// @access  Private
const sendReminder = async (req, res) => {
    try {
        const reminderId = req.params.id;
        const companyId = req.user?.companyId;
        const existing = await prisma.paymentReminder.findFirst({
            where: { id: reminderId, companyId },
            include: { party: true }
        });
        if (!existing) {
            res.status(404).json({
                success: false,
                message: 'Payment reminder not found'
            });
            return;
        }
        const reminder = await prisma.paymentReminder.update({
            where: { id: reminderId },
            data: { sentAt: new Date() },
            include: { party: true }
        });
        // In the future, this could send email/SMS notifications
        res.json({
            success: true,
            message: `Reminder sent to ${existing.party.name}`,
            data: reminder
        });
    }
    catch (error) {
        logger_1.default.error('Error sending reminder:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
exports.sendReminder = sendReminder;
// @desc    Get Cash Flow Monthly Trends
// @route   GET /api/v1/banking/cash-flow-trends
const getCashFlowTrends = async (req, res) => {
    try {
        const companyId = req.user?.companyId;
        const monthsToFetch = 6;
        const trends = [];
        for (let i = 0; i < monthsToFetch; i++) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const month = date.getMonth() + 1;
            const year = date.getFullYear();
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59);
            const transactions = await prisma.transaction.findMany({
                where: {
                    companyId,
                    date: { gte: startDate, lte: endDate }
                },
                select: { amount: true, type: true }
            });
            const inflow = transactions
                .filter(t => t.type === 'credit')
                .reduce((sum, t) => sum + Number(t.amount), 0);
            const outflow = transactions
                .filter(t => t.type === 'debit')
                .reduce((sum, t) => sum + Number(t.amount), 0);
            trends.unshift({
                month: date.toLocaleString('default', { month: 'short' }),
                year,
                inflow,
                outflow,
                net: inflow - outflow
            });
        }
        res.json({
            success: true,
            data: trends
        });
    }
    catch (error) {
        logger_1.default.error('Error fetching cash flow trends:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
exports.getCashFlowTrends = getCashFlowTrends;
// @desc    Get Cash Flow Forecast
// @route   GET /api/v1/banking/cash-flow-forecast
// @access  Private
const getCashFlowForecast = async (req, res) => {
    try {
        const companyId = req.user?.companyId;
        const monthsInPast = 6;
        const monthsToForecast = 6;
        // 1. Calculate historical average monthly inflow/outflow
        const pastDate = new Date();
        pastDate.setMonth(pastDate.getMonth() - monthsInPast);
        const historicalTransactions = await prisma.transaction.findMany({
            where: {
                companyId,
                date: { gte: pastDate }
            },
            select: { amount: true, type: true }
        });
        const totalInflow = historicalTransactions
            .filter(t => t.type === 'credit')
            .reduce((sum, t) => sum + Number(t.amount), 0);
        const totalOutflow = historicalTransactions
            .filter(t => t.type === 'debit')
            .reduce((sum, t) => sum + Number(t.amount), 0);
        const avgInflow = totalInflow / monthsInPast;
        const avgOutflow = totalOutflow / monthsInPast;
        // 2. Get current balance
        const accounts = await prisma.bankAccount.findMany({
            where: { companyId },
            select: { balance: true }
        });
        const currentBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
        // 3. Generate forecast
        const forecast = [];
        let projectedBalance = currentBalance;
        for (let i = 1; i <= monthsToForecast; i++) {
            const date = new Date();
            date.setMonth(date.getMonth() + i);
            // Slightly adjust avg based on simple growth/seasonality if needed
            // For now, keep it simple
            const monthlyNet = avgInflow - avgOutflow;
            projectedBalance += monthlyNet;
            forecast.push({
                month: date.toLocaleString('default', { month: 'short' }),
                year: date.getFullYear(),
                inflow: Math.round(avgInflow),
                outflow: Math.round(avgOutflow),
                balance: Math.round(projectedBalance)
            });
        }
        // 4. Dynamic Alerts
        const alerts = [];
        if (projectedBalance < 0) {
            alerts.push({
                type: 'critical',
                message: `Projected cash deficit of ${Math.round(Math.abs(projectedBalance))} expected by ${forecast[monthsToForecast - 1].month} ${forecast[monthsToForecast - 1].year}.`,
                action: 'Review pending payments or arrange financing.'
            });
        }
        else if (projectedBalance < currentBalance * 0.5) {
            alerts.push({
                type: 'warning',
                message: 'Cash reserves are projected to decline by more than 50% in the next 6 months.',
                action: 'Consider reducing discretionary expenses.'
            });
        }
        else {
            alerts.push({
                type: 'info',
                message: 'Cash flow is projected to remain stable over the next 6 months.',
                action: 'Good time to consider investment opportunities.'
            });
        }
        res.json({
            success: true,
            data: {
                currentBalance,
                avgInflow: Math.round(avgInflow),
                avgOutflow: Math.round(avgOutflow),
                forecast,
                alerts
            }
        });
    }
    catch (error) {
        logger_1.default.error('Error calculating cash flow forecast:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
exports.getCashFlowForecast = getCashFlowForecast;
// @desc    Sync Bank Account with Provider
// @route   POST /api/v1/banking/accounts/:id/sync
// @access  Private
const syncBankAccount = async (req, res) => {
    try {
        const accountId = req.params.id;
        const companyId = req.user?.companyId;
        if (!companyId)
            throw new Error('Unauthorized');
        const result = await bankingIntegrationService_1.BankingIntegrationService.syncTransactions(accountId, companyId);
        res.json(result);
    }
    catch (error) {
        logger_1.default.error('Error syncing bank account:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server Error'
        });
    }
};
exports.syncBankAccount = syncBankAccount;
//# sourceMappingURL=bankingController.js.map
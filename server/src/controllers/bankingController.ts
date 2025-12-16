import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

// @desc    Get all bank accounts
// @route   GET /api/v1/banking/accounts
// @access  Private
export const getAccounts = async (req: AuthRequest, res: Response) => {
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
    } catch (error) {
        console.error('Error fetching bank accounts:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Get single bank account
// @route   GET /api/v1/banking/accounts/:id
// @access  Private
export const getAccount = async (req: AuthRequest, res: Response) => {
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
    } catch (error) {
        console.error('Error fetching bank account:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Create bank account
// @route   POST /api/v1/banking/accounts
// @access  Private
export const createAccount = async (req: AuthRequest, res: Response) => {
    try {
        const {
            name,
            bankName,
            accountNumber,
            ifsc,
            type,
            balance,
            status
        } = req.body;

        const companyId = req.user?.companyId;

        const account = await prisma.bankAccount.create({
            data: {
                companyId: companyId!,
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
    } catch (error) {
        console.error('Error creating bank account:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Update bank account
// @route   PUT /api/v1/banking/accounts/:id
// @access  Private
export const updateAccount = async (req: AuthRequest, res: Response) => {
    try {
        const {
            name,
            bankName,
            accountNumber,
            ifsc,
            type,
            balance,
            status
        } = req.body;

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
    } catch (error) {
        console.error('Error updating bank account:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Delete bank account
// @route   DELETE /api/v1/banking/accounts/:id
// @access  Private
export const deleteAccount = async (req: AuthRequest, res: Response) => {
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
    } catch (error) {
        console.error('Error deleting bank account:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Get transactions
// @route   GET /api/v1/banking/transactions
// @access  Private
export const getTransactions = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user?.companyId;
        const { accountId } = req.query;

        const whereClause: any = { companyId };
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
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Create transaction
// @route   POST /api/v1/banking/transactions
// @access  Private
export const createTransaction = async (req: AuthRequest, res: Response) => {
    try {
        const {
            accountId,
            date,
            description,
            category,
            amount,
            type,  // 'credit' or 'debit'
            reference,
            partyId
        } = req.body;

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
                    companyId: companyId!,
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
                data: { balance: newBalance }
            });

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

        console.log(`Transaction created: ${result.transaction.id} - Bank balance updated to ${result.newBalance}`);

        res.status(201).json({
            success: true,
            data: result.transaction
        });
    } catch (error: any) {
        console.error('Error creating transaction:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server Error'
        });
    }
};

// @desc    Delete transaction (with balance reversal)
// @route   DELETE /api/v1/banking/transactions/:id
// @access  Private
export const deleteTransaction = async (req: AuthRequest, res: Response) => {
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

        res.json({
            success: true,
            message: 'Transaction deleted and balance reversed'
        });
    } catch (error) {
        console.error('Error deleting transaction:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Get banking dashboard summary
// @route   GET /api/v1/banking/dashboard
// @access  Private
export const getDashboardSummary = async (req: AuthRequest, res: Response) => {
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
                dueDate: { lt: new Date() }
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
                    trend: Number(acc.balance) >= 0 ? 'up' : 'down'
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
    } catch (error) {
        console.error('Error fetching dashboard summary:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Get payment reminders
// @route   GET /api/v1/banking/reminders
// @access  Private
export const getPaymentReminders = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user?.companyId;
        const { type, status } = req.query;

        const whereClause: any = { companyId };
        if (type) whereClause.type = type;
        if (status) whereClause.status = status;

        // Update overdue status for past due reminders
        await prisma.paymentReminder.updateMany({
            where: {
                companyId,
                status: 'upcoming',
                dueDate: { lt: new Date() }
            },
            data: { status: 'overdue' }
        });

        const reminders = await prisma.paymentReminder.findMany({
            where: whereClause,
            include: { party: true },
            orderBy: { dueDate: 'asc' }
        });

        res.json({
            success: true,
            count: reminders.length,
            data: reminders.map(r => ({
                id: r.id,
                partyName: r.party.name,
                amount: Number(r.amount),
                dueDate: r.dueDate,
                type: r.type,
                status: r.status,
                description: r.description,
                lastReminded: r.lastRemindedAt
            }))
        });
    } catch (error) {
        console.error('Error fetching payment reminders:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Create payment reminder
// @route   POST /api/v1/banking/reminders
// @access  Private
export const createPaymentReminder = async (req: AuthRequest, res: Response) => {
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
                companyId: companyId!,
                partyId,
                invoiceId,
                amount: Number(amount),
                dueDate: new Date(dueDate),
                type,
                status,
                description
            },
            include: { party: true }
        });

        res.status(201).json({
            success: true,
            data: reminder
        });
    } catch (error) {
        console.error('Error creating payment reminder:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Update payment reminder
// @route   PUT /api/v1/banking/reminders/:id
// @access  Private
export const updatePaymentReminder = async (req: AuthRequest, res: Response) => {
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
                ...(amount !== undefined && { amount: Number(amount) }),
                ...(dueDate && { dueDate: new Date(dueDate) }),
                ...(status && { status }),
                ...(description !== undefined && { description })
            },
            include: { party: true }
        });

        res.json({
            success: true,
            data: reminder
        });
    } catch (error) {
        console.error('Error updating payment reminder:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Delete payment reminder
// @route   DELETE /api/v1/banking/reminders/:id
// @access  Private
export const deletePaymentReminder = async (req: AuthRequest, res: Response) => {
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
    } catch (error) {
        console.error('Error deleting payment reminder:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Send reminder (update lastRemindedAt)
// @route   POST /api/v1/banking/reminders/:id/send
// @access  Private
export const sendReminder = async (req: AuthRequest, res: Response) => {
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
            data: { lastRemindedAt: new Date() },
            include: { party: true }
        });

        // In the future, this could send email/SMS notifications

        res.json({
            success: true,
            message: `Reminder sent to ${existing.party.name}`,
            data: reminder
        });
    } catch (error) {
        console.error('Error sending reminder:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

import { Request, Response } from 'express';
import prisma from '../../config/prisma';
import logger from '../../config/logger';
import { AuthRequest } from '../../middleware/auth';

// Helper: Calculate Ledger Balance
const getLedgerBalance = async (ledgerId: string, companyId: string, startDate?: Date, endDate?: Date) => {
    const where: any = {
        ledgerId,
        companyId,
    };

    if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
    }

    const postings = await prisma.ledgerPosting.findMany({
        where,
        select: { amount: true, type: true }
    });

    let debit = 0;
    let credit = 0;

    postings.forEach(p => {
        if (p.type === 'DEBIT') debit += Number(p.amount);
        else credit += Number(p.amount);
    });

    return { debit, credit };
};

// @desc    Get Profit & Loss Statement
// @route   GET /api/v1/accounting/reports/profit-loss
// @access  Private
export const getProfitLoss = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user.companyId;
        const { startDate, endDate } = req.query;

        const start = startDate ? new Date(startDate as string) : undefined;
        const end = endDate ? new Date(endDate as string) : undefined;

        // 1. Fetch Income & Expense Ledgers
        const ledgers = await prisma.ledger.findMany({
            where: {
                companyId,
                group: {
                    type: { in: ['INCOME', 'EXPENSE'] }
                }
            },
            include: { group: true }
        });

        const report = {
            income: { total: 0, groups: {} as any },
            expense: { total: 0, groups: {} as any },
            netProfit: 0
        };

        // 2. Calculate Balances
        for (const ledger of ledgers) {
            const { debit, credit } = await getLedgerBalance(ledger.id, companyId, start, end);

            // For Income (Credit is positive), For Expense (Debit is positive)
            let balance = 0;
            if (ledger.group.type === 'INCOME') {
                balance = credit - debit;
            } else {
                balance = debit - credit;
            }

            // Grouping logic (Simplified by Group Name)
            const section = ledger.group.type === 'INCOME' ? report.income : report.expense;
            section.total += balance;

            if (!section.groups[ledger.group.name]) {
                section.groups[ledger.group.name] = { total: 0, ledgers: [] };
            }
            section.groups[ledger.group.name].total += balance;
            section.groups[ledger.group.name].ledgers.push({
                name: ledger.name,
                code: ledger.code,
                balance
            });
        }

        report.netProfit = report.income.total - report.expense.total;

        res.json({ success: true, data: report });

    } catch (error: any) {
        logger.error('Get P&L error:', error);
        res.status(500).json({ success: false, message: 'Error generating P&L report' });
    }
};

// @desc    Get Balance Sheet
// @route   GET /api/v1/accounting/reports/balance-sheet
// @access  Private
export const getBalanceSheet = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user.companyId;
        const { asOfDate } = req.query;

        const date = asOfDate ? new Date(asOfDate as string) : new Date();

        // 1. Fetch Asset, Liability, Equity Ledgers
        const ledgers = await prisma.ledger.findMany({
            where: {
                companyId,
                group: {
                    type: { in: ['ASSET', 'LIABILITY', 'EQUITY'] }
                }
            },
            include: { group: true }
        });

        const report = {
            assets: { total: 0, groups: {} as any },
            liabilities: { total: 0, groups: {} as any },
            equity: { total: 0, groups: {} as any },
            totalLiabilitiesAndEquity: 0
        };

        // 2. Calculate P&L for Retained Earnings (Net Profit till date)
        // Note: Ideally, previous years' profit is moved to Retained Earnings account.
        // For simplicity, we calculate total Net Profit dynamically.
        // Fetch ALL Income/Expense to calculate accumulated profit/loss
        const pnlLedgers = await prisma.ledger.findMany({
            where: {
                companyId,
                group: { type: { in: ['INCOME', 'EXPENSE'] } }
            },
            include: { group: true }
        });

        let netProfit = 0;
        for (const l of pnlLedgers) {
            const { debit, credit } = await getLedgerBalance(l.id, companyId, undefined, date);
            if (l.group.type === 'INCOME') netProfit += (credit - debit);
            else netProfit += (debit - credit); // Expense
        }


        // 3. Process Balance Sheet Items
        for (const ledger of ledgers) {
            const { debit, credit } = await getLedgerBalance(ledger.id, companyId, undefined, date);
            const opening = ledger.openingType === 'DEBIT' ? Number(ledger.openingBalance) : -Number(ledger.openingBalance);

            // Assets: Dr > Cr. Liabilities/Equity: Cr > Dr.
            // Balance = Opening + (Dr - Cr) [Asset] OR Opening + (Cr - Dr) [Liab]
            // Actually opening balance should flow into Dr/Cr summation if posted as opening voucher.
            // Assuming opening balance is just a static field for now, we add it.

            let balance = 0;
            if (ledger.group.type === 'ASSET') {
                balance = (debit - credit) + (ledger.openingType === 'DEBIT' ? Number(ledger.openingBalance) : -Number(ledger.openingBalance));
            } else {
                balance = (credit - debit) + (ledger.openingType === 'CREDIT' ? Number(ledger.openingBalance) : -Number(ledger.openingBalance));
            }

            const sectionType = ledger.group.type.toLowerCase() as 'assets' | 'liabilities' | 'equity';
            const section = report[sectionType];

            section.total += balance;

            if (!section.groups[ledger.group.name]) {
                section.groups[ledger.group.name] = { total: 0, ledgers: [] };
            }
            section.groups[ledger.group.name].total += balance;
            section.groups[ledger.group.name].ledgers.push({
                name: ledger.name,
                code: ledger.code,
                balance
            });
        }

        // Add Net Profit to Equity
        // If "Retained Earnings" ledger exists, it should be there. If not, auto-calculate.
        if (netProfit !== 0) {
            if (!report.equity.groups['Retained Earnings']) {
                report.equity.groups['Retained Earnings'] = { total: 0, ledgers: [] };
            }
            report.equity.groups['Retained Earnings'].ledgers.push({
                name: "Net Profit / Loss (Current Period)",
                code: "RE-AUTOGEN",
                balance: netProfit
            });
            report.equity.groups['Retained Earnings'].total += netProfit;
            report.equity.total += netProfit;
        }

        report.totalLiabilitiesAndEquity = report.liabilities.total + report.equity.total;

        res.json({ success: true, data: report });

    } catch (error: any) {
        logger.error('Get Balance Sheet error:', error);
        res.status(500).json({ success: false, message: 'Error generating Balance Sheet' });
    }
};

// @desc    Get Profit & Loss Monthly Trends
// @route   GET /api/v1/accounting/reports/profit-loss-trends
export const getProfitLossTrends = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user.companyId;
        const monthsToFetch = 12; // Typical for P&L analysis
        const trends = [];

        for (let i = 0; i < monthsToFetch; i++) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const month = date.getMonth() + 1;
            const year = date.getFullYear();

            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59);

            // Fetch Income & Expense Ledgers
            const ledgers = await prisma.ledger.findMany({
                where: {
                    companyId,
                    group: { type: { in: ['INCOME', 'EXPENSE'] } }
                },
                include: { group: true }
            });

            let monthlyRevenue = 0;
            let monthlyExpense = 0;

            for (const ledger of ledgers) {
                const { debit, credit } = await getLedgerBalance(ledger.id, companyId, startDate, endDate);
                if (ledger.group.type === 'INCOME') {
                    monthlyRevenue += (credit - debit);
                } else {
                    monthlyExpense += (debit - credit);
                }
            }

            trends.unshift({
                month: date.toLocaleString('default', { month: 'short' }),
                year,
                revenue: monthlyRevenue,
                expenses: monthlyExpense,
                profit: monthlyRevenue - monthlyExpense
            });
        }

        res.json({ success: true, data: trends });

    } catch (error: any) {
        logger.error('Get P&L Trends error:', error);
        res.status(500).json({ success: false, message: 'Error generating P&L trends' });
    }
};

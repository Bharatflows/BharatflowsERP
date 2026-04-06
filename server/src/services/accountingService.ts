/**
 * Accounting Service
 * Core service for Chart of Accounts, Vouchers, and Ledger Postings
 */

import { PrismaClient, Prisma } from '@prisma/client';

// Type definitions for SQLite (no enums)
type AccountType = 'ASSET' | 'LIABILITY' | 'INCOME' | 'EXPENSE' | 'EQUITY';
type VoucherType = 'PAYMENT' | 'RECEIPT' | 'CONTRA' | 'JOURNAL' | 'SALES' | 'PURCHASE' | 'DEBIT_NOTE' | 'CREDIT_NOTE';
type PostingType = 'DEBIT' | 'CREDIT';
type VoucherStatus = 'DRAFT' | 'POSTED' | 'CANCELLED' | 'REVERSED';

const prisma = new PrismaClient();

// ==================== DEFAULT CHART OF ACCOUNTS ====================

interface DefaultLedgerGroup {
    name: string;
    code: string;
    type: AccountType;
    children?: DefaultLedgerGroup[];
    ledgers?: { name: string; code: string; isSystem?: boolean }[];
}

const DEFAULT_LEDGER_GROUPS: DefaultLedgerGroup[] = [
    {
        name: 'Assets',
        code: 'ASSETS',
        type: 'ASSET',
        children: [
            {
                name: 'Current Assets',
                code: 'CURRENT_ASSETS',
                type: 'ASSET',
                children: [
                    {
                        name: 'Cash in Hand',
                        code: 'CASH_IN_HAND',
                        type: 'ASSET',
                        ledgers: [{ name: 'Cash', code: 'CASH', isSystem: true }]
                    },
                    {
                        name: 'Bank Accounts',
                        code: 'BANK_ACCOUNTS',
                        type: 'ASSET',
                        // Bank ledgers created dynamically from BankAccount model
                    },
                    {
                        name: 'Sundry Debtors',
                        code: 'SUNDRY_DEBTORS',
                        type: 'ASSET',
                        // Party ledgers created dynamically for Customers
                    },
                    {
                        name: 'Tax Receivables',
                        code: 'TAX_RECEIVABLES',
                        type: 'ASSET',
                        ledgers: [
                            { name: 'GST Input Credit', code: 'GST_INPUT', isSystem: true }
                        ]
                    }
                ]
            },
            {
                name: 'Fixed Assets',
                code: 'FIXED_ASSETS',
                type: 'ASSET',
                ledgers: [
                    { name: 'Furniture & Fixtures', code: 'FURNITURE' },
                    { name: 'Computer Equipment', code: 'COMPUTERS' },
                    { name: 'Office Equipment', code: 'OFFICE_EQUIPMENT' }
                ]
            }
        ]
    },
    {
        name: 'Liabilities',
        code: 'LIABILITIES',
        type: 'LIABILITY',
        children: [
            {
                name: 'Current Liabilities',
                code: 'CURRENT_LIABILITIES',
                type: 'LIABILITY',
                children: [
                    {
                        name: 'Sundry Creditors',
                        code: 'SUNDRY_CREDITORS',
                        type: 'LIABILITY',
                        // Party ledgers created dynamically for Suppliers
                    },
                    {
                        name: 'Duties & Taxes',
                        code: 'DUTIES_TAXES',
                        type: 'LIABILITY',
                        ledgers: [
                            { name: 'CGST Payable', code: 'CGST_PAYABLE', isSystem: true },
                            { name: 'SGST Payable', code: 'SGST_PAYABLE', isSystem: true },
                            { name: 'IGST Payable', code: 'IGST_PAYABLE', isSystem: true },
                            { name: 'TDS Payable', code: 'TDS_PAYABLE', isSystem: true }
                        ]
                    }
                ]
            }
        ]
    },
    {
        name: 'Income',
        code: 'INCOME',
        type: 'INCOME',
        children: [
            {
                name: 'Sales Accounts',
                code: 'SALES_ACCOUNTS',
                type: 'INCOME',
                ledgers: [
                    { name: 'Sales - Goods', code: 'SALES_GOODS', isSystem: true },
                    { name: 'Sales - Services', code: 'SALES_SERVICES', isSystem: true },
                    { name: 'Sales Return', code: 'SALES_RETURN', isSystem: true }
                ]
            },
            {
                name: 'Other Income',
                code: 'OTHER_INCOME',
                type: 'INCOME',
                ledgers: [
                    { name: 'Interest Received', code: 'INTEREST_RECEIVED' },
                    { name: 'Discount Received', code: 'DISCOUNT_RECEIVED' }
                ]
            }
        ]
    },
    {
        name: 'Expenses',
        code: 'EXPENSES',
        type: 'EXPENSE',
        children: [
            {
                name: 'Direct Expenses',
                code: 'DIRECT_EXPENSES',
                type: 'EXPENSE',
                ledgers: [
                    { name: 'Purchases', code: 'PURCHASES', isSystem: true },
                    { name: 'Purchase Return', code: 'PURCHASE_RETURN', isSystem: true },
                    { name: 'Freight Inward', code: 'FREIGHT_INWARD' }
                ]
            },
            {
                name: 'Indirect Expenses',
                code: 'INDIRECT_EXPENSES',
                type: 'EXPENSE',
                ledgers: [
                    { name: 'Salaries & Wages', code: 'SALARIES' },
                    { name: 'Rent', code: 'RENT' },
                    { name: 'Electricity', code: 'ELECTRICITY' },
                    { name: 'Office Expenses', code: 'OFFICE_EXPENSES' },
                    { name: 'Telephone & Internet', code: 'TELEPHONE' },
                    { name: 'Printing & Stationery', code: 'PRINTING' },
                    { name: 'Bank Charges', code: 'BANK_CHARGES' },
                    { name: 'Miscellaneous Expenses', code: 'MISC_EXPENSES' },
                    { name: 'Discount Allowed', code: 'DISCOUNT_ALLOWED', isSystem: true },
                    { name: 'Round Off', code: 'ROUND_OFF', isSystem: true }
                ]
            }
        ]
    },
    {
        name: 'Capital',
        code: 'CAPITAL',
        type: 'EQUITY',
        ledgers: [
            { name: 'Capital Account', code: 'CAPITAL_ACCOUNT', isSystem: true },
            { name: 'Drawings', code: 'DRAWINGS' },
            { name: 'Profit & Loss Account', code: 'PL_ACCOUNT', isSystem: true }
        ]
    }
];

// ==================== SEED DEFAULT GROUPS ====================

async function createGroupsRecursively(
    companyId: string,
    groups: DefaultLedgerGroup[],
    parentId?: string
): Promise<void> {
    for (const group of groups) {
        // Create group
        const createdGroup = await prisma.ledgerGroup.upsert({
            where: { companyId_code: { companyId, code: group.code } },
            update: { name: group.name, type: group.type, parentId },
            create: {
                name: group.name,
                code: group.code,
                type: group.type,
                parentId,
                companyId
            }
        });

        // Create ledgers for this group
        if (group.ledgers) {
            for (const ledger of group.ledgers) {
                await prisma.ledger.upsert({
                    where: { companyId_code: { companyId, code: ledger.code } },
                    update: { name: ledger.name, groupId: createdGroup.id },
                    create: {
                        name: ledger.name,
                        code: ledger.code,
                        groupId: createdGroup.id,
                        companyId,
                        isSystemLedger: ledger.isSystem || false
                    }
                });
            }
        }

        // Recursively create child groups
        if (group.children) {
            await createGroupsRecursively(companyId, group.children, createdGroup.id);
        }
    }
}

export async function seedDefaultLedgerGroups(companyId: string): Promise<void> {
    await createGroupsRecursively(companyId, DEFAULT_LEDGER_GROUPS);
}

// ==================== LEDGER GROUP OPERATIONS ====================

export async function getLedgerGroups(companyId: string) {
    return prisma.ledgerGroup.findMany({
        where: { companyId },
        include: {
            children: true,
            ledgers: {
                select: { id: true, name: true, code: true }
            },
            parent: { select: { id: true, name: true } }
        },
        orderBy: { name: 'asc' }
    });
}

export async function createLedgerGroup(data: {
    name: string;
    code: string;
    type: AccountType;
    description?: string;
    parentId?: string;
    companyId: string;
}) {
    return prisma.ledgerGroup.create({ data });
}

// ==================== LEDGER OPERATIONS ====================

export async function getLedgers(companyId: string) {
    return prisma.ledger.findMany({
        where: { companyId, isActive: true },
        include: {
            group: { select: { id: true, name: true, type: true } },
            party: { select: { id: true, name: true, type: true } }
        },
        orderBy: { name: 'asc' }
    });
}

export async function getLedger(id: string) {
    return prisma.ledger.findUnique({
        where: { id },
        include: {
            group: true,
            party: true,
            postings: {
                include: { voucher: true },
                orderBy: { createdAt: 'desc' },
                take: 100
            }
        }
    });
}

export async function createLedger(data: {
    name: string;
    code: string;
    groupId: string;
    description?: string;
    openingBalance?: number;
    openingType?: PostingType;
    partyId?: string;
    bankAccountId?: string;
    companyId: string;
}) {
    return prisma.ledger.create({
        data: {
            ...data,
            openingBalance: data.openingBalance || 0,
            openingType: data.openingType || 'DEBIT'
        }
    });
}

export async function updateLedger(id: string, data: {
    name?: string;
    code?: string;
    groupId?: string;
    description?: string;
    openingBalance?: number;
    openingType?: PostingType;
    isActive?: boolean;
}) {
    return prisma.ledger.update({
        where: { id },
        data
    });
}

export async function getLedgerBalance(
    ledgerId: string,
    asOfDate?: Date
): Promise<{ debit: number; credit: number; balance: number; type: 'Dr' | 'Cr' }> {
    const ledger = await prisma.ledger.findUnique({
        where: { id: ledgerId },
        include: { group: true }
    });

    if (!ledger) throw new Error('Ledger not found');

    const whereClause: any = { ledgerId };
    if (asOfDate) {
        whereClause.voucher = { date: { lte: asOfDate } };
    }

    const postings = await prisma.ledgerPosting.findMany({
        where: whereClause,
        include: { voucher: true }
    });

    let totalDebit = Number(ledger.openingType === 'DEBIT' ? ledger.openingBalance : 0);
    let totalCredit = Number(ledger.openingType === 'CREDIT' ? ledger.openingBalance : 0);

    for (const posting of postings) {
        if (posting.type === 'DEBIT') {
            totalDebit += Number(posting.amount);
        } else {
            totalCredit += Number(posting.amount);
        }
    }

    const netBalance = totalDebit - totalCredit;
    const isDebitBalance = netBalance >= 0;

    return {
        debit: totalDebit,
        credit: totalCredit,
        balance: Math.abs(netBalance),
        type: isDebitBalance ? 'Dr' : 'Cr'
    };
}

// ==================== VOUCHER OPERATIONS ====================

interface PostingInput {
    ledgerId: string;
    amount: number;
    type: PostingType;
    narration?: string;
    costCenterId?: string; // P1: Accounting Dimension
    projectId?: string;    // P1: Accounting Dimension
    partyId?: string;      // P1: Party Override
}

// Helper to get Financial Year and Period for a date
async function getFinancialYearForDate(companyId: string, date: Date) {
    // 1. Find FY covering this date
    const fy = await prisma.financialYear.findFirst({
        where: {
            companyId,
            startDate: { lte: date },
            endDate: { gte: date }
        },
        include: {
            periods: true // Include periods to check for specific locking
        }
    });

    if (!fy) {
        throw new Error(`No Financial Year defined for date ${date.toISOString().split('T')[0]}`);
    }

    // 2. Check FY Level Lock
    if (fy.isLocked) {
        throw new Error(`Financial Year ${fy.name} is LOCKED. Cannot post voucher.`);
    }

    // 3. Check Period Level Lock (e.g., Quarter)
    const period = fy.periods.find(p => date >= p.startDate && date <= p.endDate);
    if (period && period.isLocked) {
        throw new Error(`Financial Period ${period.name} (${period.startDate.toISOString().split('T')[0]} - ${period.endDate.toISOString().split('T')[0]}) is LOCKED.`);
    }

    return fy;
}


import { accountingPostingService } from './accountingPostingService';

// ... (existing imports)

// ... (inside the file)

export async function createVoucher(data: {
    voucherNumber?: string; // Optional: can be auto-generated
    date: Date;
    type: VoucherType;
    referenceType: string; // Changed to required string as per usage
    referenceId: string;   // Changed to required
    narration?: string;
    companyId: string;
    createdById?: string;
    postings: PostingInput[];
    status?: VoucherStatus;
}, tx: any = prisma) {
    // Delegate to Central Accounting Posting Service
    // Note: We adapt the input to match VoucherRequest
    return accountingPostingService.createVoucher({
        companyId: data.companyId,
        date: data.date,
        type: data.type,
        referenceType: data.referenceType!,
        referenceId: data.referenceId!,
        narration: data.narration || '',
        postings: data.postings.map(p => ({
            ...p,
            costCenterId: p.costCenterId,
            projectId: p.projectId,
            partyId: p.partyId
        })),
        createdById: data.createdById,
        status: data.status,
        voucherNumber: data.voucherNumber
    }, tx);
}

export async function getVouchers(
    companyId: string,
    filters?: { type?: VoucherType; from?: Date; to?: Date }
) {
    const where: any = { companyId };
    if (filters?.type) where.type = filters.type;
    if (filters?.from || filters?.to) {
        where.date = {};
        if (filters.from) where.date.gte = filters.from;
        if (filters.to) where.date.lte = filters.to;
    }

    return prisma.voucher.findMany({
        where,
        include: {
            postings: {
                include: { ledger: { select: { id: true, name: true, code: true } } }
            }
        },
        orderBy: { date: 'desc' }
    });
}

export async function getVoucher(id: string) {
    return prisma.voucher.findUnique({
        where: { id },
        include: {
            postings: { include: { ledger: true } }
        }
    });
}

// ==================== REPORTING ====================

export async function getTrialBalance(companyId: string, asOfDate?: Date) {
    const ledgers = await prisma.ledger.findMany({
        where: { companyId, isActive: true },
        include: { group: true }
    });

    const result = [];

    for (const ledger of ledgers) {
        const balance = await getLedgerBalance(ledger.id, asOfDate);

        // Only include ledgers with non-zero balance
        if (balance.balance === 0) continue;

        // According to accounting rules:
        // - ASSET & EXPENSE accounts normally have DEBIT balances
        // - LIABILITY, INCOME, EQUITY accounts normally have CREDIT balances
        // The Trial Balance shows the CLOSING balance in the appropriate column
        const groupType = ledger.group.type;
        const isDebitNature = groupType === 'ASSET' || groupType === 'EXPENSE';

        let debit = 0;
        let credit = 0;

        if (balance.type === 'Dr') {
            debit = balance.balance;
        } else {
            credit = balance.balance;
        }

        result.push({
            ledgerId: ledger.id,
            ledgerName: ledger.name,
            ledgerCode: ledger.code,
            groupName: ledger.group.name,
            groupType: groupType,
            debit,
            credit
        });
    }

    const totals = result.reduce(
        (acc, r) => ({
            debit: acc.debit + r.debit,
            credit: acc.credit + r.credit
        }),
        { debit: 0, credit: 0 }
    );

    // Phase 8: Financial Integrity Check
    // Precision handling for floating point math
    const diff = Math.abs(totals.debit - totals.credit);
    const isBalanced = diff < 0.01; // Allow minor floating point variance

    return {
        entries: result,
        totals,
        integrity: {
            isBalanced,
            difference: diff,
            status: isBalanced ? 'BALANCED' : 'UNBALANCED'
        }
    };
}

export async function getProfitAndLoss(companyId: string, startDate: Date, endDate: Date) {
    // 1. Get all Income & Expense Ledgers
    const ledgers = await prisma.ledger.findMany({
        where: {
            companyId,
            group: {
                type: { in: ['INCOME', 'EXPENSE'] }
            }
        },
        include: { group: true }
    });

    const income: any[] = [];
    const expense: any[] = [];

    // 2. Calculate Period Balance for each
    for (const ledger of ledgers) {
        // Calculate net movement in this period
        const postings = await prisma.ledgerPosting.groupBy({
            by: ['type'],
            where: {
                ledgerId: ledger.id,
                voucher: {
                    date: { gte: startDate, lte: endDate },
                    status: 'POSTED' // Only posted vouchers
                }
            },
            _sum: { amount: true } // Assuming amount is Decimal, Prisma returns Decimal or null
        });

        const debit = Number(postings.find(p => p.type === 'DEBIT')?._sum?.amount || 0);
        const credit = Number(postings.find(p => p.type === 'CREDIT')?._sum?.amount || 0);

        // Skip zero movement
        if (debit === 0 && credit === 0) continue;

        const netAmount = Math.abs(credit - debit);
        // For INCOME: Credit > Debit is positive. For EXPENSE: Debit > Credit is positive.

        const item = {
            id: ledger.id,
            name: ledger.name,
            amount: netAmount,
            groupName: ledger.group.name
        };

        if (ledger.group.type === 'INCOME') {
            income.push(item);
        } else {
            expense.push(item);
        }
    }

    const totalIncome = income.reduce((sum, i) => sum + i.amount, 0);
    const totalExpense = expense.reduce((sum, i) => sum + i.amount, 0);
    const netProfit = totalIncome - totalExpense;

    return {
        income,
        expense,
        totals: {
            totalIncome,
            totalExpense,
            netProfit
        }
    };
}

export async function getBalanceSheet(companyId: string, asOfDate: Date) {
    // 1. Get all Asset, Liability, Equity Ledgers
    const ledgers = await prisma.ledger.findMany({
        where: {
            companyId,
            group: {
                type: { in: ['ASSET', 'LIABILITY', 'EQUITY'] }
            }
        },
        include: { group: true }
    });

    const assets: any[] = [];
    const liabilities: any[] = [];
    const equity: any[] = [];

    // 2. Calculate Closing Balance
    for (const ledger of ledgers) {
        const bal = await getLedgerBalance(ledger.id, asOfDate);
        if (bal.balance === 0) continue;

        const item = {
            id: ledger.id,
            name: ledger.name,
            amount: bal.balance,
            groupName: ledger.group.name
        };

        if (ledger.group.type === 'ASSET') assets.push(item);
        else if (ledger.group.type === 'LIABILITY') liabilities.push(item);
        else equity.push(item);
    }

    // 3. Calculate Net Profit/Loss to date (Retained Earnings)
    // This is needed to balance the sheet (Assets = Liabilities + Equity + NetProfit)
    // In a real system, Net Profit is transferred to Retained Earnings account at year end.
    // For simple reporting, we calculate dynamic P&L since the beginning of time (or last close).

    // Simplification: Calculate P&L for all time up to asOfDate
    const pl = await getProfitAndLoss(companyId, new Date(0), asOfDate);
    const retainedEarnings = pl.totals.netProfit;

    if (retainedEarnings !== 0) {
        equity.push({
            id: 'net-profit',
            name: 'Net Profit / Loss (Current Period)',
            amount: retainedEarnings,
            groupName: 'Reserves & Surplus'
        });
    }

    const totalAssets = assets.reduce((sum, i) => sum + i.amount, 0);
    const totalLiabilities = liabilities.reduce((sum, i) => sum + i.amount, 0);
    const totalEquity = equity.reduce((sum, i) => sum + i.amount, 0);

    return {
        assets,
        liabilities,
        equity,
        totals: {
            totalAssets,
            totalLiabilities,
            totalEquity,
            totalLiabilitiesAndEquity: totalLiabilities + totalEquity
        }
    };
}

// ==================== HELPER: GET NEXT VOUCHER NUMBER ====================

export async function getNextVoucherNumber(companyId: string, type: VoucherType): Promise<string> {
    const prefix = type.slice(0, 3).toUpperCase(); // SAL, PUR, PAY, REC, CON, JOU
    const count = await prisma.voucher.count({
        where: { companyId, type }
    });
    return `${prefix}-${(count + 1).toString().padStart(5, '0')}`;
}

// ==================== HELPER: GET OR CREATE PARTY LEDGER ====================

export async function getOrCreatePartyLedger(companyId: string, partyId: string, tx: any = prisma): Promise<string> {
    // Check if ledger exists for this party
    let ledger = await tx.ledger.findFirst({
        where: { companyId, partyId }
    });

    if (ledger) return ledger.id;

    // Get party details
    const party = await tx.party.findUnique({ where: { id: partyId } });
    if (!party) throw new Error('Party not found');

    // Find the appropriate group (Sundry Debtors for Customer, Sundry Creditors for Supplier)
    const groupCode = party.type === 'CUSTOMER' ? 'SUNDRY_DEBTORS' : 'SUNDRY_CREDITORS';
    const group = await tx.ledgerGroup.findFirst({
        where: { companyId, code: groupCode }
    });

    if (!group) throw new Error(`Ledger group ${groupCode} not found. Run seedDefaultLedgerGroups first.`);

    // Create ledger for party
    ledger = await tx.ledger.create({
        data: {
            name: party.name,
            code: `PARTY_${partyId.slice(0, 8).toUpperCase()}`,
            groupId: group.id,
            partyId,
            companyId,
            openingBalance: party.openingBalance || 0,
            openingType: party.type === 'CUSTOMER' ? 'DEBIT' : 'CREDIT'
        }
    });

    return ledger.id;
}

// ==================== HELPER: GET SYSTEM LEDGER BY CODE ====================

export async function getSystemLedgerByCode(companyId: string, code: string, tx: any = prisma): Promise<string> {
    const ledger = await tx.ledger.findFirst({
        where: { companyId, code }
    });
    if (!ledger) throw new Error(`System ledger ${code} not found. Run seedDefaultLedgerGroups first.`);
    return ledger.id;
}

// ==================== B5: UPDATE VOUCHER STATUS ====================

export async function updateVoucherStatus(voucherId: string, status: VoucherStatus): Promise<void> {
    await prisma.voucher.update({
        where: { id: voucherId },
        data: { status }
    });
}

// ==================== FINANCIAL PERIOD OPERATIONS ====================

export async function createFinancialPeriod(data: {
    financialYearId: string;
    name: string;
    startDate: Date;
    endDate: Date;
    isLocked?: boolean;
    companyId: string;
}) {
    // Validate dates within FY range
    const fy = await prisma.financialYear.findUnique({ where: { id: data.financialYearId, companyId: data.companyId } });
    if (!fy) throw new Error('Financial Year not found');

    if (data.startDate < fy.startDate || data.endDate > fy.endDate) {
        throw new Error('Period dates must be within Financial Year range');
    }

    return prisma.financialPeriod.create({
        data: {
            financialYearId: data.financialYearId,
            name: data.name,
            startDate: data.startDate,
            endDate: data.endDate,
            isLocked: data.isLocked || false,
            companyId: data.companyId
        }
    });
}

export async function lockFinancialPeriod(periodId: string, isLocked: boolean = true) {
    return prisma.financialPeriod.update({
        where: { id: periodId },
        data: { isLocked }
    });
}

/**
 * Automatically generate quarterly periods for a Financial Year
 */
export async function autoGeneratePeriods(financialYearId: string, companyId: string) {
    const fy = await prisma.financialYear.findUnique({ where: { id: financialYearId, companyId } });
    if (!fy) throw new Error('Financial Year not found');

    const periods = [];
    let currentStart = new Date(fy.startDate);
    const fyEnd = new Date(fy.endDate);
    let quarterCount = 1;

    while (currentStart < fyEnd) {
        const currentEnd = new Date(currentStart);
        currentEnd.setMonth(currentEnd.getMonth() + 3);
        currentEnd.setDate(currentEnd.getDate() - 1); // End of previous day

        // Capp to FY end if needed
        const actualEnd = currentEnd > fyEnd ? fyEnd : currentEnd;

        periods.push({
            name: `Q${quarterCount} (${currentStart.toLocaleDateString('en-GB')})`,
            startDate: new Date(currentStart),
            endDate: new Date(actualEnd)
        });

        // Next iteration
        currentStart = new Date(actualEnd);
        currentStart.setDate(currentStart.getDate() + 1);
        quarterCount++;
    }

    return periods;
}

// ==================== LEDGER-DRIVEN REPORTING HELPERS ====================

/**
 * Get all postings for a specific Ledger Group (Recursive)
 * Used for aggregating data across a hierarchy (e.g., all "Sundry Debtors")
 */
export async function getPostingsByGroup(
    companyId: string,
    groupCode: string,
    startDate?: Date,
    endDate?: Date
) {
    // 1. Find the parent group
    const parentGroup = await prisma.ledgerGroup.findFirst({
        where: { companyId, code: groupCode },
        include: {
            ledgers: { select: { id: true } },
            children: {
                include: {
                    ledgers: { select: { id: true } }
                }
            }
        }
    });

    if (!parentGroup) return [];

    // 2. Collect all Ledger IDs in this hierarchy
    let ledgerIds: string[] = parentGroup.ledgers.map(l => l.id);

    // Helper to traverse children recursively
    const collectLedgerIds = async (groupId: string) => {
        const group = await prisma.ledgerGroup.findUnique({
            where: { id: groupId },
            include: {
                ledgers: { select: { id: true } },
                children: { select: { id: true } }
            }
        });
        if (group) {
            ledgerIds.push(...group.ledgers.map(l => l.id));
            const childPromises = group.children.map(c => collectLedgerIds(c.id));
            await Promise.all(childPromises); // Parallelize for speed
        }
    };

    // Note: The first level children were already fetched, but let's just recurse safely if we needed deep trees.
    // For simplicity, we'll assume a relatively flat structure or do a proper recursive fetch if needed.
    // Re-implementing strictly:
    ledgerIds = []; // Reset
    await collectLedgerIds(parentGroup.id);

    // 3. Fetch Postings
    const where: any = {
        ledgerId: { in: ledgerIds },
        companyId
    };

    if (startDate || endDate) {
        where.voucher = {};
        if (startDate) where.voucher.date = { ...where.voucher.date, gte: startDate };
        if (endDate) where.voucher.date = { ...where.voucher.date, lte: endDate };
    }

    return prisma.ledgerPosting.findMany({
        where,
        include: {
            voucher: true,
            ledger: {
                include: { group: true }
            }
        },
        orderBy: { createdAt: 'asc' }
    });
}

/**
 * Get Net Tax Liability from Ledgers
 * Summarizes Output Tax (Liability) - Input Tax (Asset)
 */
export async function getTaxLiability(companyId: string, startDate: Date, endDate: Date) {
    // 1. Calc Output Liability (Duties & Taxes)
    // Code: DUTIES_TAXES is the group.
    // We want specifically GST payables usually.
    const outputPostings = await getPostingsByGroup(companyId, 'DUTIES_TAXES', startDate, endDate);

    // 2. Calc Input Credit (Tax Receivables)
    // Code: TAX_RECEIVABLES
    const inputPostings = await getPostingsByGroup(companyId, 'TAX_RECEIVABLES', startDate, endDate);

    // Helper to sum
    const sumBalance = (postings: any[]) => {
        let balance = 0;
        for (const p of postings) {
            // Liability/Income (Credit nature): Credit (+), Debit (-)
            // Asset/Expense (Debit nature): Debit (+), Credit (-)

            // Note: This function doesn't know the nature per ledger easily without looking it up.
            // But we know:
            // DUTIES_TAXES = Liability => Credit is increase.
            // TAX_RECEIVABLES = Asset => Debit is increase.

            // However, getPostingsByGroup returns postings from mixed ledgers potentially. 
            // Ideally we calculate per ledger based on its nature.
            // Simpler approach:

            // For Liability Group: Net Credit Balance
            if (p.type === 'CREDIT') balance += Number(p.amount);
            else balance -= Number(p.amount);
        }
        return balance;
    };

    const sumAssetBalance = (postings: any[]) => {
        let balance = 0;
        for (const p of postings) {
            // For Asset Group: Net Debit Balance
            if (p.type === 'DEBIT') balance += Number(p.amount);
            else balance -= Number(p.amount);
        }
        return balance;
    };

    const totalOutputLiability = sumBalance(outputPostings);
    const totalInputCredit = sumAssetBalance(inputPostings);

    return {
        outputTax: totalOutputLiability,
        inputTax: totalInputCredit,
        netPayable: Math.max(0, totalOutputLiability - totalInputCredit)
    };
}

/**
 * Get Open Items for Ageing Analysis
 * Groups postings by Reference ID (e.g., Invoice ID) to find unpaid bills.
 */
export async function getOpenItems(
    companyId: string,
    groupCode: string, // SUNDRY_DEBTORS or SUNDRY_CREDITORS
    asOfDate: Date
) {
    const postings = await getPostingsByGroup(companyId, groupCode, undefined, asOfDate);

    // Map: ReferenceID -> { amount, postings, ... }
    const itemMap = new Map<string, {
        referenceId: string;
        referenceType: string | null;
        totalAmount: number; // Positive = Outstanding (Debit for Debtors, Credit for Creditors)
        ledgerId: string;
        date: Date; // Oldest date (document date)
        postings: any[];
    }>();

    // Map: LedgerID -> Unallocated Amount (On Account)
    const unallocatedMap = new Map<string, number>();

    for (const p of postings) {
        const refId = p.voucher.referenceId;
        const groupType = p.ledger.group?.type || (groupCode === 'SUNDRY_DEBTORS' ? 'ASSET' : 'LIABILITY'); // Fallback if missing

        const isDebtor = groupCode === 'SUNDRY_DEBTORS';

        // Calculate impact on "Outstanding Balance"
        // For Debtor (Asset): Debit increases outstanding (+), Credit decreases (-)
        // For Creditor (Liability): Credit increases outstanding (+), Debit decreases (-)
        let impact = 0;
        if (isDebtor) {
            impact = p.type === 'DEBIT' ? Number(p.amount) : -Number(p.amount);
        } else {
            impact = p.type === 'CREDIT' ? Number(p.amount) : -Number(p.amount);
        }

        if (refId) {
            // Link to specific document
            if (!itemMap.has(refId)) {
                itemMap.set(refId, {
                    referenceId: refId,
                    referenceType: p.voucher.referenceType,
                    totalAmount: 0,
                    ledgerId: p.ledgerId,
                    date: p.voucher.date,
                    postings: []
                });
            }
            const item = itemMap.get(refId)!;
            item.totalAmount += impact;
            item.postings.push(p);
            // Keep oldest date as anchor
            if (new Date(p.voucher.date) < new Date(item.date)) {
                item.date = p.voucher.date;
            }
        } else {
            // Unallocated / On Account
            const current = unallocatedMap.get(p.ledgerId) || 0;
            unallocatedMap.set(p.ledgerId, current + impact);
        }
    }

    // Filter closed items (floating point safe)
    const openItems = Array.from(itemMap.values()).filter(i => Math.abs(i.totalAmount) > 0.01);

    return {
        openItems,
        unallocated: unallocatedMap
    };
}

export default {
    seedDefaultLedgerGroups,
    getLedgerGroups,
    createLedgerGroup,
    getLedgers,
    getLedger,
    createLedger,
    getLedgerBalance,
    createVoucher,
    getVouchers,
    getVoucher,
    getTrialBalance,
    getProfitAndLoss,
    getBalanceSheet,
    getNextVoucherNumber,
    getOrCreatePartyLedger,
    getSystemLedgerByCode,
    updateVoucherStatus,
    createFinancialPeriod,
    lockFinancialPeriod,
    autoGeneratePeriods,
    updateLedger
};


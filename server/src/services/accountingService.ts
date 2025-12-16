/**
 * Accounting Service
 * Core service for Chart of Accounts, Vouchers, and Ledger Postings
 */

import { PrismaClient, AccountType, VoucherType, PostingType, Prisma } from '@prisma/client';

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
}

export async function createVoucher(data: {
    voucherNumber: string;
    date: Date;
    type: VoucherType;
    referenceType?: string;
    referenceId?: string;
    narration?: string;
    companyId: string;
    createdById?: string;
    postings: PostingInput[];
}) {
    // Validate: Debits must equal Credits
    const totalDebit = data.postings
        .filter(p => p.type === 'DEBIT')
        .reduce((sum, p) => sum + p.amount, 0);
    const totalCredit = data.postings
        .filter(p => p.type === 'CREDIT')
        .reduce((sum, p) => sum + p.amount, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
        throw new Error(`Voucher not balanced: Debit (${totalDebit}) != Credit (${totalCredit})`);
    }

    return prisma.voucher.create({
        data: {
            voucherNumber: data.voucherNumber,
            date: data.date,
            type: data.type,
            referenceType: data.referenceType,
            referenceId: data.referenceId,
            narration: data.narration,
            companyId: data.companyId,
            createdById: data.createdById,
            postings: {
                create: data.postings.map(p => ({
                    ledgerId: p.ledgerId,
                    amount: p.amount,
                    type: p.type,
                    narration: p.narration,
                    companyId: data.companyId
                }))
            }
        },
        include: {
            postings: { include: { ledger: true } }
        }
    });
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

    return { entries: result, totals };
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

export async function getOrCreatePartyLedger(companyId: string, partyId: string): Promise<string> {
    // Check if ledger exists for this party
    let ledger = await prisma.ledger.findFirst({
        where: { companyId, partyId }
    });

    if (ledger) return ledger.id;

    // Get party details
    const party = await prisma.party.findUnique({ where: { id: partyId } });
    if (!party) throw new Error('Party not found');

    // Find the appropriate group (Sundry Debtors for Customer, Sundry Creditors for Supplier)
    const groupCode = party.type === 'CUSTOMER' ? 'SUNDRY_DEBTORS' : 'SUNDRY_CREDITORS';
    const group = await prisma.ledgerGroup.findFirst({
        where: { companyId, code: groupCode }
    });

    if (!group) throw new Error(`Ledger group ${groupCode} not found. Run seedDefaultLedgerGroups first.`);

    // Create ledger for party
    ledger = await prisma.ledger.create({
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

export async function getSystemLedgerByCode(companyId: string, code: string): Promise<string> {
    const ledger = await prisma.ledger.findFirst({
        where: { companyId, code }
    });
    if (!ledger) throw new Error(`System ledger ${code} not found. Run seedDefaultLedgerGroups first.`);
    return ledger.id;
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
    getNextVoucherNumber,
    getOrCreatePartyLedger,
    getSystemLedgerByCode
};

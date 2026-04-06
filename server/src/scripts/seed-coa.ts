import { PrismaClient } from '@prisma/client';
import logger from '../config/logger';

const prisma = new PrismaClient();

// Default Chart of Accounts structure
const DEFAULT_GROUPS = [
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
                        name: 'Cash & Bank', code: 'CASH_BANK', type: 'ASSET', ledgers: [
                            { name: 'Cash in Hand', code: 'CASH', isSystem: true },
                        ]
                    },
                    { name: 'Sundry Debtors', code: 'SUNDRY_DEBTORS', type: 'ASSET', ledgers: [] },
                    {
                        name: 'Inventory', code: 'INVENTORY', type: 'ASSET', ledgers: [
                            { name: 'Stock in Hand', code: 'STOCK', isSystem: true },
                        ]
                    },
                ],
            },
            {
                name: 'Fixed Assets',
                code: 'FIXED_ASSETS',
                type: 'ASSET',
                ledgers: [
                    { name: 'Furniture & Fixtures', code: 'FURNITURE', isSystem: true },
                    { name: 'Office Equipment', code: 'EQUIPMENT', isSystem: true },
                ],
            },
        ],
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
                    { name: 'Sundry Creditors', code: 'SUNDRY_CREDITORS', type: 'LIABILITY', ledgers: [] },
                    {
                        name: 'Duties & Taxes', code: 'DUTIES_TAXES', type: 'LIABILITY', ledgers: [
                            { name: 'GST Payable', code: 'GST_PAYABLE', isSystem: true },
                            { name: 'TDS Payable', code: 'TDS_PAYABLE', isSystem: true },
                        ]
                    },
                ],
            },
        ],
    },
    {
        name: 'Capital & Equity',
        code: 'CAPITAL',
        type: 'EQUITY',
        ledgers: [
            { name: "Owner's Capital", code: 'OWNER_CAPITAL', isSystem: true },
            { name: 'Retained Earnings', code: 'RETAINED_EARNINGS', isSystem: true },
        ],
    },
    {
        name: 'Income',
        code: 'INCOME',
        type: 'INCOME',
        ledgers: [
            { name: 'Sales Account', code: 'SALES', isSystem: true },
            { name: 'Sales (Goods)', code: 'SALES_GOODS', isSystem: true },
            { name: 'Service Income', code: 'SERVICE_INCOME', isSystem: true },
            { name: 'Other Income', code: 'OTHER_INCOME', isSystem: true },
            { name: 'Discount Received', code: 'DISCOUNT_RECEIVED', isSystem: true },
        ],
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
                    { name: 'Purchase Account', code: 'PURCHASE', isSystem: true },
                    { name: 'Purchase (Goods)', code: 'PURCHASE_GOODS', isSystem: true },
                    { name: 'Freight Inward', code: 'FREIGHT_IN', isSystem: true },
                ],
            },
            {
                name: 'Indirect Expenses',
                code: 'INDIRECT_EXPENSES',
                type: 'EXPENSE',
                ledgers: [
                    { name: 'Salary & Wages', code: 'SALARY', isSystem: true },
                    { name: 'Rent', code: 'RENT', isSystem: true },
                    { name: 'Utilities', code: 'UTILITIES', isSystem: true },
                    { name: 'Office Expenses', code: 'OFFICE_EXPENSES', isSystem: true },
                    { name: 'Discount Given', code: 'DISCOUNT_GIVEN', isSystem: true },
                    { name: 'Round Off', code: 'ROUND_OFF', isSystem: true },
                ],
            },
        ],
    },
];

async function createGroupsRecursively(companyId: string, groups: any[], parentId: string | null = null) {
    for (const group of groups) {
        // Create the group
        const createdGroup = await prisma.ledgerGroup.create({
            data: {
                name: group.name,
                code: group.code,
                type: group.type,
                parentId: parentId,
                companyId,
            },
        });
        logger.info(`  Created group: ${group.name}`);

        // Create ledgers for this group
        if (group.ledgers && group.ledgers.length > 0) {
            for (const ledger of group.ledgers) {
                await prisma.ledger.create({
                    data: {
                        name: ledger.name,
                        code: ledger.code,
                        groupId: createdGroup.id,
                        isSystemLedger: ledger.isSystem || false,
                        openingBalance: 0,
                        openingType: 'DEBIT',
                        companyId,
                    },
                });
                logger.info(`    Created ledger: ${ledger.name} (${ledger.code})`);
            }
        }

        // Recursively create children
        if (group.children && group.children.length > 0) {
            await createGroupsRecursively(companyId, group.children, createdGroup.id);
        }
    }
}

async function seedChartOfAccounts() {
    try {
        logger.info('--- Seeding Chart of Accounts ---');

        // Get all companies
        const companies = await prisma.company.findMany({
            select: { id: true, businessName: true }
        });

        for (const company of companies) {
            // Check if already has ledger groups
            const existingGroups = await prisma.ledgerGroup.count({
                where: { companyId: company.id }
            });

            if (existingGroups > 0) {
                logger.info(`✓ ${company.businessName} already has ${existingGroups} ledger groups`);
                continue;
            }

            logger.info(`\nSeeding COA for ${company.businessName}...`);
            await createGroupsRecursively(company.id, DEFAULT_GROUPS);
            logger.info(`✅ Done for ${company.businessName}`);
        }

        logger.info('\n✅ Chart of Accounts seeding complete!');

    } catch (error: any) {
        logger.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

seedChartOfAccounts();

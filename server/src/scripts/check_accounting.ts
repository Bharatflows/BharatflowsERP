import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAccountingData() {
    try {
        const ledgerCount = await prisma.ledger.count();
        const voucherCount = await prisma.voucher.count();
        const ledgerGroupCount = await prisma.ledgerGroup.count();

        console.log('=== Accounting Data Check ===');
        console.log(`Ledger Groups: ${ledgerGroupCount}`);
        console.log(`Ledgers: ${ledgerCount}`);
        console.log(`Vouchers: ${voucherCount}`);

        if (ledgerCount === 0) {
            console.log('\n⚠️ No ledgers found! Chart of Accounts needs to be seeded.');
            console.log('Run: POST /api/v1/accounting/seed-defaults');
        }

        // Check for pending expenses
        const pendingExpenses = await prisma.expense.count({
            where: { status: 'PENDING' }
        });
        console.log(`\nPending Expenses: ${pendingExpenses}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkAccountingData();

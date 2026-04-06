const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAccountingData() {
    try {
        console.log('--- Checking Accounting Data ---');

        // Get company
        const company = await prisma.company.findFirst();
        if (!company) {
            console.log('No company found!');
            return;
        }
        console.log(`Company: ${company.businessName} (${company.id})`);

        // Check Ledger Groups
        const groups = await prisma.ledgerGroup.count({ where: { companyId: company.id } });
        console.log(`\nLedger Groups: ${groups}`);

        // Check Ledgers
        const ledgers = await prisma.ledger.findMany({
            where: { companyId: company.id },
            select: { id: true, name: true, code: true, isSystemLedger: true },
            take: 20
        });
        console.log(`Ledgers: ${ledgers.length}`);
        ledgers.forEach(l => console.log(`  - ${l.code || 'N/A'}: ${l.name} ${l.isSystemLedger ? '(SYSTEM)' : ''}`));

        // Check Vouchers
        const vouchers = await prisma.voucher.findMany({
            where: { companyId: company.id },
            select: { id: true, voucherNumber: true, type: true, totalAmount: true }
        });
        console.log(`\nVouchers: ${vouchers.length}`);
        vouchers.forEach(v => console.log(`  - ${v.voucherNumber}: ${v.type} - ₹${v.totalAmount}`));

        // Check Invoices
        const invoices = await prisma.invoice.findMany({
            where: { companyId: company.id },
            select: { id: true, invoiceNumber: true, totalAmount: true, status: true }
        });
        console.log(`\nInvoices: ${invoices.length}`);
        invoices.forEach(inv => console.log(`  - ${inv.invoiceNumber}: ₹${inv.totalAmount} (${inv.status})`));

        // Check Domain Events
        const events = await prisma.domainEvent.findMany({
            where: { companyId: company.id },
            select: { eventType: true, aggregateId: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 10
        });
        console.log(`\nRecent Domain Events: ${events.length}`);
        events.forEach(e => console.log(`  - ${e.eventType}: ${e.aggregateId}`));

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkAccountingData();


import { PrismaClient } from '@prisma/client';
import accountingService from '../services/accountingService';
import postingService from '../services/postingService';

const prisma = new PrismaClient();

async function fixAccountingEntries() {
    console.log('Starting Accounting Fix...');

    try {
        // 1. Get all companies
        const companies = await prisma.company.findMany();
        console.log(`Found ${companies.length} companies.`);

        for (const company of companies) {
            console.log(`Processing Company: ${company.businessName} (${company.id})`);

            // 2. Seed Default Ledgers
            console.log('  Seeding default ledger groups...');
            await accountingService.seedDefaultLedgerGroups(company.id);
            console.log('  ✅ Default ledgers seeded/verified.');

            // 3. Find Invoices without Vouchers
            console.log('  Checking for missing invoice vouchers...');
            const invoices = await prisma.invoice.findMany({
                where: { companyId: company.id },
                include: { items: true, customer: true }
            });

            console.log(`  Found ${invoices.length} total invoices.`);

            let fixedCount = 0;

            for (const invoice of invoices) {
                // Check if voucher exists
                const voucher = await prisma.voucher.findFirst({
                    where: {
                        companyId: company.id,
                        referenceId: invoice.id,
                        referenceType: 'INVOICE'
                    }
                });

                if (!voucher) {
                    console.log(`    ⚠️ Missing voucher for Invoice ${invoice.invoiceNumber}. Posting now...`);
                    try {
                        await postingService.postSalesInvoice({
                            id: invoice.id,
                            invoiceNumber: invoice.invoiceNumber,
                            invoiceDate: invoice.invoiceDate,
                            customerId: invoice.customerId,
                            subtotal: Number(invoice.subtotal),
                            totalTax: Number(invoice.totalTax),
                            totalAmount: Number(invoice.totalAmount),
                            discountAmount: Number(invoice.discountAmount),
                            roundOff: Number(invoice.roundOff),
                            companyId: company.id
                        });
                        console.log(`    ✅ Posted Invoice ${invoice.invoiceNumber}`);
                        fixedCount++;
                    } catch (err: any) {
                        console.error(`    ❌ Failed to post Invoice ${invoice.invoiceNumber}:`, err.message);
                    }
                }
            }

            console.log(`  Fixed ${fixedCount} invoices for company ${company.businessName}.`);
        }

        console.log('Accounting Fix Completed Successfully.');
    } catch (error) {
        console.error('Critical Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixAccountingEntries();

/**
 * Migration Script: Retroactively Post Existing Transactions to Accounting Ledger
 * 
 * This script:
 * 1. Ensures the Chart of Accounts is seeded for each company
 * 2. Finds all existing invoices and purchase bills that don't have vouchers
 * 3. Creates the appropriate ledger postings for each
 * 
 * Run with: npx ts-node src/scripts/migrate-accounting-entries.ts
 */

import { PrismaClient } from '@prisma/client';
import accountingService from '../services/accountingService';
import postingService from '../services/postingService';

const prisma = new PrismaClient();

interface MigrationStats {
    companiesProcessed: number;
    invoicesPosted: number;
    invoicesSkipped: number;
    invoicesFailed: number;
    billsPosted: number;
    billsSkipped: number;
    billsFailed: number;
}

async function migrateAccountingEntries(): Promise<void> {
    console.log('='.repeat(60));
    console.log('Accounting Migration Script');
    console.log('Retroactively posting existing transactions to ledger');
    console.log('='.repeat(60));
    console.log('');

    const stats: MigrationStats = {
        companiesProcessed: 0,
        invoicesPosted: 0,
        invoicesSkipped: 0,
        invoicesFailed: 0,
        billsPosted: 0,
        billsSkipped: 0,
        billsFailed: 0
    };

    try {
        // Get all companies
        const companies = await prisma.company.findMany({
            select: { id: true, businessName: true }
        });

        console.log(`Found ${companies.length} companies to process\n`);

        for (const company of companies) {
            console.log(`\n${'─'.repeat(50)}`);
            console.log(`Processing: ${company.businessName} (${company.id})`);
            console.log('─'.repeat(50));

            // Step 1: Ensure Chart of Accounts is seeded
            console.log('  [1/3] Seeding Chart of Accounts...');
            try {
                await accountingService.seedDefaultLedgerGroups(company.id);
                console.log('        ✓ Chart of Accounts ready');
            } catch (error: any) {
                console.log(`        ✓ Chart of Accounts already exists or updated`);
            }

            // Step 2: Get existing voucher reference IDs to skip duplicates
            const existingVouchers = await prisma.voucher.findMany({
                where: { companyId: company.id },
                select: { referenceId: true, referenceType: true }
            });

            const postedInvoiceIds = new Set(
                existingVouchers
                    .filter(v => v.referenceType === 'INVOICE')
                    .map(v => v.referenceId)
                    .filter((id): id is string => id !== null)
            );

            const postedBillIds = new Set(
                existingVouchers
                    .filter(v => v.referenceType === 'BILL')
                    .map(v => v.referenceId)
                    .filter((id): id is string => id !== null)
            );

            // Step 3: Process Invoices
            console.log('  [2/3] Processing Sales Invoices...');
            const invoices = await prisma.invoice.findMany({
                where: { companyId: company.id },
                select: {
                    id: true,
                    invoiceNumber: true,
                    invoiceDate: true,
                    customerId: true,
                    subtotal: true,
                    totalTax: true,
                    totalAmount: true,
                    discountAmount: true,
                    roundOff: true
                }
            });

            let invoiceCount = 0;
            for (const invoice of invoices) {
                if (postedInvoiceIds.has(invoice.id)) {
                    stats.invoicesSkipped++;
                    continue;
                }

                try {
                    await postingService.postSalesInvoice({
                        id: invoice.id,
                        invoiceNumber: invoice.invoiceNumber,
                        invoiceDate: invoice.invoiceDate,
                        customerId: invoice.customerId,
                        subtotal: Number(invoice.subtotal),
                        totalTax: Number(invoice.totalTax),
                        totalAmount: Number(invoice.totalAmount),
                        discountAmount: Number(invoice.discountAmount || 0),
                        roundOff: Number(invoice.roundOff || 0),
                        companyId: company.id
                    });
                    stats.invoicesPosted++;
                    invoiceCount++;
                } catch (error: any) {
                    console.log(`        ✗ Failed: ${invoice.invoiceNumber} - ${error.message}`);
                    stats.invoicesFailed++;
                }
            }
            console.log(`        ✓ Posted ${invoiceCount} invoices (${stats.invoicesSkipped} already existed)`);

            // Step 4: Process Purchase Bills
            console.log('  [3/3] Processing Purchase Bills...');
            const bills = await prisma.purchaseBill.findMany({
                where: { companyId: company.id },
                select: {
                    id: true,
                    billNumber: true,
                    billDate: true,
                    supplierId: true,
                    subtotal: true,
                    totalTax: true,
                    totalAmount: true
                }
            });

            let billCount = 0;
            for (const bill of bills) {
                if (postedBillIds.has(bill.id)) {
                    stats.billsSkipped++;
                    continue;
                }

                try {
                    await postingService.postPurchaseBill({
                        id: bill.id,
                        billNumber: bill.billNumber,
                        billDate: bill.billDate,
                        supplierId: bill.supplierId,
                        subtotal: Number(bill.subtotal),
                        taxAmount: Number(bill.totalTax),
                        totalAmount: Number(bill.totalAmount),
                        companyId: company.id
                    });
                    stats.billsPosted++;
                    billCount++;
                } catch (error: any) {
                    console.log(`        ✗ Failed: ${bill.billNumber} - ${error.message}`);
                    stats.billsFailed++;
                }
            }
            console.log(`        ✓ Posted ${billCount} bills (${stats.billsSkipped} already existed)`);

            stats.companiesProcessed++;
        }

        // Print summary
        console.log('\n' + '='.repeat(60));
        console.log('MIGRATION COMPLETE');
        console.log('='.repeat(60));
        console.log(`Companies processed:    ${stats.companiesProcessed}`);
        console.log(`Invoices posted:        ${stats.invoicesPosted}`);
        console.log(`Invoices skipped:       ${stats.invoicesSkipped}`);
        console.log(`Invoices failed:        ${stats.invoicesFailed}`);
        console.log(`Bills posted:           ${stats.billsPosted}`);
        console.log(`Bills skipped:          ${stats.billsSkipped}`);
        console.log(`Bills failed:           ${stats.billsFailed}`);
        console.log('='.repeat(60));

    } catch (error) {
        console.error('\n❌ Migration failed with error:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the migration
migrateAccountingEntries()
    .then(() => {
        console.log('\n✅ Migration script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Migration script failed:', error);
        process.exit(1);
    });

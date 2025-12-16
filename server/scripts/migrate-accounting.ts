/**
 * Migration Script: Create Ledger Postings for Existing Transactions
 * 
 * This script:
 * 1. Seeds default ledger groups if not present
 * 2. Creates ledger postings for all existing invoices
 * 3. Creates ledger postings for all existing purchase bills
 * 4. Creates ledger postings for all existing expenses
 * 
 * Run with: npx ts-node server/scripts/migrate-accounting.ts
 */

import { PrismaClient } from '@prisma/client';
import accountingService from '../src/services/accountingService';
import postingService from '../src/services/postingService';

const prisma = new PrismaClient();

async function migrateAccounting() {
    console.log('🚀 Starting Accounting Migration...\n');

    // Get all companies
    const companies = await prisma.company.findMany();
    console.log(`Found ${companies.length} companies to migrate\n`);

    for (const company of companies) {
        console.log(`\n📦 Migrating Company: ${company.businessName} (${company.id})`);

        try {
            // Step 1: Seed default ledger groups
            console.log('  ├─ Seeding default ledger groups...');
            await accountingService.seedDefaultLedgerGroups(company.id);
            console.log('  ├─ ✅ Ledger groups seeded');

            // Step 2: Migrate Invoices
            const invoices = await prisma.invoice.findMany({
                where: { companyId: company.id },
                include: { customer: true }
            });
            console.log(`  ├─ Found ${invoices.length} invoices to migrate`);

            let invoicesMigrated = 0;
            for (const invoice of invoices) {
                try {
                    // Check if already posted
                    const existingVoucher = await prisma.voucher.findFirst({
                        where: { referenceType: 'INVOICE', referenceId: invoice.id, companyId: company.id }
                    });

                    if (!existingVoucher) {
                        await postingService.postSalesInvoice({
                            id: invoice.id,
                            invoiceNumber: invoice.invoiceNumber,
                            invoiceDate: invoice.invoiceDate,
                            customerId: invoice.customerId,
                            subtotal: Number(invoice.subtotal),
                            totalTax: Number(invoice.totalTax),
                            totalAmount: Number(invoice.totalAmount),
                            companyId: company.id
                        });
                        invoicesMigrated++;
                    }
                } catch (err: any) {
                    console.log(`  │   ⚠️ Failed to migrate invoice ${invoice.invoiceNumber}: ${err.message}`);
                }
            }
            console.log(`  ├─ ✅ Migrated ${invoicesMigrated} invoices`);

            // Step 3: Migrate Purchase Bills
            const bills = await prisma.purchaseBill.findMany({
                where: { companyId: company.id },
                include: { supplier: true }
            });
            console.log(`  ├─ Found ${bills.length} purchase bills to migrate`);

            let billsMigrated = 0;
            for (const bill of bills) {
                try {
                    const existingVoucher = await prisma.voucher.findFirst({
                        where: { referenceType: 'BILL', referenceId: bill.id, companyId: company.id }
                    });

                    if (!existingVoucher) {
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
                        billsMigrated++;
                    }
                } catch (err: any) {
                    console.log(`  │   ⚠️ Failed to migrate bill ${bill.billNumber}: ${err.message}`);
                }
            }
            console.log(`  ├─ ✅ Migrated ${billsMigrated} purchase bills`);

            // Step 4: Migrate Expenses
            const expenses = await prisma.expense.findMany({
                where: { companyId: company.id }
            });
            console.log(`  ├─ Found ${expenses.length} expenses to migrate`);

            let expensesMigrated = 0;
            for (const expense of expenses) {
                try {
                    const existingVoucher = await prisma.voucher.findFirst({
                        where: { referenceType: 'EXPENSE', referenceId: expense.id, companyId: company.id }
                    });

                    if (!existingVoucher) {
                        await postingService.postExpense({
                            id: expense.id,
                            description: expense.description || 'Expense',
                            date: expense.date,
                            amount: Number(expense.amount),
                            category: expense.category,
                            paymentMode: expense.paymentMethod || 'CASH',
                            bankAccountId: undefined,
                            companyId: company.id
                        });
                        expensesMigrated++;
                    }
                } catch (err: any) {
                    console.log(`  │   ⚠️ Failed to migrate expense ${expense.id}: ${err.message}`);
                }
            }
            console.log(`  └─ ✅ Migrated ${expensesMigrated} expenses`);

            console.log(`  └─ ✅ Company migration complete!`);

        } catch (error: any) {
            console.error(`  └─ ❌ Error migrating company: ${error.message}`);
        }
    }

    console.log('\n\n✅ Migration Complete!');

    // Print summary
    const totalVouchers = await prisma.voucher.count();
    const totalPostings = await prisma.ledgerPosting.count();
    console.log(`\n📊 Summary:`);
    console.log(`   Total Vouchers Created: ${totalVouchers}`);
    console.log(`   Total Ledger Postings: ${totalPostings}`);
}

migrateAccounting()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error('Migration failed:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());

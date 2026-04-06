/// <reference types="node" />
import { PrismaClient } from '@prisma/client';
import { VoucherType, PostingType, VoucherStatus } from './types/enums';
import { getProfitAndLoss, getBalanceSheet, createLedger, createVoucher } from './services/accountingService';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Starting Financial Reports Verification ---');

    const company = await prisma.company.findFirst();
    if (!company) {
        console.error('No company found. Run setup first.');
        return;
    }
    const companyId = company.id;

    // 1. Setup Data for Testing
    console.log('1. Setting up test data...');

    // Create Ledgers if not exist
    let salesGroup = await prisma.ledgerGroup.findFirst({ where: { companyId, name: 'Sales Accounts' } });
    if (!salesGroup) {
        console.log('Creating Sales Accounts group...');
        salesGroup = await prisma.ledgerGroup.create({
            data: { companyId, name: 'Sales Accounts', code: 'SALES_ACCOUNTS_TEST', type: 'INCOME' }
        });
    }

    let purchaseGroup = await prisma.ledgerGroup.findFirst({ where: { companyId, name: 'Direct Expenses' } });
    if (!purchaseGroup) {
        console.log('Creating Direct Expenses group...');
        purchaseGroup = await prisma.ledgerGroup.create({
            data: { companyId, name: 'Direct Expenses', code: 'DIRECT_EXPENSES_TEST', type: 'EXPENSE' }
        });
    }

    let cashGroup = await prisma.ledgerGroup.findFirst({ where: { companyId, name: 'Cash in Hand' } });
    if (!cashGroup) {
        console.log('Creating Cash in Hand group...');
        cashGroup = await prisma.ledgerGroup.create({
            data: { companyId, name: 'Cash in Hand', code: 'CASH_IN_HAND_TEST', type: 'ASSET' }
        });
    }

    const salesLedger = await createLedger({
        name: 'Test Sales Ledger ' + Date.now(),
        code: 'TEST-SALES-' + Date.now(),
        groupId: salesGroup.id,
        companyId
    });

    const purchaseLedger = await createLedger({
        name: 'Test Purchase Ledger ' + Date.now(),
        code: 'TEST-PURCHASE-' + Date.now(),
        groupId: purchaseGroup.id,
        companyId
    });

    const cashLedger = await createLedger({
        name: 'Test Cash Ledger ' + Date.now(),
        code: 'TEST-CASH-' + Date.now(),
        groupId: cashGroup.id,
        companyId
    });

    // Post some vouchers
    // Sales: Cash Dr 1000, Sales Cr 1000
    await createVoucher({
        companyId,
        date: new Date(),
        type: VoucherType.SALES,
        narration: 'Test Cash Sale',
        postings: [
            { ledgerId: cashLedger.id, amount: 1000, type: PostingType.DEBIT },
            { ledgerId: salesLedger.id, amount: 1000, type: PostingType.CREDIT }
        ],
        status: VoucherStatus.POSTED
    } as any);

    // Purchase: Purchase Dr 500, Cash Cr 500
    await createVoucher({
        companyId,
        date: new Date(),
        type: VoucherType.PURCHASE,
        narration: 'Test Cash Purchase',
        postings: [
            { ledgerId: purchaseLedger.id, amount: 500, type: PostingType.DEBIT },
            { ledgerId: cashLedger.id, amount: 500, type: PostingType.CREDIT }
        ],
        status: VoucherStatus.POSTED
    } as any);

    // 2. Verify Profit & Loss
    console.log('\n2. Verifying Profit & Loss...');
    // Use a wide date range to catch the just-created vouchers
    const pl = await getProfitAndLoss(companyId, new Date('2020-01-01'), new Date());
    console.log('P&L Result (Income):', JSON.stringify(pl.income.filter(i => i.name.includes('Test Sales')), null, 2));
    console.log('P&L Result (Expense):', JSON.stringify(pl.expense.filter(i => i.name.includes('Test Purchase')), null, 2));

    // We check if our specific ledgers have the right amounts
    const salesEntry = pl.income.find(i => i.id === salesLedger.id);
    const purchaseEntry = pl.expense.find(i => i.id === purchaseLedger.id);

    if (salesEntry && salesEntry.amount === 1000 && purchaseEntry && purchaseEntry.amount === 500) {
        console.log('✅ P&L Verification PASSED for Test Ledgers');
    } else {
        console.error('❌ P&L Verification FAILED: Sales', salesEntry?.amount, 'Purchase', purchaseEntry?.amount);
    }

    // Also check totals logic
    console.log('Total Net Profit:', pl.totals.netProfit);

    // 3. Verify Balance Sheet
    console.log('\n3. Verifying Balance Sheet...');
    const bs = await getBalanceSheet(companyId, new Date());

    // Cash balance: +1000 (Debit from Sales) -500 (Credit from Purchase) = 500 Debit.

    const cashEntry = bs.assets.find(i => i.id === cashLedger.id);
    if (cashEntry && cashEntry.amount === 500) {
        console.log('✅ Balance Sheet Verification PASSED for Cash Ledger');
    } else {
        console.error('❌ Balance Sheet Verification FAILED for Cash Ledger:', cashEntry?.amount);
    }

    const totalAssets = bs.totals.totalAssets;
    const totalLiabilities = bs.totals.totalLiabilities;
    const totalEquity = bs.totals.totalEquity;

    if (Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01) {
        console.log('✅ Balance Sheet Equation PASSED (Assets = Liabilities + Equity)');
    } else {
        console.error(`❌ Balance Sheet Equation FAILED: Assets ${totalAssets} != Liability+Equity ${totalLiabilities + totalEquity}`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

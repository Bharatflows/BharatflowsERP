
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function removeTestData() {
    try {
        console.log("Starting cleanup of test data...");

        // 1. Find the test ledgers
        const testLedgers = await prisma.ledger.findMany({
            where: {
                OR: [
                    { name: { contains: 'Test' } },
                    { name: { contains: 'Tee' } }
                ]
            }
        });

        if (testLedgers.length === 0) {
            console.log("No test ledgers found.");
            return;
        }

        const ledgerIds = testLedgers.map(l => l.id);
        console.log(`Found ${testLedgers.length} ledgers to remove:`, testLedgers.map(l => l.name));

        // 2. Find vouchers associated with these ledgers
        const distinctVoucherIds = await prisma.ledgerPosting.findMany({
            where: {
                ledgerId: { in: ledgerIds }
            },
            select: {
                voucherId: true
            },
            distinct: ['voucherId']
        });

        const voucherIds = distinctVoucherIds.map(v => v.voucherId);
        console.log(`Found ${voucherIds.length} vouchers associated with these ledgers.`);

        // 3. Delete the vouchers (Cascade will delete the postings)
        if (voucherIds.length > 0) {
            const deleteVouchers = await prisma.voucher.deleteMany({
                where: {
                    id: { in: voucherIds }
                }
            });
            console.log(`Deleted ${deleteVouchers.count} vouchers.`);
        }

        // 4. Delete the ledgers
        const deleteLedgers = await prisma.ledger.deleteMany({
            where: {
                id: { in: ledgerIds }
            }
        });
        console.log(`Deleted ${deleteLedgers.count} ledgers.`);

        console.log("Cleanup complete.");

    } catch (error) {
        console.error("Error cleaning up test data:", error);
    } finally {
        await prisma.$disconnect();
    }
}

removeTestData();

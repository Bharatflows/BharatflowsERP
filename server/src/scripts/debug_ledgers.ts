
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Connecting...');
        const company = await prisma.company.findFirst();

        if (!company) {
            console.log('No company found.');
            return;
        }

        console.log(`Company: ${company.businessName} (${company.id})`);

        const ledgerCodes = ['PURCHASES', 'GST_INPUT', 'GST_PAYABLE', 'SALES_GOODS'];

        for (const code of ledgerCodes) {
            const ledger = await prisma.ledger.findFirst({
                where: {
                    companyId: company.id,
                    code: code
                }
            });

            if (ledger) {
                console.log(`[OK] Ledger '${code}' found.`);
            } else {
                console.log(`[MISSING] Ledger '${code}' NOT found!`);
            }
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();

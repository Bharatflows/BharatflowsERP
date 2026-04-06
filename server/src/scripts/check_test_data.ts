
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTestData() {
    try {
        console.log("Checking for test data...");
        const companyId = "bb498758-00d4-42f5-b657-3f3769c026ba"; // Use the one from context if available, or just search all for now or I can try to find from a user? 
        // Better to search by name text first.

        const testLedgers = await prisma.ledger.findMany({
            where: {
                OR: [
                    { name: { contains: 'Test' } },
                    { name: { contains: 'Tee' } }
                ]
            },
            include: {
                group: true,
                _count: {
                    select: { postings: true }
                }
            }
        });

        console.log(`Found ${testLedgers.length} potential test ledgers:`);
        testLedgers.forEach(l => {
            console.log(`- ID: ${l.id}, Name: ${l.name}, Group: ${l.group.name}, Postings: ${l._count.postings}`);
        });

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

checkTestData();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabase() {
    try {
        console.log('--- Database Check ---');

        const userCount = await prisma.user.count();
        console.log(`Total Users: ${userCount}`);

        const companyCount = await prisma.company.count();
        console.log(`Total Companies: ${companyCount}`);

        if (companyCount > 0) {
            const companies = await prisma.company.findMany({
                take: 5,
                select: { id: true, businessName: true, email: true }
            });
            console.log('Sample Companies:', JSON.stringify(companies, null, 2));
        }

        const partyCount = await prisma.party.count();
        console.log(`Total Parties: ${partyCount}`);

    } catch (error) {
        console.error('Error checking database:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkDatabase();

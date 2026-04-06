const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAndCleanUsers() {
    try {
        console.log('--- Checking Users ---');

        // Get all users
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                companyId: true,
                createdAt: true
            }
        });

        console.log(`Found ${users.length} user(s):`);
        users.forEach(u => {
            console.log(`  - ${u.email} | ${u.name} | Phone: ${u.phone} | Company: ${u.companyId ? 'Yes' : 'No'} | Created: ${u.createdAt}`);
        });

        // Get all companies
        const companies = await prisma.company.findMany({
            select: {
                id: true,
                businessName: true,
                email: true
            }
        });

        console.log(`\nFound ${companies.length} company(ies):`);
        companies.forEach(c => {
            console.log(`  - ${c.businessName} | ${c.email}`);
        });

        // Check for orphaned UserCompany records
        const userCompanies = await prisma.userCompany.findMany();
        console.log(`\nUserCompany records: ${userCompanies.length}`);

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkAndCleanUsers();

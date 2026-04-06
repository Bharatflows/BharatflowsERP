const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createFinancialYear() {
    try {
        console.log('--- Creating Financial Years ---');

        // Get all companies
        const companies = await prisma.company.findMany({
            select: { id: true, businessName: true }
        });

        console.log(`Found ${companies.length} company(ies)`);

        for (const company of companies) {
            // Check if FY exists
            const existingFY = await prisma.financialYear.findFirst({
                where: { companyId: company.id }
            });

            if (existingFY) {
                console.log(`FY already exists for ${company.businessName}`);
                continue;
            }

            // Create FY 2025-26 (April 2025 to March 2026)
            const fy = await prisma.financialYear.create({
                data: {
                    name: '2025-26',
                    startDate: new Date(2025, 3, 1), // April 1, 2025
                    endDate: new Date(2026, 2, 31), // March 31, 2026
                    isCurrent: true,
                    companyId: company.id
                }
            });

            console.log(`✅ Created FY 2025-26 for ${company.businessName} (ID: ${fy.id})`);
        }

        console.log('\nDone! Financial years created.');

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

createFinancialYear();

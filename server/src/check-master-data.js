const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMasterData() {
    try {
        console.log('--- Master Data Check ---');

        const categories = await prisma.businessCategory.findMany();
        console.log(`Business Categories: ${categories.length}`);
        if (categories.length > 0) {
            console.log('Categories:', categories.map(c => c.name).join(', '));
        }

        const industries = await prisma.industry.findMany();
        console.log(`Industries: ${industries.length}`);

        const activities = await prisma.businessActivity.findMany();
        console.log(`Business Activities: ${activities.length}`);

        const capabilities = await prisma.businessCapability.findMany();
        console.log(`Capabilities: ${capabilities.length}`);

    } catch (error) {
        console.error('Error checking master data:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkMasterData();

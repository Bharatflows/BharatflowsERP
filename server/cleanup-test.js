
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanup() {
    try {
        const email = 'test@example.com';
        const user = await prisma.user.findUnique({ where: { email } });
        if (user) {
            await prisma.user.delete({ where: { id: user.id } });
            await prisma.company.delete({ where: { id: user.companyId } });
            console.log('Cleanup successful');
        } else {
            console.log('User not found');
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

cleanup();

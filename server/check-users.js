const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
    try {
        const users = await prisma.user.findMany({
            take: 20,
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                status: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' }
        });

        console.log('\n=== Users in Database ===');
        console.log(`Total found: ${users.length}\n`);

        if (users.length === 0) {
            console.log('No users found in the database.');
        } else {
            users.forEach((user, i) => {
                console.log(`${i + 1}. ${user.name}`);
                console.log(`   Email: ${user.email}`);
                console.log(`   Phone: ${user.phone || 'N/A'}`);
                console.log(`   Role: ${user.role}`);
                console.log(`   Status: ${user.status}`);
                console.log(`   Created: ${user.createdAt}`);
                console.log('');
            });
        }
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkUsers();

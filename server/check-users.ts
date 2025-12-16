import prisma from './src/config/prisma';

async function checkUsers() {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                role: true,
                status: true,
                createdAt: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        console.log(`\n📊 Total users in database: ${users.length}\n`);

        if (users.length > 0) {
            console.log('🔍 Recent users:');
            users.forEach((user, index) => {
                console.log(`\n${index + 1}. ${user.name}`);
                console.log(`   Email: ${user.email}`);
                console.log(`   Phone: ${user.phone || 'N/A'}`);
                console.log(`   Role: ${user.role}`);
                console.log(`   Status: ${user.status}`);
                console.log(`   Created: ${user.createdAt}`);
            });
        } else {
            console.log('❌ No users found in database!');
            console.log('   The database might have been reset.');
        }

        await prisma.$disconnect();
    } catch (error) {
        console.error('Error:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

checkUsers();

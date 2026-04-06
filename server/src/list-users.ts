import prisma from '../src/config/prisma';

async function listUsers() {
    try {
        console.log('Fetching users from the database...');
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                role: true,
                status: true,
                createdAt: true,
                companyId: true,
            }
        });

        if (users.length === 0) {
            console.log('No users found in the database.');
        } else {
            console.log(`Found ${users.length} user(s):`);
            console.log(JSON.stringify(users, null, 2));
        }
    } catch (error: any) {
        console.error('Error fetching users:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

listUsers();

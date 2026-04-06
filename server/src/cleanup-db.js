const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupDatabase() {
    try {
        console.log('--- Cleaning Up Database (Full Reset) ---');

        // Delete in correct order to respect foreign key constraints
        // Must delete child records before parent records

        // Delete audit logs first
        const deletedAudit = await prisma.auditLog.deleteMany();
        console.log(`Deleted ${deletedAudit.count} AuditLog records`);

        // Delete notifications
        const deletedNotif = await prisma.notification.deleteMany();
        console.log(`Deleted ${deletedNotif.count} Notification records`);

        // Delete domain events
        const deletedEvents = await prisma.domainEvent.deleteMany();
        console.log(`Deleted ${deletedEvents.count} DomainEvent records`);

        // Delete UserCompany records
        const deletedUC = await prisma.userCompany.deleteMany();
        console.log(`Deleted ${deletedUC.count} UserCompany records`);

        // Delete Users
        const deletedUsers = await prisma.user.deleteMany();
        console.log(`Deleted ${deletedUsers.count} User records`);

        // Delete Companies
        const deletedCompanies = await prisma.company.deleteMany();
        console.log(`Deleted ${deletedCompanies.count} Company records`);

        console.log('\n✅ Database cleaned! You can now register a new account.');

    } catch (error) {
        console.error('Error during cleanup:', error.message);
        console.log('\nTrying alternative cleanup...');

        // If cascade delete fails, try a more aggressive approach
        try {
            await prisma.$executeRaw`DELETE FROM "AuditLog"`;
            await prisma.$executeRaw`DELETE FROM "Notification"`;
            await prisma.$executeRaw`DELETE FROM "DomainEvent"`;
            await prisma.$executeRaw`DELETE FROM "UserCompany"`;
            await prisma.$executeRaw`DELETE FROM "User"`;
            await prisma.$executeRaw`DELETE FROM "Company"`;
            console.log('✅ Database cleaned using raw SQL!');
        } catch (rawError) {
            console.error('Raw cleanup also failed:', rawError.message);
        }
    } finally {
        await prisma.$disconnect();
    }
}

cleanupDatabase();

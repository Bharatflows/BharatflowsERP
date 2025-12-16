
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from server directory
dotenv.config({ path: path.join(__dirname, '.env') });

const prisma = new PrismaClient();

async function main() {
    try {
        const dbUrl = process.env.DATABASE_URL || "NOT SET";
        console.log(`Database URL: ${dbUrl.replace(/:[^:@]*@/, ':***@')}`); // Mask password

        console.log('Fetching all users...');
        const users = await prisma.user.findMany({
            include: {
                company: true
            }
        });
        console.log(`Found ${users.length} users:`);
        users.forEach(u => {
            console.log(`- Name: ${u.name}, Email: "${u.email}", Phone: "${u.phone}", Role: ${u.role}, Status: ${u.status}`);
        });

        console.log('\nFetching all parties (Suppliers/Customers)...');
        const parties = await prisma.party.findMany({
            take: 10
        });
        console.log(`Found ${parties.length} parties (showing top 10):`);
        parties.forEach(p => {
            console.log(`- Name: ${p.name}, Type: ${p.type}, Email: "${p.email}", Phone: "${p.phone}"`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();

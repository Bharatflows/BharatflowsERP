import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Users ---');
    const users = await prisma.user.findMany({
        include: { company: true }
    });

    console.log('\n--- Companies ---');
    const companies = await prisma.company.findMany();

    const data = {
        users,
        companies
    };
    fs.writeFileSync('duplicates.json', JSON.stringify(data, null, 2));
    console.log('Data written to duplicates.json');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

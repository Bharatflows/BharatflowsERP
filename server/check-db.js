const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
    console.log('=== SEQUENCES ===');
    const seq = await p.sequence.findMany();
    console.log(JSON.stringify(seq, null, 2));

    console.log('\n=== PARTIES COUNT ===');
    const partiesCount = await p.party.count();
    console.log('Total Parties:', partiesCount);

    console.log('\n=== SAMPLE PARTIES ===');
    const parties = await p.party.findMany({ take: 5 });
    console.log(JSON.stringify(parties, null, 2));

    console.log('\n=== INVOICES COUNT ===');
    const invoiceCount = await p.invoice.count();
    console.log('Total Invoices:', invoiceCount);

    console.log('\n=== SAMPLE INVOICES ===');
    const invoices = await p.invoice.findMany({ take: 5 });
    console.log(JSON.stringify(invoices.map(i => ({ id: i.id, invoiceNumber: i.invoiceNumber })), null, 2));

    await p.$disconnect();
}

main().catch(console.error);

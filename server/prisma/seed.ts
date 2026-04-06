import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // 1. Create Default Company
    const company = await prisma.company.upsert({
        where: { gstin: '22AAAAA0000A1Z5' },
        update: {},
        create: {
            businessName: 'BharatFlows Demo Corp',
            legalName: 'BharatFlows Technologies Pvt Ltd',
            gstin: '22AAAAA0000A1Z5',
            email: 'contact@bharatflows.com',
            phone: '9876543210',
            plan: 'ENTERPRISE',
            enabledModules: {
                sales: true,
                purchase: true,
                inventory: true,
                accounting: true,
                hr: true,
                crm: true,
                production: true,
                gst: true,
                pos: true
            }
        }
    });

    console.log(`✅ Created company: ${company.businessName}`);

    // 2. Create Admin User
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@bharatflows.com' },
        update: {
            password: adminPassword,
            role: 'ADMIN',
            status: 'ACTIVE',
            companyId: company.id
        },
        create: {
            email: 'admin@bharatflows.com',
            password: adminPassword,
            name: 'System Administrator',
            role: 'ADMIN',
            status: 'ACTIVE',
            companyId: company.id,
            emailVerified: true
        }
    });

    console.log(`✅ Created admin user: ${admin.email}`);

    // 3. Create Demo Sales User
    const salesPassword = await bcrypt.hash('sales123', 10);
    const sales = await prisma.user.upsert({
        where: { email: 'sales@bharatflows.com' },
        update: {
            companyId: company.id
        },
        create: {
            email: 'sales@bharatflows.com',
            password: salesPassword,
            name: 'Sales Manager',
            role: 'USER',
            status: 'ACTIVE',
            companyId: company.id,
            emailVerified: true
        }
    });

    console.log(`✅ Created sales user: ${sales.email}`);

    // 4. Master Data
    console.log('🌱 Seeding master data...');

    const categories = [
        'Manufacturing',
        'Trading / Wholesale',
        'Retail',
        'Service Provider',
        'Job Work / Contract Manufacturing',
        'Distributor',
        'Importer',
        'Exporter'
    ];
    for (const name of categories) {
        await prisma.businessCategory.upsert({ where: { name }, update: {}, create: { name } });
    }

    const industries = [
        'Textiles & Garments',
        'Packaging',
        'Food Processing',
        'Pharma',
        'Plastics',
        'Electrical & Electronics',
        'Automotive Components',
        'Construction Materials',
        'Machinery',
        'FMCG',
        'Chemicals',
        'Metal Fabrication',
        'Agriculture',
        'IT & Software',
        'Furniture & Home Decor',
        'Paper & Printing',
        'Leather & Footwear'
    ];
    for (const name of industries) {
        await prisma.industry.upsert({
            where: { name },
            update: { isCustom: false, status: 'active' },
            create: { name, isCustom: false, status: 'active' }
        });
    }

    const activities = ['Manufacturer', 'Supplier', 'Wholesaler', 'Job Worker', 'Assembler', 'Processor', 'Exporter'];
    for (const name of activities) {
        await prisma.businessActivity.upsert({ where: { name }, update: {}, create: { name } });
    }

    const capabilities = ['In-house Manufacturing', 'Outsourced Manufacturing', 'Design / CAD', 'Printing', 'Packaging', 'Logistics', 'Quality Testing', 'R&D'];
    for (const name of capabilities) {
        await prisma.businessCapability.upsert({ where: { name }, update: {}, create: { name } });
    }

    console.log('✨ Seeding completed successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

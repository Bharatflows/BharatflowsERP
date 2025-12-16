import prisma from './src/config/prisma';
import bcrypt from 'bcryptjs';

async function createTestUser() {
    try {
        console.log('🔍 Checking existing users...\n');

        const existingUsers = await prisma.user.count();
        console.log(`Found ${existingUsers} users in database\n`);

        // Test credentials
        const email = 'test@bharatflow.com';
        const password = 'Test@123';
        const name = 'Test User';
        const businessName = 'Test Business';

        // Check if test user already exists
        const userExists = await prisma.user.findUnique({
            where: { email }
        });

        if (userExists) {
            console.log('✅ Test user already exists!');
            console.log(`📧 Email: ${email}`);
            console.log(`🔑 Password: ${password}`);
            await prisma.$disconnect();
            return;
        }

        console.log('👤 Creating test user...\n');

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create company and user in transaction
        const result = await prisma.$transaction(async (prisma) => {
            const company = await prisma.company.create({
                data: {
                    businessName,
                    email,
                    address: { country: 'India' }
                }
            });

            const user = await prisma.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    role: 'ADMIN',
                    companyId: company.id,
                    status: 'ACTIVE',
                    emailVerified: true
                }
            });

            return { user, company };
        });

        console.log('✅ Test user created successfully!\n');
        console.log('📋 Login Credentials:');
        console.log(`   📧 Email: ${email}`);
        console.log(`   🔑 Password: ${password}`);
        console.log(`   👤 Name: ${name}`);
        console.log(`   🏢 Company: ${businessName}`);
        console.log(`   🆔 User ID: ${result.user.id}`);
        console.log(`   🏪 Company ID: ${result.company.id}`);
        console.log('\n💡 You can now login with these credentials!\n');

        await prisma.$disconnect();
    } catch (error) {
        console.error('❌ Error:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

createTestUser();

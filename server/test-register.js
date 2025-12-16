
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function registerUser() {
    try {
        const email = 'test@example.com';
        const password = 'password123';
        const phone = '1234567890';
        const businessName = 'Test Company';

        // Check if user exists
        const userExists = await prisma.user.findFirst({
            where: {
                OR: [{ email }, { phone }]
            }
        });

        if (userExists) {
            console.log('User already exists');
            return;
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Transaction
        const result = await prisma.$transaction(async (prisma) => {
            const company = await prisma.company.create({
                data: {
                    businessName,
                    email,
                    phone,
                    address: { country: 'India' }
                }
            });

            const user = await prisma.user.create({
                data: {
                    name: 'Test User',
                    email,
                    password: hashedPassword,
                    phone,
                    role: 'ADMIN',
                    companyId: company.id
                }
            });

            return { user, company };
        });

        console.log('Registration successful:', result.user.email);

    } catch (error) {
        console.error('Registration error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

registerUser();

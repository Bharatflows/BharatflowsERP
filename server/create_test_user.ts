
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from server directory
dotenv.config({ path: path.join(__dirname, '.env') });

const prisma = new PrismaClient();

async function main() {
    try {
        const email = 'test@bharatflow.com';
        const password = 'Test@123';

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            console.log('User already exists.');
            return;
        }

        console.log('Creating test user...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create Company
        const company = await prisma.company.create({
            data: {
                businessName: 'BharatFlow Test Company',
                email: 'company@bharatflow.com',
                address: {
                    country: 'India',
                    city: 'Test City'
                },
                plan: 'PRO'
            }
        });

        // Create User
        const user = await prisma.user.create({
            data: {
                name: 'Test User',
                email: email,
                password: hashedPassword,
                role: 'ADMIN',
                companyId: company.id,
                status: 'ACTIVE',
                emailVerified: true
            }
        });

        console.log(`User created successfully: ${user.email} (Company: ${company.businessName})`);

    } catch (e) {
        console.error('Error creating user:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();

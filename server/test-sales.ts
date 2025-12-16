import 'dotenv/config';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5001/api/v1';

const testSales = async () => {
    try {
        // 0. Register User
        console.log('Registering User...');
        const email = `sales${Date.now()}@example.com`;
        const password = 'password123';

        try {
            await axios.post(`${API_URL}/auth/register`, {
                name: 'Sales Test User',
                email,
                password,
                phone: `9${Date.now()}`.slice(0, 10),
                businessName: 'Sales Test Company',
                gstin: `29ABCDE${Date.now()}Z5`.slice(0, 15)
            });
            console.log('Registration successful.');
        } catch (e: any) {
            console.log('Registration skipped or failed (might exist):', e.message);
        }

        // 1. Login
        console.log('Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email,
            password
        });
        const token = loginRes.data.data.token;
        const companyId = loginRes.data.data.company.id;
        console.log('Login successful. Token received.');

        // 2. Create a Party (Customer) directly in DB
        console.log('Creating Test Customer...');
        const customer = await prisma.party.create({
            data: {
                name: 'Test Customer',
                type: 'CUSTOMER',
                companyId: companyId,
                email: 'customer@example.com',
                phone: '9876543210'
            }
        });
        console.log('Customer created:', customer.id);

        // 3. Create a Product directly in DB
        console.log('Creating Test Product...');
        const product = await prisma.product.create({
            data: {
                name: 'Test Product 1',
                companyId: companyId,
                unit: 'pcs',
                purchasePrice: 50,
                sellingPrice: 100,
                currentStock: 100
            }
        });
        console.log('Product created:', product.id);

        // 4. Create Invoice via API
        console.log('Creating Invoice...');
        const invoiceData = {
            customerId: customer.id,
            invoiceDate: new Date(),
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            items: [
                {
                    productId: product.id,
                    productName: product.name,
                    quantity: 2,
                    rate: 100,
                    taxRate: 18
                }
            ]
        };

        const createRes = await axios.post(`${API_URL}/sales/invoices`, invoiceData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Invoice Created:', createRes.data.success);
        console.log('Invoice Number:', createRes.data.data.invoice.invoiceNumber);

        // 5. Get Invoices
        console.log('Fetching Invoices...');
        const getRes = await axios.get(`${API_URL}/sales/invoices`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Invoices Fetched:', getRes.data.data.invoices.length);

    } catch (error: any) {
        console.error('Test Failed:', error.response ? error.response.data : error.message);
    } finally {
        await prisma.$disconnect();
    }
};

testSales();

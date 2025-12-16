const axios = require('axios');

const EMAIL = 'browser_test_88888@test.com';
const PASSWORD = 'Test@123';
const API_URL = 'http://localhost:5000/api/v1';

async function reproduce() {
    try {
        console.log(`Logging in as ${EMAIL}...`);
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: EMAIL,
            password: PASSWORD
        });
        const token = loginRes.data.token;
        console.log('Login successful. Token:', token ? 'Yes' : 'No');

        console.log('Creating customer...');
        const partyData = {
            name: "Test Customer Browser Final",
            businessName: "Test Customer Business", // Adding this explicitly if required
            gstin: "",
            phone: "9876543212",
            email: "testcustomerfinal@test.com",
            address: "123 Test Street, Mumbai",
            city: "Mumbai",
            state: "Maharashtra",
            pincode: "400001",
            creditLimit: 0,
            creditDays: 0,
            openingBalance: 0,
            notes: "",
            status: "active",
            type: "customer",
            isActive: true
        };

        try {
            const createRes = await axios.post(`${API_URL}/parties`, partyData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Customer Created Successfully!', createRes.data);
        } catch (createError) {
            console.error('Customer Creation Failed:', createError.response?.data || createError.message);
        }

    } catch (error) {
        console.error('Setup Error:', error.response?.data || error.message);
    }
}

reproduce();

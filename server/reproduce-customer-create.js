const axios = require('axios');

const EMAIL = 'test@bharatflow.com';
const PASSWORD = 'Test@123';
const API_URL = 'http://127.0.0.1:5001/api/v1';

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
            businessName: "Test Customer Business",
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
            // Log full extensive error
            if (createError.response) {
                console.error('Customer Creation Failed Status:', createError.response.status);
                console.error('Customer Creation Failed Data:', JSON.stringify(createError.response.data, null, 2));
            } else {
                console.error('Customer Creation Failed Message:', createError.message);
            }
        }

    } catch (error) {
        console.error('Setup Error:', error.response?.data || error.message);
    }
}

reproduce();

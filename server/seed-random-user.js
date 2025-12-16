const axios = require('axios');

const suffix = 88888;
const EMAIL = `browser_test_88888@test.com`;
const PASSWORD = 'Test@123';
const API_URL = 'http://localhost:5000/api/v1/auth';

async function seedUser() {
    try {
        console.log(`Registering ${EMAIL}...`);
        try {
            const registerRes = await axios.post(`${API_URL}/register`, {
                name: `Test User ${suffix}`,
                email: EMAIL,
                password: PASSWORD,
                phone: '9876543210', // Phone might need to be unique too? Let's randomize.
                businessName: `Test Biz ${suffix}`,
                gstin: '27AABCT1234G1ZV'
            });
            console.log('Registration Successful!');
            console.log('User created with ID:', registerRes.data.user?.id);
            console.log('EMAIL:', EMAIL);
            console.log('PASSWORD:', PASSWORD);
        } catch (regError) {
            console.log('Registration failed:', regError.response?.data?.message || regError.message);
        }

    } catch (error) {
        console.error('Unexpected error:', error.message);
    }
}

seedUser();

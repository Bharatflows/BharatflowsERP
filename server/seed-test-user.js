const axios = require('axios');

const EMAIL = 'browser_test@test.com';
const PASSWORD = 'Test@123';
const API_URL = 'http://localhost:5000/api/v1/auth';

async function seedUser() {
    try {
        console.log(`Checking login for ${EMAIL}...`);
        try {
            const loginRes = await axios.post(`${API_URL}/login`, {
                email: EMAIL,
                password: PASSWORD
            });
            console.log('Login Successful!');
            console.log('Token:', loginRes.data.token ? 'Present' : 'Missing');
            return;
        } catch (loginError) {
            console.log('Login failed (' + (loginError.response?.data?.message || loginError.message) + '). Attempting to reset/register...');
        }

        // Only register if login failed. 
        // Note: We can't easily "delete" via API usually without auth. 
        // But if login failed, maybe user doesn't exist or wrong password.
        // Try registering.
        try {
            const registerRes = await axios.post(`${API_URL}/register`, {
                name: 'Deepak Test',
                email: EMAIL,
                password: PASSWORD,
                phone: '9876543210',
                businessName: 'Test Business NextGen',
                gstin: '27AABCT1234G1ZV'
            });
            console.log('Registration Successful!');
            console.log('User created with ID:', registerRes.data.user?.id);
        } catch (regError) {
            console.log('Registration failed:', regError.response?.data?.message || regError.message);
            // If registration failed because user exists but login failed, we have a password mismatch.
            // We can't fix this easily without DB access.
            // But let's assume if "User already exists", we are stuck unless we use a different email.
        }

    } catch (error) {
        console.error('Unexpected error:', error.message);
    }
}

seedUser();

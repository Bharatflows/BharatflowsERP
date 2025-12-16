import axios from 'axios';

const API_URL = 'http://localhost:5001/api/v1/auth';

const testAuth = async () => {
    try {
        console.log('Testing Registration...');
        const regData = {
            name: 'Test User',
            email: `test${Date.now()}@example.com`,
            password: 'password123',
            phone: `9${Date.now()}`.slice(0, 10),
            businessName: 'Test Company',
            gstin: `29ABCDE${Date.now()}Z5`.slice(0, 15)
        };

        const regRes = await axios.post(`${API_URL}/register`, regData);
        console.log('Registration Success:', regRes.data.success);
        console.log('Token:', regRes.data.data.token ? 'Received' : 'Missing');

        console.log('\nTesting Login...');
        const loginRes = await axios.post(`${API_URL}/login`, {
            email: regData.email,
            password: regData.password
        });
        console.log('Login Success:', loginRes.data.success);
        console.log('Token:', loginRes.data.data.token ? 'Received' : 'Missing');

    } catch (error: any) {
        console.error('Test Failed:', error.response ? error.response.data : error.message);
    }
};

testAuth();

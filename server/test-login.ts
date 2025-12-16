import axios from 'axios';

async function testRegistration() {
    try {
        console.log('Attempting registration with existing email...');
        const response = await axios.post('http://localhost:5000/api/v1/auth/register', {
            name: 'Duplicate User',
            email: 'authtest@example.com',
            password: 'password123',
            phone: '9999999999',
            businessName: 'Auth Test Corp',
            gstin: '27AAAAA0000A1Z5'
        });
        console.log('Registration Success (UNEXPECTED):', response.data);
    } catch (error: any) {
        console.log('Registration Failed (EXPECTED):', error.response ? error.response.data : error.message);
    }
}

testRegistration();

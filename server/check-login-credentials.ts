import axios from 'axios';

async function checkLogin() {
    try {
        console.log('Attempting login with deepak@nextgenerp.in...');
        const response = await axios.post('http://localhost:5000/api/v1/auth/login', {
            email: 'deepak@nextgenerp.in',
            password: 'Test@123'
        });
        console.log('Login Success!');
        console.log('User:', response.data.user.name);
        console.log('Token received:', response.data.token ? 'Yes' : 'No');
    } catch (error: any) {
        console.log('Login Failed:', error.response ? error.response.data : error.message);
    }
}

checkLogin();

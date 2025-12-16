
async function testLogin() {
    try {
        console.log('Attempting login with test@bharatflow.com...');
        // @ts-ignore
        const response = await fetch('http://localhost:5001/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'test@bharatflow.com',
                password: 'Test@123'
            })
        });

        const data = await response.json();
        console.log(`Status: ${response.status}`);
        console.log('Response:', JSON.stringify(data, null, 2));

    } catch (error: any) {
        console.error('Fetch error:', error);
    }
}

testLogin();

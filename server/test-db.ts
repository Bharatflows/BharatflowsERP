import { Client } from 'pg';

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:5432/bharatflow?schema=public',
});

async function testConnection() {
    try {
        console.log('Connecting to database...');
        await client.connect();
        console.log('Connected successfully!');
        const res = await client.query('SELECT NOW()');
        console.log('Database time:', res.rows[0]);
        await client.end();
    } catch (err) {
        console.error('Connection error:', err);
    }
}

testConnection();

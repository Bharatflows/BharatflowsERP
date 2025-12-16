const { Client } = require('pg');

async function test(user, password) {
    const client = new Client({
        user,
        host: 'localhost',
        database: 'postgres', // Try connecting to default 'postgres' db first to avoid 'bharatflow' missing error
        password,
        port: 5432,
    });
    try {
        await client.connect();
        console.log(`SUCCESS: Connected with User: '${user}', Password: '${password}'`);
        await client.end();
        return true;
    } catch (err) {
        console.log(`FAILED: User: '${user}', Password: '${password}' - Error: ${err.message}`);
        try { await client.end(); } catch (e) { }
        return false;
    }
}

async function run() {
    console.log("Testing DB Credentials...");
    await test('postgres', 'mongodb');
    await test('postgres', 'password');
    await test('postgres', 'admin');
    await test('postgres', 'root');
    await test('postgres', '1234');
    await test('postgres', 'postgres');
    await test('postgres', '');
}

run();

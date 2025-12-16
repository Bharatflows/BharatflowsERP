import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from current directory
dotenv.config({ path: path.join(__dirname, '.env') });

const uri = process.env.MONGODB_URI;
console.log('Testing connection...');

if (!uri) {
    console.error('MONGODB_URI not found in .env');
    process.exit(1);
}

// Basic masking for log
const maskedUri = uri.replace(/:([^:@]+)@/, ':****@');
console.log(`URI: ${maskedUri}`);

mongoose.connect(uri)
    .then(() => {
        console.log('✅ Successfully connected to MongoDB!');
        process.exit(0);
    })
    .catch((err) => {
        console.error('❌ Connection failed:', err.message);
        process.exit(1);
    });

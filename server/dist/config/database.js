"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = __importDefault(require("./logger"));
const connectDB = async () => {
    try {
        const MONGODB_URI = process.env.NODE_ENV === 'production'
            ? process.env.MONGODB_URI_PROD
            : process.env.MONGODB_URI;
        if (!MONGODB_URI) {
            throw new Error('MongoDB URI is not defined in environment variables');
        }
        const conn = await mongoose_1.default.connect(MONGODB_URI, {
        // Mongoose 6+ doesn't need these options anymore
        // useNewUrlParser: true,
        // useUnifiedTopology: true,
        });
        logger_1.default.info(`✅ MongoDB Connected: ${conn.connection.host}`);
        logger_1.default.info(`📊 Database Name: ${conn.connection.name}`);
        // Connection event handlers
        mongoose_1.default.connection.on('connected', () => {
            logger_1.default.info('Mongoose connected to MongoDB');
        });
        mongoose_1.default.connection.on('error', (err) => {
            logger_1.default.error('Mongoose connection error:', err);
        });
        mongoose_1.default.connection.on('disconnected', () => {
            logger_1.default.warn('Mongoose disconnected from MongoDB');
        });
        // Graceful shutdown
        process.on('SIGINT', async () => {
            await mongoose_1.default.connection.close();
            logger_1.default.info('MongoDB connection closed through app termination');
            process.exit(0);
        });
    }
    catch (error) {
        logger_1.default.error('❌ MongoDB connection error:', error.message);
        // process.exit(1);
    }
};
exports.default = connectDB;
//# sourceMappingURL=database.js.map
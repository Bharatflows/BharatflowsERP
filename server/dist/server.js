"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const prisma_1 = __importDefault(require("./config/prisma"));
const logger_1 = __importDefault(require("./config/logger"));
const errorHandler_1 = require("./middleware/errorHandler");
const rateLimiter_1 = require("./middleware/rateLimiter");
const socket_1 = require("./socket");
// Import routes
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const salesRoutes_1 = __importDefault(require("./routes/salesRoutes"));
const purchaseRoutes_1 = __importDefault(require("./routes/purchaseRoutes"));
const inventoryRoutes_1 = __importDefault(require("./routes/inventoryRoutes"));
const partiesRoutes_1 = __importDefault(require("./routes/partiesRoutes"));
const expensesRoutes_1 = __importDefault(require("./routes/expensesRoutes"));
const hrRoutes_1 = __importDefault(require("./routes/hrRoutes"));
const bankingRoutes_1 = __importDefault(require("./routes/bankingRoutes"));
const gstRoutes_1 = __importDefault(require("./routes/gstRoutes"));
const crmRoutes_1 = __importDefault(require("./routes/crmRoutes"));
const reportsRoutes_1 = __importDefault(require("./routes/reportsRoutes"));
const dashboardRoutes_1 = __importDefault(require("./routes/dashboardRoutes"));
const notificationsRoutes_1 = __importDefault(require("./routes/notificationsRoutes"));
const searchRoutes_1 = __importDefault(require("./routes/searchRoutes"));
const settingsRoutes_1 = __importDefault(require("./routes/settingsRoutes"));
const masterdataRoutes_1 = __importDefault(require("./routes/masterdataRoutes"));
const messagingRoutes_1 = __importDefault(require("./routes/messagingRoutes"));
// Load environment variables
dotenv_1.default.config();
// Create Express app and HTTP server
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const PORT = process.env.PORT || 5000;
// Initialize Socket.IO
const io = (0, socket_1.initializeSocket)(httpServer);
exports.io = io;
// Connect to PostgreSQL (Prisma)
const connectPrisma = async () => {
    try {
        await prisma_1.default.$connect();
        logger_1.default.info('✅ PostgreSQL Connected via Prisma');
    }
    catch (error) {
        logger_1.default.error('❌ PostgreSQL Connection Failed:', error);
        // Don't exit process, allow partial functionality
    }
};
connectPrisma();
// Middleware
app.use((0, helmet_1.default)()); // Security headers
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:5173',
    credentials: true
}));
app.use((0, compression_1.default)()); // Compress responses
app.use(express_1.default.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies
app.use((0, morgan_1.default)('combined', { stream: { write: (message) => logger_1.default.info(message.trim()) } })); // HTTP logging
// Rate limiting
app.use('/api', rateLimiter_1.rateLimiter);
// Health check
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'BharatFlow API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        socketConnected: io ? true : false
    });
});
// API Routes
const API_VERSION = process.env.API_VERSION || 'v1';
app.use(`/api/${API_VERSION}/auth`, authRoutes_1.default);
app.use(`/api/${API_VERSION}/sales`, salesRoutes_1.default);
app.use(`/api/${API_VERSION}/purchase`, purchaseRoutes_1.default);
app.use(`/api/${API_VERSION}/inventory`, inventoryRoutes_1.default);
app.use(`/api/${API_VERSION}/parties`, partiesRoutes_1.default);
app.use(`/api/${API_VERSION}/expenses`, expensesRoutes_1.default);
app.use(`/api/${API_VERSION}/hr`, hrRoutes_1.default);
app.use(`/api/${API_VERSION}/banking`, bankingRoutes_1.default);
app.use(`/api/${API_VERSION}/gst`, gstRoutes_1.default);
app.use(`/api/${API_VERSION}/crm`, crmRoutes_1.default);
app.use(`/api/${API_VERSION}/reports`, reportsRoutes_1.default);
app.use(`/api/${API_VERSION}/dashboard`, dashboardRoutes_1.default);
app.use(`/api/${API_VERSION}/notifications`, notificationsRoutes_1.default);
app.use(`/api/${API_VERSION}/search`, searchRoutes_1.default);
app.use(`/api/${API_VERSION}/settings`, settingsRoutes_1.default);
app.use(`/api/${API_VERSION}/masterdata`, masterdataRoutes_1.default);
app.use(`/api/${API_VERSION}/messaging`, messagingRoutes_1.default);
// 404 handler
app.use(errorHandler_1.notFoundHandler);
// Error handler (must be last)
app.use(errorHandler_1.errorHandler);
// Start HTTP server (with Socket.IO)
httpServer.listen(PORT, () => {
    logger_1.default.info(`🚀 BharatFlow API server running on port ${PORT}`);
    logger_1.default.info(`📍 Environment: ${process.env.NODE_ENV}`);
    logger_1.default.info(`🌐 API URL: http://localhost:${PORT}/api/${API_VERSION}`);
    logger_1.default.info(`🔌 WebSocket: ws://localhost:${PORT}`);
    logger_1.default.info(`💚 Health check: http://localhost:${PORT}/health`);
    // Start scheduled backups (only in production or if explicitly enabled)
    if (process.env.ENABLE_AUTO_BACKUP === 'true' || process.env.NODE_ENV === 'production') {
        Promise.resolve().then(() => __importStar(require('../scripts/scheduled-backup'))).then(({ startScheduledBackups }) => {
            startScheduledBackups();
        }).catch((err) => {
            logger_1.default.warn('⚠️ Could not start scheduled backups:', err.message);
        });
    }
});
exports.default = app;
//# sourceMappingURL=server.js.map
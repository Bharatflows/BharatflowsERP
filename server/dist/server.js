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
// Trigger restart after Prisma regeneration
const http_1 = require("http");
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const schedulerService_1 = require("./services/schedulerService");
// Mongoose removed - using Prisma only
const prisma_1 = __importDefault(require("./config/prisma"));
const logger_1 = __importDefault(require("./config/logger"));
const errorHandler_1 = require("./middleware/errorHandler");
const rateLimiter_1 = require("./middleware/rateLimiter");
const correlationMiddleware_1 = require("./middleware/correlationMiddleware");
const socket_1 = require("./socket");
// Import routes
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const salesRoutes_1 = __importDefault(require("./routes/salesRoutes"));
const purchaseRoutes_1 = __importDefault(require("./routes/purchaseRoutes"));
const inventoryRoutes_1 = __importDefault(require("./routes/inventoryRoutes"));
const partiesRoutes_1 = __importDefault(require("./routes/partiesRoutes"));
const expensesRoutes_1 = __importDefault(require("./routes/expensesRoutes"));
const expenseCategoriesRoutes_1 = __importDefault(require("./routes/expenseCategoriesRoutes"));
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
const inviteRoutes_1 = __importDefault(require("./routes/inviteRoutes"));
const syncRoutes_1 = __importDefault(require("./routes/syncRoutes"));
// import accountingRoutes from './routes/accountingRoutes';
const posRoutes_1 = __importDefault(require("./routes/posRoutes"));
const auditRoutes_1 = __importDefault(require("./routes/auditRoutes"));
const productionRoutes_1 = __importDefault(require("./routes/productionRoutes"));
const gstinRoutes_1 = __importDefault(require("./routes/gstinRoutes"));
const hsnRoutes_1 = __importDefault(require("./routes/hsnRoutes"));
const calendarRoutes_1 = __importDefault(require("./routes/calendarRoutes"));
const branchRoutes_1 = __importDefault(require("./routes/branchRoutes")); // P0-2: Multi-branch support
const financialYearRoutes_1 = __importDefault(require("./routes/financialYearRoutes")); // P0: Financial year locking
const approvalRoutes_1 = __importDefault(require("./routes/approvalRoutes")); // P0: Approval workflows
const bulkRoutes_1 = __importDefault(require("./routes/bulkRoutes")); // H2: Bulk Operations
const jobRoutes_1 = __importDefault(require("./routes/jobRoutes")); // H3: Job Status
const healthRoutes_1 = __importDefault(require("./routes/healthRoutes")); // H5: Health check endpoints
const subscriptionRoutes_1 = __importDefault(require("./routes/subscriptionRoutes")); // Subscription management
const paymentGatewayRoutes_1 = __importDefault(require("./routes/paymentGatewayRoutes")); // Payment gateway config
const wastageRoutes_1 = __importDefault(require("./routes/wastageRoutes")); // Inventory V2: Wastage tracking
const channelHubRoutes_1 = __importDefault(require("./routes/channelHubRoutes")); // Phase 4A: Channel Hub
const decisionEngineRoutes_1 = __importDefault(require("./routes/decisionEngineRoutes")); // Phase 5: Decision Engine
const escrowRoutes_1 = __importDefault(require("./routes/escrowRoutes")); // MVP: Escrow
// import manufacturingRoutes from './routes/manufacturingRoutes'; // BharatFlow: Manufacturing
// import projectRoutes from './routes/projectRoutes'; // BharatFlow: Projects
// import qualityRoutes from './routes/qualityRoutes'; // BharatFlow: Quality Control
// import supportRoutes from './routes/supportRoutes'; // BharatFlow: Support/Helpdesk
// import assetRoutes from './routes/assetRoutes'; // BharatFlow: Fixed Assets
// Load environment variables
dotenv_1.default.config();
// Create Express app and HTTP server
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const PORT = process.env.PORT || 5000;
// Initialize Socket.IO
const io = (0, socket_1.initializeSocket)(httpServer);
exports.io = io;
// Set IO instance for notification service to use
const socket_2 = require("./socket");
(0, socket_2.setIOInstance)(io);
// Domain initializer removed - domains folder deleted as dead code
const workers_1 = require("./workers"); // H3: Background Jobs
const seedMasterData_1 = require("./utils/seedMasterData"); // Auto-seed master data
const financialYearScheduler_1 = require("./utils/financialYearScheduler"); // Auto-create FY
const statusDerivationScheduler_1 = require("./utils/statusDerivationScheduler"); // Auto-derive OVERDUE
const approvalSubscriber_1 = require("./subscribers/approvalSubscriber");
// Initialize Workers (in same process for dev simplicity)
try {
    (0, workers_1.initializeWorkers)();
    (0, approvalSubscriber_1.initApprovalSubscriber)(); // Initialize Approval Subscriber
}
catch (err) {
    logger_1.default.warn('⚠️ Background workers failed to start:', err.message);
}
// Connect to PostgreSQL (Prisma) - Skip in Test Mode
const connectPrisma = async () => {
    if (process.env.NODE_ENV === 'test') {
        logger_1.default.info('🧪 Test Environment: Skipping real Prisma connection');
        return;
    }
    try {
        await prisma_1.default.$connect();
        logger_1.default.info('✅ PostgreSQL Connected via Prisma');
        // Seed master data (Industries) if empty
        await (0, seedMasterData_1.seedMasterDataIfEmpty)();
        // Schedule financial year auto-creation (runs now + daily)
        (0, financialYearScheduler_1.scheduleFinancialYearCheck)();
        // Schedule overdue status derivation (runs now + daily at 1 AM)
        (0, statusDerivationScheduler_1.scheduleOverdueDerivation)();
    }
    catch (error) {
        logger_1.default.error('❌ PostgreSQL Connection Failed:', error);
        // Don't exit process, allow partial functionality
    }
};
connectPrisma();
// API Version
const API_VERSION = 'v1';
// Root-level health check (bypasses API routing for monitoring)
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        status: 'ok',
        timestamp: Date.now(),
        uptime: process.uptime()
    });
});
// Middleware
app.use((0, cors_1.default)());
app.use((0, helmet_1.default)());
app.use((0, compression_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, morgan_1.default)('combined', { stream: { write: (message) => logger_1.default.info(message.trim()) } }));
app.use(correlationMiddleware_1.correlationMiddleware);
app.use(rateLimiter_1.rateLimiter);
// API Routes
app.use(`/api/${API_VERSION}/auth`, authRoutes_1.default);
app.use(`/api/${API_VERSION}/sales`, salesRoutes_1.default);
app.use(`/api/${API_VERSION}/purchase`, purchaseRoutes_1.default);
app.use(`/api/${API_VERSION}/inventory`, inventoryRoutes_1.default);
app.use(`/api/${API_VERSION}/parties`, partiesRoutes_1.default);
app.use(`/api/${API_VERSION}/expenses`, expensesRoutes_1.default);
app.use(`/api/${API_VERSION}/expense-categories`, expenseCategoriesRoutes_1.default);
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
app.use(`/api/${API_VERSION}/invites`, inviteRoutes_1.default);
app.use(`/api/${API_VERSION}/sync`, syncRoutes_1.default);
// app.use(`/api/${API_VERSION}/accounting`, accountingRoutes);
app.use(`/api/${API_VERSION}/pos`, posRoutes_1.default);
app.use(`/api/${API_VERSION}/audit`, auditRoutes_1.default);
app.use(`/api/${API_VERSION}/production`, productionRoutes_1.default);
app.use(`/api/${API_VERSION}/gstin`, gstinRoutes_1.default);
app.use(`/api/${API_VERSION}/hsn`, hsnRoutes_1.default);
app.use(`/api/${API_VERSION}/calendar`, calendarRoutes_1.default);
app.use(`/api/${API_VERSION}/branches`, branchRoutes_1.default);
app.use(`/api/${API_VERSION}/financial-years`, financialYearRoutes_1.default);
app.use(`/api/${API_VERSION}/approvals`, approvalRoutes_1.default);
app.use(`/api/${API_VERSION}/bulk`, bulkRoutes_1.default);
app.use(`/api/${API_VERSION}/jobs`, jobRoutes_1.default);
app.use(`/api/${API_VERSION}/health`, healthRoutes_1.default);
app.use(`/api/${API_VERSION}/subscriptions`, subscriptionRoutes_1.default);
app.use(`/api/${API_VERSION}/payment-gateway`, paymentGatewayRoutes_1.default);
app.use(`/api/${API_VERSION}/wastage`, wastageRoutes_1.default);
app.use(`/api/${API_VERSION}/channel-hub`, channelHubRoutes_1.default);
app.use(`/api/${API_VERSION}/decision-engine`, decisionEngineRoutes_1.default);
app.use(`/api/${API_VERSION}/escrow`, escrowRoutes_1.default);
// app.use(`/api/${API_VERSION}/manufacturing`, manufacturingRoutes);
// app.use(`/api/${API_VERSION}/projects`, projectRoutes);
// app.use(`/api/${API_VERSION}/quality`, qualityRoutes);
// app.use(`/api/${API_VERSION}/support`, supportRoutes);
// app.use(`/api/${API_VERSION}/assets`, assetRoutes);
// Error Handlers (must be last)
app.use(errorHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
// Start HTTP server (with Socket.IO) - Only if not in test mode
if (process.env.NODE_ENV !== 'test') {
    httpServer.listen(PORT, async () => {
        logger_1.default.info(`🚀 BharatFlow API server running on port ${PORT}`);
        logger_1.default.info(`📍 Environment: ${process.env.NODE_ENV}`);
        logger_1.default.info(`🌐 API URL: http://localhost:${PORT}/api/${API_VERSION}`);
        logger_1.default.info(`🔌 WebSocket: ws://localhost:${PORT}`);
        logger_1.default.info(`💚 Health check: http://localhost:${PORT}/health`);
        // Initialize Scheduler for Background Jobs
        try {
            await (0, schedulerService_1.initScheduler)();
        }
        catch (err) {
            logger_1.default.error('Failed to initialize scheduler:', err.message);
        }
        // Start scheduled backups (only in production or if explicitly enabled)
        if (process.env.ENABLE_AUTO_BACKUP === 'true' || process.env.NODE_ENV === 'production') {
            Promise.resolve().then(() => __importStar(require('./scripts/scheduled-backup'))).then(({ startScheduledBackups }) => {
                startScheduledBackups();
            }).catch((err) => {
                logger_1.default.warn('⚠️ Could not start scheduled backups:', err.message);
            });
        }
    });
    httpServer.on('error', (e) => {
        if (e.code === 'EADDRINUSE') {
            logger_1.default.error('Address in use, retrying...');
            setTimeout(() => {
                httpServer.close();
                httpServer.listen(PORT);
            }, 1000);
        }
    });
}
exports.default = app;
// H5 FIX: Graceful shutdown handler
const gracefulShutdown = async (signal) => {
    logger_1.default.info(`${signal} received. Shutting down gracefully...`);
    httpServer.close(() => {
        logger_1.default.info('HTTP server closed');
    });
    try {
        await prisma_1.default.$disconnect();
        logger_1.default.info('Database connection closed');
    }
    catch (error) {
        logger_1.default.error('Error during database disconnect:', error);
    }
    process.exit(0);
};
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
//# sourceMappingURL=server.js.map
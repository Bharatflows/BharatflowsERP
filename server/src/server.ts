import express, { Application } from 'express';
// Trigger restart after Prisma regeneration
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { initScheduler } from './services/schedulerService';
// Mongoose removed - using Prisma only
import prisma from './config/prisma';
import logger from './config/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { correlationMiddleware } from './middleware/correlationMiddleware';
import { initializeSocket } from './socket';

// Import routes
import authRoutes from './routes/authRoutes';
import salesRoutes from './routes/salesRoutes';
import purchaseRoutes from './routes/purchaseRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import partiesRoutes from './routes/partiesRoutes';
import expensesRoutes from './routes/expensesRoutes';
import expenseCategoriesRoutes from './routes/expenseCategoriesRoutes';
import hrRoutes from './routes/hrRoutes';
import bankingRoutes from './routes/bankingRoutes';
import gstRoutes from './routes/gstRoutes';
import crmRoutes from './routes/crmRoutes';
import reportsRoutes from './routes/reportsRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import notificationsRoutes from './routes/notificationsRoutes';
import searchRoutes from './routes/searchRoutes';
import settingsRoutes from './routes/settingsRoutes';
import masterdataRoutes from './routes/masterdataRoutes';
import messagingRoutes from './routes/messagingRoutes';
import inviteRoutes from './routes/inviteRoutes';

import syncRoutes from './routes/syncRoutes';
import accountingRoutes from './routes/accountingRoutes';
import posRoutes from './routes/posRoutes';
import auditRoutes from './routes/auditRoutes';
import productionRoutes from './routes/productionRoutes';
import gstinRoutes from './routes/gstinRoutes';
import hsnRoutes from './routes/hsnRoutes';
import calendarRoutes from './routes/calendarRoutes';
import branchRoutes from './routes/branchRoutes';  // P0-2: Multi-branch support
import financialYearRoutes from './routes/financialYearRoutes';  // P0: Financial year locking
import approvalRoutes from './routes/approvalRoutes';  // P0: Approval workflows
import bulkRoutes from './routes/bulkRoutes'; // H2: Bulk Operations
import jobRoutes from './routes/jobRoutes'; // H3: Job Status
import healthRoutes from './routes/healthRoutes';  // H5: Health check endpoints
import adminRoutes from './routes/adminRoutes'; // Admin panel
import subscriptionRoutes from './routes/subscriptionRoutes'; // Subscription management
import paymentGatewayRoutes from './routes/paymentGatewayRoutes'; // Payment gateway config
import wastageRoutes from './routes/wastageRoutes'; // Inventory V2: Wastage tracking
import channelHubRoutes from './routes/channelHubRoutes'; // Phase 4A: Channel Hub
import decisionEngineRoutes from './routes/decisionEngineRoutes'; // Phase 5: Decision Engine
import escrowRoutes from './routes/escrowRoutes'; // MVP: Escrow
import paymentIntelligenceRoutes from './routes/paymentIntelligenceRoutes'; // Payment Intelligence
// import manufacturingRoutes from './routes/manufacturingRoutes'; // BharatFlows: Manufacturing
// import projectRoutes from './routes/projectRoutes'; // BharatFlows: Projects
// import qualityRoutes from './routes/qualityRoutes'; // BharatFlows: Quality Control
// import supportRoutes from './routes/supportRoutes'; // BharatFlows: Support/Helpdesk
// import assetRoutes from './routes/assetRoutes'; // BharatFlows: Fixed Assets

// Load environment variables
dotenv.config();

// Create Express app and HTTP server
const app: Application = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize Socket.IO
const io = initializeSocket(httpServer);

// Set IO instance for notification service to use
import { setIOInstance } from './socket';
setIOInstance(io);

// Domain initializer removed - domains folder deleted as dead code
import { initializeWorkers } from './workers'; // H3: Background Jobs
import { seedMasterDataIfEmpty } from './utils/seedMasterData'; // Auto-seed master data
import { scheduleFinancialYearCheck } from './utils/financialYearScheduler'; // Auto-create FY
import { scheduleOverdueDerivation } from './utils/statusDerivationScheduler'; // Auto-derive OVERDUE
import { initApprovalSubscriber } from './subscribers/approvalSubscriber';

// Initialize Workers (in same process for dev simplicity)
try {
  initializeWorkers();
  initApprovalSubscriber(); // Initialize Approval Subscriber
} catch (err: any) {
  logger.warn('⚠️ Background workers failed to start:', err.message);
}

// Connect to PostgreSQL (Prisma) - Skip in Test Mode
const connectPrisma = async () => {
  if (process.env.NODE_ENV === 'test') {
    logger.info('🧪 Test Environment: Skipping real Prisma connection');
    return;
  }

  try {
    await prisma.$connect();
    logger.info('✅ PostgreSQL Connected via Prisma');

    // Seed master data (Industries) if empty
    await seedMasterDataIfEmpty();

    // Schedule financial year auto-creation (runs now + daily)
    scheduleFinancialYearCheck();

    // Schedule overdue status derivation (runs now + daily at 1 AM)
    scheduleOverdueDerivation();
  } catch (error) {
    logger.error('❌ PostgreSQL Connection Failed:', error);
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
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: Origin ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-company-id', 'x-correlation-id'],
}));
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(correlationMiddleware);
app.use(rateLimiter);

// API Routes
app.use(`/api/${API_VERSION}/auth`, authRoutes);
app.use(`/api/${API_VERSION}/sales`, salesRoutes);
app.use(`/api/${API_VERSION}/purchase`, purchaseRoutes);
app.use(`/api/${API_VERSION}/inventory`, inventoryRoutes);
app.use(`/api/${API_VERSION}/parties`, partiesRoutes);
app.use(`/api/${API_VERSION}/expenses`, expensesRoutes);
app.use(`/api/${API_VERSION}/expense-categories`, expenseCategoriesRoutes);
app.use(`/api/${API_VERSION}/hr`, hrRoutes);
app.use(`/api/${API_VERSION}/banking`, bankingRoutes);
app.use(`/api/${API_VERSION}/gst`, gstRoutes);
app.use(`/api/${API_VERSION}/crm`, crmRoutes);
app.use(`/api/${API_VERSION}/reports`, reportsRoutes);
app.use(`/api/${API_VERSION}/dashboard`, dashboardRoutes);
app.use(`/api/${API_VERSION}/notifications`, notificationsRoutes);
app.use(`/api/${API_VERSION}/search`, searchRoutes);
app.use(`/api/${API_VERSION}/settings`, settingsRoutes);
app.use(`/api/${API_VERSION}/masterdata`, masterdataRoutes);
app.use(`/api/${API_VERSION}/messaging`, messagingRoutes);
app.use(`/api/${API_VERSION}/invites`, inviteRoutes);
app.use(`/api/${API_VERSION}/sync`, syncRoutes);
app.use(`/api/${API_VERSION}/accounting`, accountingRoutes);
app.use(`/api/${API_VERSION}/pos`, posRoutes);
app.use(`/api/${API_VERSION}/audit`, auditRoutes);
app.use(`/api/${API_VERSION}/production`, productionRoutes);
app.use(`/api/${API_VERSION}/gstin`, gstinRoutes);
app.use(`/api/${API_VERSION}/hsn`, hsnRoutes);
app.use(`/api/${API_VERSION}/calendar`, calendarRoutes);
app.use(`/api/${API_VERSION}/branches`, branchRoutes);
app.use(`/api/${API_VERSION}/financial-years`, financialYearRoutes);
app.use(`/api/${API_VERSION}/approvals`, approvalRoutes);
app.use(`/api/${API_VERSION}/bulk`, bulkRoutes);
app.use(`/api/${API_VERSION}/jobs`, jobRoutes);
app.use(`/api/${API_VERSION}/health`, healthRoutes);
app.use(`/api/${API_VERSION}/subscriptions`, subscriptionRoutes);
app.use(`/api/${API_VERSION}/payment-gateway`, paymentGatewayRoutes);
app.use(`/api/${API_VERSION}/wastage`, wastageRoutes);
app.use(`/api/${API_VERSION}/channel-hub`, channelHubRoutes);
app.use(`/api/${API_VERSION}/decision-engine`, decisionEngineRoutes);
app.use(`/api/${API_VERSION}/escrow`, escrowRoutes);
app.use(`/api/${API_VERSION}/admin`, adminRoutes);
// app.use(`/api/${API_VERSION}/manufacturing`, manufacturingRoutes);
// app.use(`/api/${API_VERSION}/projects`, projectRoutes);
// app.use(`/api/${API_VERSION}/quality`, qualityRoutes);
// app.use(`/api/${API_VERSION}/support`, supportRoutes);
// app.use(`/api/${API_VERSION}/assets`, assetRoutes);
app.use(`/api/${API_VERSION}/payment-intelligence`, paymentIntelligenceRoutes);

// Error Handlers (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Start HTTP server (with Socket.IO) - Only if not in test mode
if (process.env.NODE_ENV !== 'test') {
  httpServer.listen(PORT, async () => {
    logger.info(`🚀 BharatFlows API server running on port ${PORT}`);
    logger.info(`📍 Environment: ${process.env.NODE_ENV}`);
    logger.info(`🌐 API URL: http://localhost:${PORT}/api/${API_VERSION}`);
    logger.info(`🔌 WebSocket: ws://localhost:${PORT}`);
    logger.info(`💚 Health check: http://localhost:${PORT}/health`);

    // Initialize Scheduler for Background Jobs
    try {
      await initScheduler();
    } catch (err: any) {
      logger.error('Failed to initialize scheduler:', err.message);
    }

    // Start scheduled backups (only in production or if explicitly enabled)
    if (process.env.ENABLE_AUTO_BACKUP === 'true' || process.env.NODE_ENV === 'production') {
      import('./scripts/scheduled-backup').then(({ startScheduledBackups }) => {
        startScheduledBackups();
      }).catch((err) => {
        logger.warn('⚠️ Could not start scheduled backups:', err.message);
      });
    }
  });

  httpServer.on('error', (e: any) => {
    if (e.code === 'EADDRINUSE') {
      logger.error('Address in use, retrying...');
      setTimeout(() => {
        httpServer.close();
        httpServer.listen(PORT);
      }, 1000);
    }
  });
}

export { io };
export default app;

// H5 FIX: Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received. Shutting down gracefully...`);

  httpServer.close(() => {
    logger.info('HTTP server closed');
  });

  try {
    await prisma.$disconnect();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error during database disconnect:', error);
  }

  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

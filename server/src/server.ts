import express, { Application } from 'express';
// Force reload
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import connectDB from './config/database';
import prisma from './config/prisma';
import logger from './config/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
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

// Load environment variables
dotenv.config();

// Create Express app and HTTP server
const app: Application = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize Socket.IO
const io = initializeSocket(httpServer);

// Connect to PostgreSQL (Prisma)
const connectPrisma = async () => {
  try {
    await prisma.$connect();
    logger.info('✅ PostgreSQL Connected via Prisma');
  } catch (error) {
    logger.error('❌ PostgreSQL Connection Failed:', error);
    // Don't exit process, allow partial functionality
  }
};
connectPrisma();

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:5173',
  credentials: true
}));
app.use(compression()); // Compress responses
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } })); // HTTP logging

// Rate limiting
app.use('/api', rateLimiter);

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
app.use(`/api/${API_VERSION}/auth`, authRoutes);
app.use(`/api/${API_VERSION}/sales`, salesRoutes);
app.use(`/api/${API_VERSION}/purchase`, purchaseRoutes);
app.use(`/api/${API_VERSION}/inventory`, inventoryRoutes);
app.use(`/api/${API_VERSION}/parties`, partiesRoutes);
app.use(`/api/${API_VERSION}/expenses`, expensesRoutes);
logger.info(`✅ Expenses routes mounted at /api/${API_VERSION}/expenses`);
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
app.use(`/api/${API_VERSION}/invite`, inviteRoutes);
app.use(`/api/${API_VERSION}/sync`, syncRoutes);
app.use(`/api/${API_VERSION}/accounting`, accountingRoutes);
app.use(`/api/${API_VERSION}/pos`, posRoutes);
app.use(`/api/${API_VERSION}/audit`, auditRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Start HTTP server (with Socket.IO)
httpServer.listen(PORT, () => {
  logger.info(`🚀 BharatFlow API server running on port ${PORT}`);
  logger.info(`📍 Environment: ${process.env.NODE_ENV}`);
  logger.info(`🌐 API URL: http://localhost:${PORT}/api/${API_VERSION}`);
  logger.info(`🔌 WebSocket: ws://localhost:${PORT}`);
  logger.info(`💚 Health check: http://localhost:${PORT}/health`);

  // Start scheduled backups (only in production or if explicitly enabled)
  if (process.env.ENABLE_AUTO_BACKUP === 'true' || process.env.NODE_ENV === 'production') {
    import('../scripts/scheduled-backup').then(({ startScheduledBackups }) => {
      startScheduledBackups();
    }).catch((err) => {
      logger.warn('⚠️ Could not start scheduled backups:', err.message);
    });
  }
});

export { io };
export default app;


/**
 * NELSYSTEMS DASHBOARD - API SERVER
 * 
 * Servidor principal de la aplicación
 * Node.js + Express + PostgreSQL
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { rateLimit } from 'express-rate-limit';
import { logger } from './config/logger.js';
import { connectDB } from './config/database.js';
import { errorHandler } from './middlewares/error.middleware.js';

// Routes
import authRoutes from './routes/auth.routes.js';
import clientsRoutes from './routes/clients.routes.js';
import projectsRoutes from './routes/projects.routes.js';
import servicesRoutes from './routes/services.routes.js';
import domainsRoutes from './routes/domains.routes.js';
import hostingRoutes from './routes/hosting.routes.js';
import licensesRoutes from './routes/licenses.routes.js';
import ticketsRoutes from './routes/tickets.routes.js';
import paymentsRoutes from './routes/payments.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_VERSION = process.env.API_VERSION || 'v1';

// ==================== MIDDLEWARE ====================

// Security
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}));

// CORS
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: { write: message => logger.info(message.trim()) }
  }));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});
app.use(`/api/${API_VERSION}`, limiter);

// ==================== ROUTES ====================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// API routes
const apiRouter = express.Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/clients', clientsRoutes);
apiRouter.use('/projects', projectsRoutes);
apiRouter.use('/services', servicesRoutes);
apiRouter.use('/domains', domainsRoutes);
apiRouter.use('/hosting', hostingRoutes);
apiRouter.use('/licenses', licensesRoutes);
apiRouter.use('/tickets', ticketsRoutes);
apiRouter.use('/payments', paymentsRoutes);
apiRouter.use('/dashboard', dashboardRoutes);

app.use(`/api/${API_VERSION}`, apiRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path
  });
});

// Error handling middleware
app.use(errorHandler);

// ==================== START SERVER ====================

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    logger.info('Database connected successfully');

    // Start server
    app.listen(PORT, () => {
      logger.info(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║           NELSYSTEMS DASHBOARD API SERVER                 ║
║                                                           ║
║   Environment: ${process.env.NODE_ENV?.toUpperCase().padEnd(43)}║
║   Port: ${PORT.toString().padEnd(50)}║
║   API Version: ${API_VERSION.padEnd(44)}║
║   Database: Connected                                     ║
║                                                           ║
║   Server running at: http://localhost:${PORT.toString().padEnd(19)}║
║   API Base URL: http://localhost:${PORT}/api/${API_VERSION.padEnd(10)}║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

// Start the server
startServer();

export default app;

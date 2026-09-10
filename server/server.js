const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

const mongoose = require('mongoose');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Core Middleware
app.use(cors({
  origin: CLIENT_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// Health Check Endpoint (Reports Server & Database Status)
app.get('/api/health', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;

  res.status(isDbConnected ? 200 : 503).json({
    success: isDbConnected,
    status: isDbConnected ? 'healthy' : 'degraded',
    service: 'ServiceFlow API',
    database: {
      status: isDbConnected ? 'connected' : 'disconnected',
      host: isDbConnected ? mongoose.connection.host : null,
      name: isDbConnected ? mongoose.connection.name : null
    },
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

const apiRoutes = require('./routes');
const errorHandler = require('./middleware/errorMiddleware');
const AppError = require('./utils/appError');

// Mount Master API Router
app.use('/api', apiRoutes);

// Fallback 404 Route for unhandled paths
app.all('*', (req, res, next) => {
  next(AppError.notFound(`Cannot find ${req.method} ${req.originalUrl} on this server`));
});

// Centralized Global Error Handler Middleware
app.use(errorHandler);

// Server listener: Connect to MongoDB before accepting incoming traffic
if (require.main === module) {
  connectDB().then(() => {
    const server = app.listen(PORT, () => {
      console.log(`[ServiceFlow] Backend server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
      console.log(`[ServiceFlow] Health check available at http://localhost:${PORT}/api/health`);
    });

    // Graceful Shutdown Handlers (SIGTERM, SIGINT)
    const handleGracefulShutdown = (signal) => {
      console.log(`\n[ServiceFlow] Received ${signal}. Starting graceful shutdown...`);
      server.close(async () => {
        console.log('[ServiceFlow] HTTP server closed.');
        try {
          await mongoose.connection.close(false);
          console.log('[ServiceFlow] MongoDB connection closed cleanly.');
          process.exit(0);
        } catch (err) {
          console.error('[ServiceFlow] Error during database disconnection:', err);
          process.exit(1);
        }
      });

      // Force terminate after 10s if hanging
      setTimeout(() => {
        console.error('[ServiceFlow] Forced shutdown after timeout.');
        process.exit(1);
      }, 10000).unref();
    };

    process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
  }).catch((err) => {
    console.error(`[ServiceFlow] Failed to start server:`, err.message);
  });
}

module.exports = app;

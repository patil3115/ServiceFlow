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
    app.listen(PORT, () => {
      console.log(`[ServiceFlow] Backend server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
      console.log(`[ServiceFlow] Health check available at http://localhost:${PORT}/api/health`);
    });
  }).catch((err) => {
    console.error(`[ServiceFlow] Failed to start server:`, err.message);
  });
}

module.exports = app;

const mongoose = require('mongoose');

/**
 * Connect to MongoDB with robust error handling and event logging.
 * Uses environment variable MONGO_URI.
 */
const connectDB = async () => {
  try {
    const connUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/serviceflow';

    const conn = await mongoose.connect(connUri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`[ServiceFlow DB] MongoDB Connected: ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);

    // Connection event listeners
    mongoose.connection.on('error', (err) => {
      console.error(`[ServiceFlow DB] Runtime connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[ServiceFlow DB] MongoDB disconnected. Attempting reconnection...');
    });

    return conn;
  } catch (error) {
    console.error(`[ServiceFlow DB] Initial connection failure: ${error.message}`);
    // In production, exit with failure; in test or retry loops, rethrow
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    throw error;
  }
};

module.exports = connectDB;

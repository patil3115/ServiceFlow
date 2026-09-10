const AppError = require('../utils/appError');
const ApiResponse = require('../utils/apiResponse');

/**
 * Handle Mongoose CastError (e.g. invalid ObjectId)
 */
const handleCastErrorDB = (err) => {
  const message = `Invalid resource identifier: '${err.value}' for field '${err.path}'`;
  return new AppError(message, 400);
};

/**
 * Handle Mongoose duplicate key errors (code 11000)
 */
const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue || {})[0] || 'field';
  const value = err.keyValue ? err.keyValue[field] : '';
  const message = `Duplicate value '${value}' for field '${field}'. Please provide a unique value.`;
  return new AppError(message, 409);
};

/**
 * Handle Mongoose Schema Validation errors
 */
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => ({
    field: el.path,
    message: el.message
  }));
  const message = 'Validation failed. Please review the highlighted fields.';
  return new AppError(message, 400, errors);
};

/**
 * Handle JSON Web Token errors
 */
const handleJWTError = () => {
  return new AppError('Invalid authentication token. Please log in again.', 401);
};

const handleJWTExpiredError = () => {
  return new AppError('Authentication token has expired. Please log in again.', 401);
};

/**
 * Centralized Express Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;

  // Log all non-operational/internal errors in console for diagnostics
  if (!err.isOperational) {
    console.error('[Unhandled System Error]:', err);
  }

  // Handle Mongoose & JWT specific error types
  if (err.name === 'CastError') error = handleCastErrorDB(err);
  if (err.code === 11000) error = handleDuplicateFieldsDB(err);
  if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
  if (err.name === 'JsonWebTokenError') error = handleJWTError();
  if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    error = new AppError('Malformed JSON payload in request body', 400);
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  const responsePayload = {
    success: false,
    statusCode,
    message
  };

  if (error.errors) {
    responsePayload.errors = error.errors;
  }

  // Only expose stack trace in local development environment
  if (process.env.NODE_ENV === 'development' && !error.isOperational) {
    responsePayload.stack = err.stack;
  }

  return res.status(statusCode).json(responsePayload);
};

module.exports = errorHandler;

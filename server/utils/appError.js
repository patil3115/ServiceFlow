/**
 * Custom Operational Application Error
 * Used throughout controllers and services to generate standardized HTTP errors.
 */
class AppError extends Error {
  /**
   * @param {string} message - Human-readable error message
   * @param {number} statusCode - HTTP status code (e.g. 400, 401, 403, 404, 409)
   * @param {Array|Object|null} errors - Optional structured validation errors
   */
  constructor(message, statusCode, errors = null) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; // Distinguishes operational errors from programmer/runtime bugs
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad Request', errors = null) {
    return new AppError(message, 400, errors);
  }

  static unauthorized(message = 'Unauthorized access', errors = null) {
    return new AppError(message, 401, errors);
  }

  static forbidden(message = 'Forbidden: insufficient permissions', errors = null) {
    return new AppError(message, 403, errors);
  }

  static notFound(message = 'Resource not found', errors = null) {
    return new AppError(message, 404, errors);
  }

  static conflict(message = 'Conflict: resource already exists', errors = null) {
    return new AppError(message, 409, errors);
  }

  static internal(message = 'Internal Server Error') {
    return new AppError(message, 500);
  }
}

module.exports = AppError;

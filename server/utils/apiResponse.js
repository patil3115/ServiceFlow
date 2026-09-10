/**
 * Standardized API Response Formatter
 * Ensures predictable API response envelopes across the entire platform.
 */
class ApiResponse {
  /**
   * Send a success response
   * @param {Object} res - Express response object
   * @param {*} data - Payload data
   * @param {string} message - Human-readable success message
   * @param {number} statusCode - HTTP status code (default: 200)
   * @param {Object|null} meta - Optional pagination or metadata
   */
  static success(res, data = null, message = 'Success', statusCode = 200, meta = null) {
    const response = {
      success: true,
      statusCode,
      message,
      data
    };

    if (meta) {
      response.meta = meta;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Send a created response (HTTP 201)
   */
  static created(res, data = null, message = 'Resource created successfully') {
    return ApiResponse.success(res, data, message, 201);
  }

  /**
   * Send an error response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code (default: 500)
   * @param {Array|Object|null} errors - Detailed errors
   */
  static error(res, message = 'An unexpected error occurred', statusCode = 500, errors = null) {
    const response = {
      success: false,
      statusCode,
      message
    };

    if (errors) {
      response.errors = errors;
    }

    return res.status(statusCode).json(response);
  }
}

module.exports = ApiResponse;

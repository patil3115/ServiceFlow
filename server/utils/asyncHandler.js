/**
 * Async handler utility to wrap Express async middleware and controllers.
 * Eliminates repetitive try-catch blocks by catching rejected promises
 * and passing them directly to the next(err) error handling middleware.
 *
 * @param {Function} fn - Async controller function (req, res, next)
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = asyncHandler;

const AppError = require('../utils/appError');

/**
 * Role-Based Access Control (RBAC) Middleware Factory
 *
 * Restricts route execution to authenticated users possessing specific authorized roles.
 * Must be preceded by `authMiddleware.protect` so that `req.user` is populated.
 *
 * @param  {...string} allowedRoles - List of permitted roles (e.g. 'ADMIN', 'SUPPORT_AGENT', 'EMPLOYEE')
 * @returns {Function} Express middleware handler
 *
 * @example
 * router.post('/categories', protect, authorize('ADMIN'), categoryController.createCategory);
 * router.put('/tickets/:id/assign', protect, authorize('SUPPORT_AGENT', 'ADMIN'), ticketController.assignTicket);
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // Fail-safe check in case protect middleware was omitted in route definition
    if (!req.user) {
      return next(
        AppError.unauthorized('Authentication required before role authorization check.')
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        AppError.forbidden(
          `Access denied. Role '${req.user.role}' is not authorized to access this resource. Required role(s): [${allowedRoles.join(', ')}].`
        )
      );
    }

    next();
  };
};

/**
 * Convenience aliases for ITSM role checks
 */
const requireAdmin = authorize('ADMIN');
const requireAgentOrAdmin = authorize('SUPPORT_AGENT', 'ADMIN');
const requireAnyRole = authorize('EMPLOYEE', 'SUPPORT_AGENT', 'ADMIN');

module.exports = {
  authorize,
  requireAdmin,
  requireAgentOrAdmin,
  requireAnyRole
};

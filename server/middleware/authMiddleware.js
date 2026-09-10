const { User } = require('../models');
const { verifyToken } = require('../utils/jwtUtils');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Authentication Middleware: Protects endpoints requiring a verified identity.
 *
 * Workflow:
 * 1. Checks incoming 'Authorization' request header for 'Bearer <token>'.
 * 2. Verifies cryptographic signature using JWT_SECRET.
 * 3. Extracts userId payload and queries MongoDB (excluding password).
 * 4. Verifies user account exists and is currently active.
 * 5. Attaches authenticated user document to req.user for downstream controllers/services.
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw AppError.unauthorized('Authentication required. Please provide a valid Bearer token.');
  }

  // Verify token signature and expiration
  const decoded = verifyToken(token);

  // Retrieve current user from database
  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    throw AppError.unauthorized('The account belonging to this token no longer exists.');
  }

  if (!currentUser.isActive) {
    throw AppError.forbidden('Your account has been deactivated. Please contact your IT administrator.');
  }

  // Attach user to request object
  req.user = currentUser;
  next();
});

module.exports = {
  protect
};

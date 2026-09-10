const authService = require('../services/authService');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');

/**
 * @desc    Register a new employee
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, department } = req.body;

  const result = await authService.register({
    name,
    email,
    password,
    department
  });

  return ApiResponse.created(
    res,
    result,
    'Employee registration successful'
  );
});

/**
 * @desc    Authenticate user & return JWT token
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const result = await authService.login({ email, password });

  return ApiResponse.success(
    res,
    result,
    'User login successful'
  );
});

/**
 * @desc    Get current authenticated user profile
 * @route   GET /api/auth/me
 * @access  Private (Authenticated)
 */
exports.getMe = asyncHandler(async (req, res) => {
  // req.user was attached by authMiddleware.protect
  return ApiResponse.success(
    res,
    req.user,
    'Current authenticated user retrieved successfully'
  );
});

const userService = require('../services/userService');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');

/**
 * @desc    Get all users (with search, filter, and pagination)
 * @route   GET /api/users
 * @access  Private (Admin only)
 */
exports.getUsers = asyncHandler(async (req, res) => {
  const { users, pagination } = await userService.getAllUsers(req.query);
  return ApiResponse.success(
    res,
    users,
    `Retrieved ${users.length} users successfully`,
    200,
    pagination
  );
});

/**
 * @desc    Get single user by ID with activity metrics
 * @route   GET /api/users/:id
 * @access  Private (Admin only)
 */
exports.getUserById = asyncHandler(async (req, res) => {
  const userData = await userService.getUserById(req.params.id);
  return ApiResponse.success(
    res,
    userData,
    `User ${userData.user.name} details retrieved successfully`
  );
});

/**
 * @desc    Update user role (with last admin demotion protection)
 * @route   PATCH /api/users/:id/role
 * @access  Private (Admin only)
 */
exports.updateUserRole = asyncHandler(async (req, res) => {
  const updatedUser = await userService.updateUserRole(
    req.user,
    req.params.id,
    req.body.role
  );
  return ApiResponse.success(
    res,
    updatedUser,
    `User ${updatedUser.name} role updated to ${updatedUser.role} successfully`
  );
});

/**
 * @desc    Update user active status (with last admin deactivation protection)
 * @route   PATCH /api/users/:id/status
 * @access  Private (Admin only)
 */
exports.updateUserStatus = asyncHandler(async (req, res) => {
  const updatedUser = await userService.updateUserStatus(
    req.user,
    req.params.id,
    req.body.isActive
  );
  const statusLabel = updatedUser.isActive ? 'activated' : 'deactivated';
  return ApiResponse.success(
    res,
    updatedUser,
    `User ${updatedUser.name} account ${statusLabel} successfully`
  );
});

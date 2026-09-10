const dashboardService = require('../services/dashboardService');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');

/**
 * @desc    Get dashboard metrics tailored to current user role
 * @route   GET /api/dashboard
 * @access  Private
 */
exports.getDashboard = asyncHandler(async (req, res) => {
  const user = req.user;
  let data;

  if (user.role === 'EMPLOYEE') {
    data = await dashboardService.getEmployeeDashboard(user._id);
  } else if (user.role === 'SUPPORT_AGENT') {
    data = await dashboardService.getAgentDashboard(user._id);
  } else if (user.role === 'ADMIN') {
    data = await dashboardService.getAdminDashboard();
  }

  return ApiResponse.success(
    res,
    data,
    `${user.role} dashboard metrics retrieved successfully`
  );
});

/**
 * @desc    Get Admin specific system-wide analytics
 * @route   GET /api/dashboard/admin
 * @access  Private (ADMIN)
 */
exports.getAdminDashboard = asyncHandler(async (req, res) => {
  const data = await dashboardService.getAdminDashboard();
  return ApiResponse.success(res, data, 'Admin dashboard retrieved successfully');
});

/**
 * @desc    Get Support Agent workload dashboard
 * @route   GET /api/dashboard/agent
 * @access  Private (SUPPORT_AGENT, ADMIN)
 */
exports.getAgentDashboard = asyncHandler(async (req, res) => {
  const agentId = req.user._id;
  const data = await dashboardService.getAgentDashboard(agentId);
  return ApiResponse.success(res, data, 'Agent dashboard retrieved successfully');
});

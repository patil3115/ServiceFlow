const auditService = require('../services/auditService');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');

/**
 * @desc    Get audit logs for a specific ticket (Timeline view)
 * @route   GET /api/tickets/:id/audit-logs
 * @access  Private (Ticket Owner, Support Agent, Admin)
 */
exports.getTicketAuditLogs = asyncHandler(async (req, res) => {
  const ticketId = req.params.id;
  const logs = await auditService.getTicketAuditLogs(req.user, ticketId);

  return ApiResponse.success(
    res,
    logs,
    `Retrieved ${logs.length} audit history events successfully`,
    200,
    { total: logs.length }
  );
});

/**
 * @desc    Get system-wide audit history
 * @route   GET /api/audit-logs
 * @access  Private (ADMIN)
 */
exports.getSystemAuditLogs = asyncHandler(async (req, res) => {
  const { logs, pagination } = await auditService.getSystemAuditLogs(req.query);

  return ApiResponse.success(
    res,
    logs,
    `Retrieved ${logs.length} system audit logs successfully`,
    200,
    pagination
  );
});

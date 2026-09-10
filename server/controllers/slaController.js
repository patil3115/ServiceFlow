const slaService = require('../services/slaService');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');

/**
 * @desc    Get live SLA metrics for a specific ticket
 * @route   GET /api/tickets/:id/sla
 * @access  Private (Ticket Creator, Support Agent, Admin)
 */
exports.getTicketSla = asyncHandler(async (req, res) => {
  const ticketId = req.params.id;
  const slaDetails = await slaService.getTicketSlaDetails(req.user, ticketId);

  return ApiResponse.success(
    res,
    slaDetails,
    `SLA details for ${slaDetails.ticketNumber} retrieved successfully`
  );
});

/**
 * @desc    Get organizational SLA performance report
 * @route   GET /api/sla/report
 * @access  Private (SUPPORT_AGENT, ADMIN)
 */
exports.getSlaReport = asyncHandler(async (req, res) => {
  const report = await slaService.getSlaPerformanceReport();

  return ApiResponse.success(
    res,
    report,
    'SLA performance report generated successfully'
  );
});

/**
 * @desc    Trigger breach synchronization scan
 * @route   POST /api/sla/sync
 * @access  Private (ADMIN)
 */
exports.syncBreaches = asyncHandler(async (req, res) => {
  const result = await slaService.syncBreachFlags();

  return ApiResponse.success(
    res,
    result,
    `SLA breach synchronization complete: ${result.flaggedCount} newly breached tickets flagged`
  );
});

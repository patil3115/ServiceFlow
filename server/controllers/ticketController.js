const ticketService = require('../services/ticketService');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');

/**
 * @desc    Create a new incident ticket
 * @route   POST /api/tickets
 * @access  Private (EMPLOYEE, SUPPORT_AGENT, ADMIN)
 */
exports.createTicket = asyncHandler(async (req, res) => {
  const newTicket = await ticketService.createTicket(req.user, req.body);
  return ApiResponse.created(
    res,
    newTicket,
    `Incident ticket ${newTicket.ticketNumber} created successfully`
  );
});

/**
 * @desc    Get tickets list (with server-side role ownership filtering)
 * @route   GET /api/tickets
 * @access  Private
 */
exports.getTickets = asyncHandler(async (req, res) => {
  const tickets = await ticketService.getTickets(req.user, req.query);
  return ApiResponse.success(
    res,
    tickets,
    `Retrieved ${tickets.length} tickets successfully`,
    200,
    { total: tickets.length }
  );
});

/**
 * @desc    Get ticket by ID or ticketNumber
 * @route   GET /api/tickets/:id
 * @access  Private
 */
exports.getTicketById = asyncHandler(async (req, res) => {
  const ticket = await ticketService.getTicketById(req.user, req.params.id);
  return ApiResponse.success(
    res,
    ticket,
    `Ticket ${ticket.ticketNumber} retrieved successfully`
  );
});

/**
 * @desc    Update allowed ticket details
 * @route   PUT /api/tickets/:id
 * @access  Private
 */
exports.updateTicket = asyncHandler(async (req, res) => {
  const updatedTicket = await ticketService.updateTicket(
    req.user,
    req.params.id,
    req.body
  );
  return ApiResponse.success(
    res,
    updatedTicket,
    `Ticket ${updatedTicket.ticketNumber} updated successfully`
  );
});

/**
 * @desc    Delete ticket
 * @route   DELETE /api/tickets/:id
 * @access  Private (Admin or Ticket Owner unassigned OPEN)
 */
exports.deleteTicket = asyncHandler(async (req, res) => {
  const result = await ticketService.deleteTicket(req.user, req.params.id);
  return ApiResponse.success(
    res,
    result,
    `Ticket ${result.ticketNumber} deleted successfully`
  );
});

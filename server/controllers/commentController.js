const commentService = require('../services/commentService');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');

/**
 * @desc    Add a comment to a ticket
 * @route   POST /api/tickets/:ticketId/comments
 * @access  Private (Ticket Creator, Support Agent, Admin)
 */
exports.addComment = asyncHandler(async (req, res) => {
  const { message } = req.body;
  const ticketId = req.params.ticketId;

  const newComment = await commentService.addComment(req.user, ticketId, { message });

  return ApiResponse.created(
    res,
    newComment,
    'Comment added successfully'
  );
});

/**
 * @desc    Get all comments for a ticket (chronological)
 * @route   GET /api/tickets/:ticketId/comments
 * @access  Private (Ticket Creator, Support Agent, Admin)
 */
exports.getComments = asyncHandler(async (req, res) => {
  const ticketId = req.params.ticketId;

  const comments = await commentService.getCommentsByTicket(req.user, ticketId);

  return ApiResponse.success(
    res,
    comments,
    `Retrieved ${comments.length} comments successfully`,
    200,
    { total: comments.length }
  );
});

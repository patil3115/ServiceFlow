const { Comment, AuditLog } = require('../models');
const ticketService = require('./ticketService');
const AppError = require('../utils/appError');

class CommentService {
  /**
   * Helper: Ensure authenticated user has permission to interact with the ticket
   */
  async ensureTicketAccess(user, ticketIdOrNumber) {
    const ticket = await ticketService.findTicketByIdOrNumber(ticketIdOrNumber);

    if (
      user.role === 'EMPLOYEE' &&
      ticket.createdBy._id.toString() !== user._id.toString()
    ) {
      throw AppError.forbidden(
        'Access denied. You do not have permission to view or comment on this ticket.'
      );
    }

    return ticket;
  }

  /**
   * Add a comment to an incident ticket
   */
  async addComment(user, ticketIdOrNumber, { message }) {
    if (!message || !message.trim()) {
      throw AppError.badRequest('Comment message cannot be empty.');
    }

    if (message.trim().length > 2000) {
      throw AppError.badRequest('Comment message cannot exceed 2000 characters.');
    }

    const ticket = await this.ensureTicketAccess(user, ticketIdOrNumber);

    const comment = await Comment.create({
      ticketId: ticket._id,
      userId: user._id,
      message: message.trim()
    });

    // Record audit event
    await AuditLog.create({
      ticketId: ticket._id,
      userId: user._id,
      action: 'COMMENT_ADDED',
      newValue: 'NEW_COMMENT',
      metadata: {
        commentId: comment._id,
        authorRole: user.role,
        snippet: message.trim().substring(0, 80)
      }
    });

    return await comment.populate('userId', 'name email role department');
  }

  /**
   * Retrieve all comments for a ticket in chronological order
   */
  async getCommentsByTicket(user, ticketIdOrNumber) {
    const ticket = await this.ensureTicketAccess(user, ticketIdOrNumber);

    const comments = await Comment.find({ ticketId: ticket._id })
      .populate('userId', 'name email role department')
      .sort({ createdAt: 1 }); // Chronological order (oldest to newest)

    return comments;
  }
}

module.exports = new CommentService();

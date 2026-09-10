const { AuditLog } = require('../models');
const ticketService = require('./ticketService');
const AppError = require('../utils/appError');

class AuditService {
  /**
   * Helper: Generate human-friendly narrative for an audit log entry
   */
  formatAuditNarrative(log) {
    const actorName = log.userId?.name || 'System';
    const actorRole = log.userId?.role || 'SYSTEM';

    switch (log.action) {
      case 'TICKET_CREATED':
        return `${actorName} created ticket ${log.metadata?.ticketNumber || ''}`;
      case 'TICKET_ASSIGNED':
        return `${actorName} assigned ticket to ${log.newValue}`;
      case 'STATUS_CHANGED':
        return `${actorName} changed status: ${log.oldValue} → ${log.newValue}`;
      case 'PRIORITY_CHANGED':
        return `${actorName} changed priority: ${log.oldValue} → ${log.newValue}`;
      case 'TICKET_RESOLVED':
        return `${actorName} resolved the ticket`;
      case 'TICKET_REOPENED':
        return `${actorName} reopened the ticket (Reason: "${log.metadata?.reason || 'Not specified'}")`;
      case 'TICKET_CLOSED':
        return `${actorName} confirmed resolution and closed the ticket`;
      case 'COMMENT_ADDED':
        return `${actorName} posted a comment`;
      case 'USER_ROLE_CHANGED':
        return `${actorName} changed user role from ${log.oldValue} to ${log.newValue}`;
      case 'USER_STATUS_CHANGED':
        return `${actorName} ${log.newValue === 'ACTIVE' ? 'activated' : 'deactivated'} user account`;
      default:
        return `${actorName} performed ${log.action}`;
    }
  }

  /**
   * Retrieve chronological audit timeline for a specific ticket
   */
  async getTicketAuditLogs(user, ticketIdOrNumber) {
    // 1. Verify access permissions (Employees can only view their own ticket history)
    const ticket = await ticketService.findTicketByIdOrNumber(ticketIdOrNumber);

    if (
      user.role === 'EMPLOYEE' &&
      ticket.createdBy._id.toString() !== user._id.toString()
    ) {
      throw AppError.forbidden(
        'Access denied. You do not have permission to view audit logs for this ticket.'
      );
    }

    // 2. Fetch immutable audit records
    const logs = await AuditLog.find({ ticketId: ticket._id })
      .populate('userId', 'name email role department')
      .sort({ createdAt: 1 }) // Chronological order for timeline display
      .lean();

    // 3. Attach computed human-friendly narratives
    return logs.map((log) => ({
      ...log,
      narrative: this.formatAuditNarrative(log)
    }));
  }

  /**
   * Retrieve paginated system-wide audit history (Admin only)
   */
  async getSystemAuditLogs(queryParams = {}) {
    const filter = {};

    if (queryParams.action) {
      filter.action = queryParams.action.toUpperCase();
    }
    if (queryParams.userId) {
      filter.userId = queryParams.userId;
    }
    if (queryParams.ticketId) {
      filter.ticketId = queryParams.ticketId;
    }
    if (queryParams.startDate || queryParams.endDate) {
      filter.createdAt = {};
      if (queryParams.startDate) {
        filter.createdAt.$gte = new Date(queryParams.startDate);
      }
      if (queryParams.endDate) {
        const end = new Date(queryParams.endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const page = Math.max(1, parseInt(queryParams.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(queryParams.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const totalLogs = await AuditLog.countDocuments(filter);
    const totalPages = Math.ceil(totalLogs / limit) || 1;

    const rawLogs = await AuditLog.find(filter)
      .populate('userId', 'name email role department')
      .populate('ticketId', 'ticketNumber title category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const logs = rawLogs.map((log) => ({
      ...log,
      narrative: this.formatAuditNarrative(log)
    }));

    return {
      logs,
      pagination: {
        page,
        limit,
        totalLogs,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  }
}

module.exports = new AuditService();

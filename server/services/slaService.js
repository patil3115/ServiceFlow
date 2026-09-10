const { Ticket, AuditLog } = require('../models');
const ticketService = require('./ticketService');
const AppError = require('../utils/appError');

class SlaService {
  /**
   * Helper: Format millisecond difference into human-friendly duration string
   * e.g. "1 hour 24 minutes", "45 minutes", "2 days 3 hours"
   */
  formatDuration(ms) {
    if (ms <= 0) return '0 minutes';

    const totalMinutes = Math.floor(ms / (1000 * 60));
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;

    const parts = [];
    if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
    if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
    if (minutes > 0 || parts.length === 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);

    return parts.join(' ');
  }

  /**
   * Compute comprehensive live SLA telemetry for a single ticket
   */
  computeTicketSla(ticket) {
    const now = new Date();
    const deadline = new Date(ticket.slaDeadline);
    const isTerminal = ['RESOLVED', 'CLOSED'].includes(ticket.status);

    if (isTerminal) {
      // For resolved or closed tickets, SLA clock stopped at resolution time
      const resolvedAt = ticket.resolution?.resolvedAt
        ? new Date(ticket.resolution.resolvedAt)
        : ticket.closedAt
        ? new Date(ticket.closedAt)
        : new Date(ticket.updatedAt);

      const isBreached = resolvedAt > deadline;
      const diffMs = Math.abs(resolvedAt - deadline);
      const formattedDiff = this.formatDuration(diffMs);

      return {
        status: isBreached ? 'RESOLVED_BREACHED' : 'RESOLVED_WITHIN_SLA',
        isBreached,
        clockStopped: true,
        resolvedAt,
        slaDeadline: deadline,
        summary: isBreached
          ? `Resolved after breach (exceeded by ${formattedDiff})`
          : `Resolved within SLA (${formattedDiff} before deadline)`,
        diffDurationText: formattedDiff,
        diffMs
      };
    }

    // In-flight active ticket calculation
    const isBreached = now > deadline;
    const diffMs = Math.abs(now - deadline);
    const formattedDiff = this.formatDuration(diffMs);

    // Warning urgency threshold (< 1 hour remaining)
    let urgencyLevel = 'NORMAL';
    if (isBreached) {
      urgencyLevel = 'BREACHED';
    } else if (diffMs < 30 * 60 * 1000) {
      urgencyLevel = 'CRITICAL_WARNING'; // Under 30 mins
    } else if (diffMs < 60 * 60 * 1000) {
      urgencyLevel = 'WARNING'; // Under 1 hour
    }

    return {
      status: isBreached ? 'SLA_BREACHED' : 'WITHIN_SLA',
      isBreached,
      clockStopped: false,
      urgencyLevel,
      slaDeadline: deadline,
      summary: isBreached
        ? `SLA BREACHED (Exceeded by ${formattedDiff})`
        : `Within SLA (${formattedDiff} remaining)`,
      remainingTimeText: isBreached ? null : `${formattedDiff} remaining`,
      exceededTimeText: isBreached ? `Exceeded by ${formattedDiff}` : null,
      diffDurationText: formattedDiff,
      diffMs
    };
  }

  /**
   * Get SLA details for a specific ticket (with ownership access check)
   */
  async getTicketSlaDetails(user, ticketIdOrNumber) {
    const ticket = await ticketService.findTicketByIdOrNumber(ticketIdOrNumber);

    if (
      user.role === 'EMPLOYEE' &&
      ticket.createdBy._id.toString() !== user._id.toString()
    ) {
      throw AppError.forbidden(
        'Access denied. You do not have permission to view SLA metrics for this ticket.'
      );
    }

    const slaInfo = this.computeTicketSla(ticket);

    return {
      ticketNumber: ticket.ticketNumber,
      priority: ticket.priority,
      status: ticket.status,
      createdAt: ticket.createdAt,
      ...slaInfo
    };
  }

  /**
   * Scan active tickets and update isSlaBreached flag in MongoDB
   */
  async syncBreachFlags() {
    const now = new Date();

    const newlyBreachedTickets = await Ticket.find({
      status: { $nin: ['RESOLVED', 'CLOSED'] },
      slaDeadline: { $lt: now },
      isSlaBreached: false
    });

    for (const ticket of newlyBreachedTickets) {
      ticket.isSlaBreached = true;
      await ticket.save();
    }

    return {
      scannedAt: now,
      flaggedCount: newlyBreachedTickets.length
    };
  }

  /**
   * Enterprise SLA Performance Report (Admin & Support Agent)
   */
  async getSlaPerformanceReport() {
    await this.syncBreachFlags();

    const now = new Date();
    const allTickets = await Ticket.find().lean();

    let totalResolvedOrClosed = 0;
    let resolvedWithinSla = 0;
    let resolvedBreached = 0;
    let activeInFlight = 0;
    let activeWithinSla = 0;
    let activeBreached = 0;

    const priorityBreakdown = {
      CRITICAL: { total: 0, breached: 0 },
      HIGH: { total: 0, breached: 0 },
      MEDIUM: { total: 0, breached: 0 },
      LOW: { total: 0, breached: 0 }
    };

    allTickets.forEach((ticket) => {
      const sla = this.computeTicketSla(ticket);
      const prio = ticket.priority || 'MEDIUM';

      if (priorityBreakdown[prio]) {
        priorityBreakdown[prio].total += 1;
        if (sla.isBreached) {
          priorityBreakdown[prio].breached += 1;
        }
      }

      if (['RESOLVED', 'CLOSED'].includes(ticket.status)) {
        totalResolvedOrClosed += 1;
        if (sla.isBreached) {
          resolvedBreached += 1;
        } else {
          resolvedWithinSla += 1;
        }
      } else {
        activeInFlight += 1;
        if (sla.isBreached) {
          activeBreached += 1;
        } else {
          activeWithinSla += 1;
        }
      }
    });

    const totalTickets = allTickets.length;
    const totalBreached = resolvedBreached + activeBreached;
    const totalCompliant = totalTickets - totalBreached;
    const complianceRate = totalTickets > 0
      ? ((totalCompliant / totalTickets) * 100).toFixed(1) + '%'
      : '100%';

    return {
      overall: {
        totalTickets,
        totalCompliant,
        totalBreached,
        complianceRate
      },
      resolvedIncidents: {
        totalResolvedOrClosed,
        resolvedWithinSla,
        resolvedBreached
      },
      activeWorkload: {
        activeInFlight,
        activeWithinSla,
        activeBreached
      },
      priorityBreakdown
    };
  }
}

module.exports = new SlaService();

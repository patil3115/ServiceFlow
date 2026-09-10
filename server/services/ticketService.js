const mongoose = require('mongoose');
const { Ticket, Category, AuditLog, User } = require('../models');
const { generateTicketNumber } = require('../utils/ticketNumberGenerator');
const { calculateSlaDeadline } = require('../utils/slaCalculator');
const { assertValidTransition, TICKET_STATUS } = require('../utils/ticketLifecycle');
const AppError = require('../utils/appError');

class TicketService {
  /**
   * Helper: Resolve ticket by MongoDB ObjectId OR human-readable ticketNumber (INC-XXXX)
   */
  async findTicketByIdOrNumber(idOrNumber) {
    let query;
    if (mongoose.Types.ObjectId.isValid(idOrNumber)) {
      query = { _id: idOrNumber };
    } else {
      query = { ticketNumber: idOrNumber.toUpperCase().trim() };
    }

    const ticket = await Ticket.findOne(query)
      .populate('createdBy', 'name email department role')
      .populate('assignedTo', 'name email department role')
      .populate('resolution.resolvedBy', 'name email')
      .populate('closedBy', 'name email');

    if (!ticket) {
      throw AppError.notFound(`Ticket not found: ${idOrNumber}`);
    }

    return ticket;
  }

  /**
   * Create a new incident ticket
   */
  async createTicket(user, { title, description, category, priority = 'MEDIUM' }) {
    if (!title || !title.trim()) {
      throw AppError.badRequest('Please provide a descriptive incident title');
    }
    if (!description || !description.trim()) {
      throw AppError.badRequest('Please provide details for the incident description');
    }
    if (!category || !category.trim()) {
      throw AppError.badRequest('Please select an incident category');
    }

    // Verify category exists
    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${category.trim()}$`, 'i') },
      isActive: true
    });

    if (!existingCategory) {
      throw AppError.badRequest(`Category '${category}' does not exist or is inactive`);
    }

    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const chosenPriority = validPriorities.includes(priority.toUpperCase())
      ? priority.toUpperCase()
      : 'MEDIUM';

    // Generate human-friendly ticket identifier
    const ticketNumber = await generateTicketNumber();

    // Calculate SLA deadline
    const createdAt = new Date();
    const slaDeadline = calculateSlaDeadline(createdAt, chosenPriority);

    const ticket = await Ticket.create({
      ticketNumber,
      title: title.trim(),
      description: description.trim(),
      category: existingCategory.name,
      priority: chosenPriority,
      status: 'OPEN',
      createdBy: user._id,
      assignedTo: null,
      department: user.department,
      slaDeadline,
      createdAt
    });

    // Record initial Audit Log
    await AuditLog.create({
      ticketId: ticket._id,
      userId: user._id,
      action: 'TICKET_CREATED',
      newValue: 'OPEN',
      metadata: {
        ticketNumber: ticket.ticketNumber,
        title: ticket.title,
        priority: ticket.priority,
        category: ticket.category
      },
      createdAt
    });

    return await ticket.populate('createdBy', 'name email department role');
  }

  /**
   * Retrieve paginated list of tickets with search, filtering, and role-based ownership scoping
   */
  async getTickets(user, queryParams = {}) {
    const filter = {};

    // 1. Authoritative Role Ownership Filter
    if (user.role === 'EMPLOYEE') {
      // Employees strictly see ONLY tickets they personally created (even when searching or filtering)
      filter.createdBy = user._id;
    } else if (user.role === 'SUPPORT_AGENT') {
      // Support Agents can filter for assignedToMe, unassigned, or all accessible
      if (queryParams.view === 'assigned') {
        filter.assignedTo = user._id;
      } else if (queryParams.view === 'unassigned') {
        filter.assignedTo = null;
      } else if (queryParams.assignedTo) {
        filter.assignedTo = queryParams.assignedTo;
      }
    } else if (user.role === 'ADMIN') {
      if (queryParams.assignedTo) {
        filter.assignedTo = queryParams.assignedTo;
      }
      if (queryParams.createdBy) {
        filter.createdBy = queryParams.createdBy;
      }
    }

    // 2. Full Search across Ticket Number, Title, and Description
    if (queryParams.search && queryParams.search.trim()) {
      const searchRegex = new RegExp(queryParams.search.trim(), 'i');
      filter.$or = [
        { ticketNumber: searchRegex },
        { title: searchRegex },
        { description: searchRegex }
      ];
    }

    // 3. Composable Exact Match Filters
    if (queryParams.status) {
      filter.status = queryParams.status.toUpperCase().trim();
    }
    if (queryParams.priority) {
      filter.priority = queryParams.priority.toUpperCase().trim();
    }
    if (queryParams.category) {
      filter.category = queryParams.category.trim();
    }
    if (queryParams.department && user.role !== 'EMPLOYEE') {
      filter.department = queryParams.department.trim();
    }

    // 4. Date Range Filters
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

    // 5. Server-Side Pagination
    const page = Math.max(1, parseInt(queryParams.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(queryParams.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const totalTickets = await Ticket.countDocuments(filter);
    const totalPages = Math.ceil(totalTickets / limit) || 1;

    const tickets = await Ticket.find(filter)
      .populate('createdBy', 'name email department role')
      .populate('assignedTo', 'name email department role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return {
      tickets,
      pagination: {
        page,
        limit,
        totalTickets,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  }

  /**
   * Retrieve ticket details with ownership security check
   */
  async getTicketById(user, idOrNumber) {
    const ticket = await this.findTicketByIdOrNumber(idOrNumber);

    // Strict Ownership Enforcement: Employee A cannot view Employee B's ticket!
    if (
      user.role === 'EMPLOYEE' &&
      ticket.createdBy._id.toString() !== user._id.toString()
    ) {
      throw AppError.forbidden(
        'Access denied. You do not have permission to view this ticket.'
      );
    }

    return ticket;
  }

  /**
   * Update allowed ticket information
   */
  async updateTicket(user, idOrNumber, updateData) {
    const ticket = await this.findTicketByIdOrNumber(idOrNumber);

    // Permissions check
    if (user.role === 'EMPLOYEE') {
      if (ticket.createdBy._id.toString() !== user._id.toString()) {
        throw AppError.forbidden('Access denied. You cannot edit another employee\'s ticket.');
      }
      if (ticket.status !== 'OPEN') {
        throw AppError.badRequest('Employees may only modify tickets while in OPEN status.');
      }

      // Employees may only modify title and description
      if (updateData.title) ticket.title = updateData.title.trim();
      if (updateData.description) ticket.description = updateData.description.trim();
    } else {
      // Agent & Admin modifications
      if (updateData.title) ticket.title = updateData.title.trim();
      if (updateData.description) ticket.description = updateData.description.trim();
      if (updateData.category) ticket.category = updateData.category;

      if (updateData.priority && updateData.priority !== ticket.priority) {
        const oldPriority = ticket.priority;
        ticket.priority = updateData.priority;
        ticket.slaDeadline = calculateSlaDeadline(ticket.createdAt, updateData.priority);

        await AuditLog.create({
          ticketId: ticket._id,
          userId: user._id,
          action: 'PRIORITY_CHANGED',
          oldValue: oldPriority,
          newValue: updateData.priority,
          metadata: { note: 'Priority updated' }
        });
      }
    }

    await ticket.save();
    return ticket;
  }

  /**
   * Delete ticket (Admin only, or Employee if ticket is unassigned OPEN)
   */
  async deleteTicket(user, idOrNumber) {
    const ticket = await this.findTicketByIdOrNumber(idOrNumber);

    if (user.role === 'EMPLOYEE') {
      if (ticket.createdBy._id.toString() !== user._id.toString()) {
        throw AppError.forbidden('Access denied. You cannot delete this ticket.');
      }
      if (ticket.status !== 'OPEN' || ticket.assignedTo !== null) {
        throw AppError.badRequest('Employees can only delete their own tickets while OPEN and unassigned.');
      }
    } else if (user.role !== 'ADMIN') {
      throw AppError.forbidden('Only Administrators can delete tickets.');
    }

    await Ticket.deleteOne({ _id: ticket._id });

    return { ticketNumber: ticket.ticketNumber, deleted: true };
  }

  /**
   * Assign or claim ticket (Support Agent or Admin)
   */
  async assignTicket(user, idOrNumber, { agentId }) {
    const ticket = await this.findTicketByIdOrNumber(idOrNumber);

    // Target assignment ID: either explicitly supplied, or agent claiming for self
    const targetUserId = agentId || user._id;

    const targetAgent = await User.findById(targetUserId);
    if (!targetAgent || !targetAgent.isActive) {
      throw AppError.badRequest('Target agent does not exist or is inactive.');
    }

    if (!['SUPPORT_AGENT', 'ADMIN'].includes(targetAgent.role)) {
      throw AppError.badRequest('Tickets can only be assigned to Support Agents or Administrators.');
    }

    // Role check: Support Agents can claim for themselves; only Admins can assign to arbitrary agents
    if (user.role === 'SUPPORT_AGENT' && targetUserId.toString() !== user._id.toString()) {
      throw AppError.forbidden('Support Agents can only claim tickets for themselves.');
    }

    const previousAgentName = ticket.assignedTo ? ticket.assignedTo.name : 'Unassigned';

    ticket.assignedTo = targetAgent._id;

    // If ticket is currently OPEN, auto-transition to ASSIGNED
    const previousStatus = ticket.status;
    if (ticket.status === 'OPEN') {
      ticket.status = 'ASSIGNED';
    }

    await ticket.save();

    // Log assignment audit event
    await AuditLog.create({
      ticketId: ticket._id,
      userId: user._id,
      action: 'TICKET_ASSIGNED',
      oldValue: previousAgentName,
      newValue: targetAgent.name,
      metadata: {
        assignedToId: targetAgent._id,
        autoStatusTransition: previousStatus !== ticket.status ? `${previousStatus} -> ${ticket.status}` : null
      }
    });

    return await this.findTicketByIdOrNumber(ticket._id);
  }

  /**
   * Transition ticket status following state machine rules
   */
  async updateStatus(user, idOrNumber, { status, note }) {
    if (!status) {
      throw AppError.badRequest('Proposed new status is required.');
    }

    const normalizedStatus = status.toUpperCase().trim();
    const ticket = await this.findTicketByIdOrNumber(idOrNumber);

    // Validate lifecycle transition using state machine
    assertValidTransition(ticket.status, normalizedStatus, user.role);

    const oldStatus = ticket.status;
    ticket.status = normalizedStatus;

    await ticket.save();

    await AuditLog.create({
      ticketId: ticket._id,
      userId: user._id,
      action: 'STATUS_CHANGED',
      oldValue: oldStatus,
      newValue: normalizedStatus,
      metadata: { note: note || null }
    });

    return await this.findTicketByIdOrNumber(ticket._id);
  }

  /**
   * Update priority and recalculate SLA deadline
   */
  async updatePriority(user, idOrNumber, { priority }) {
    if (!priority) {
      throw AppError.badRequest('New priority is required.');
    }

    const normalizedPriority = priority.toUpperCase().trim();
    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    if (!validPriorities.includes(normalizedPriority)) {
      throw AppError.badRequest(`Invalid priority: '${priority}'. Must be one of [${validPriorities.join(', ')}].`);
    }

    const ticket = await this.findTicketByIdOrNumber(idOrNumber);

    if (ticket.priority === normalizedPriority) {
      return ticket;
    }

    const oldPriority = ticket.priority;
    ticket.priority = normalizedPriority;
    ticket.slaDeadline = calculateSlaDeadline(ticket.createdAt, normalizedPriority);

    await ticket.save();

    await AuditLog.create({
      ticketId: ticket._id,
      userId: user._id,
      action: 'PRIORITY_CHANGED',
      oldValue: oldPriority,
      newValue: normalizedPriority,
      metadata: { newSlaDeadline: ticket.slaDeadline }
    });

    return await this.findTicketByIdOrNumber(ticket._id);
  }

  /**
   * Resolve ticket with required resolution notes
   */
  async resolveTicket(user, idOrNumber, { notes }) {
    if (!notes || !notes.trim()) {
      throw AppError.badRequest('Resolution notes are required to resolve an incident.');
    }

    const ticket = await this.findTicketByIdOrNumber(idOrNumber);

    if (ticket.status === 'CLOSED') {
      throw AppError.badRequest('Closed tickets cannot be resolved.');
    }

    const oldStatus = ticket.status;
    const resolvedAt = new Date();

    ticket.status = 'RESOLVED';
    ticket.resolution = {
      notes: notes.trim(),
      resolvedAt,
      resolvedBy: user._id
    };

    await ticket.save();

    await AuditLog.create({
      ticketId: ticket._id,
      userId: user._id,
      action: 'TICKET_RESOLVED',
      oldValue: oldStatus,
      newValue: 'RESOLVED',
      metadata: { notes: notes.trim() }
    });

    return await this.findTicketByIdOrNumber(ticket._id);
  }

  /**
   * Close resolved ticket (Employee confirms resolution or Admin closes)
   */
  async closeTicket(user, idOrNumber) {
    const ticket = await this.findTicketByIdOrNumber(idOrNumber);

    // Permission check
    if (user.role === 'EMPLOYEE') {
      if (ticket.createdBy._id.toString() !== user._id.toString()) {
        throw AppError.forbidden('Access denied. You can only confirm closure of your own tickets.');
      }
    }

    if (ticket.status !== 'RESOLVED') {
      throw AppError.badRequest(`Only RESOLVED tickets can be closed. Current status is '${ticket.status}'.`);
    }

    ticket.status = 'CLOSED';
    ticket.closedAt = new Date();
    ticket.closedBy = user._id;

    await ticket.save();

    await AuditLog.create({
      ticketId: ticket._id,
      userId: user._id,
      action: 'TICKET_CLOSED',
      oldValue: 'RESOLVED',
      newValue: 'CLOSED',
      metadata: { closedByRole: user.role }
    });

    return await this.findTicketByIdOrNumber(ticket._id);
  }

  /**
   * Reopen resolved ticket
   */
  async reopenTicket(user, idOrNumber, { reason }) {
    if (!reason || !reason.trim()) {
      throw AppError.badRequest('Please provide a reason for reopening this ticket.');
    }

    const ticket = await this.findTicketByIdOrNumber(idOrNumber);

    // Permission check
    if (user.role === 'EMPLOYEE') {
      if (ticket.createdBy._id.toString() !== user._id.toString()) {
        throw AppError.forbidden('Access denied. You can only reopen your own tickets.');
      }
    }

    if (ticket.status !== 'RESOLVED') {
      throw AppError.badRequest(`Only RESOLVED tickets can be reopened. Current status is '${ticket.status}'.`);
    }

    const oldStatus = ticket.status;
    const reopenedAt = new Date();

    ticket.status = 'IN_PROGRESS';
    ticket.reopenedAt = reopenedAt;
    ticket.reopenReason = reason.trim();

    await ticket.save();

    await AuditLog.create({
      ticketId: ticket._id,
      userId: user._id,
      action: 'TICKET_REOPENED',
      oldValue: oldStatus,
      newValue: 'IN_PROGRESS',
      metadata: { reason: reason.trim() }
    });

    return await this.findTicketByIdOrNumber(ticket._id);
  }
}

module.exports = new TicketService();

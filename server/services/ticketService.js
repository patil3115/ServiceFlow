const mongoose = require('mongoose');
const { Ticket, Category, AuditLog, User } = require('../models');
const { generateTicketNumber } = require('../utils/ticketNumberGenerator');
const { calculateSlaDeadline } = require('../utils/slaCalculator');
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
   * Retrieve list of tickets respecting strict role-based ownership
   */
  async getTickets(user, queryParams = {}) {
    const filter = {};

    // 1. Authoritative Role Ownership Filter
    if (user.role === 'EMPLOYEE') {
      // Employees strictly see ONLY tickets they personally created
      filter.createdBy = user._id;
    } else if (user.role === 'SUPPORT_AGENT') {
      // Support Agents can filter for assignedToMe, unassigned, or all accessible
      if (queryParams.view === 'assigned') {
        filter.assignedTo = user._id;
      } else if (queryParams.view === 'unassigned') {
        filter.assignedTo = null;
      }
      // Otherwise agent sees organizational tickets
    }
    // Administrators have unrestricted access

    // 2. Composable Filters
    if (queryParams.status) {
      filter.status = queryParams.status.toUpperCase();
    }
    if (queryParams.priority) {
      filter.priority = queryParams.priority.toUpperCase();
    }
    if (queryParams.category) {
      filter.category = queryParams.category;
    }
    if (queryParams.assignedTo && user.role !== 'EMPLOYEE') {
      filter.assignedTo = queryParams.assignedTo;
    }

    const tickets = await Ticket.find(filter)
      .populate('createdBy', 'name email department role')
      .populate('assignedTo', 'name email department role')
      .sort({ createdAt: -1 });

    return tickets;
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
        // Recalculate SLA deadline based on original creation timestamp
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
}

module.exports = new TicketService();

const { Ticket, User, Category } = require('../models');
const { getSlaMetrics } = require('../utils/slaCalculator');

class DashboardService {
  /**
   * Employee Dashboard Metrics & Workload
   */
  async getEmployeeDashboard(userId) {
    const now = new Date();

    const [
      totalTickets,
      openTickets,
      inProgressTickets,
      pendingTickets,
      resolvedTickets,
      closedTickets,
      recentTicketsRaw
    ] = await Promise.all([
      Ticket.countDocuments({ createdBy: userId }),
      Ticket.countDocuments({ createdBy: userId, status: 'OPEN' }),
      Ticket.countDocuments({ createdBy: userId, status: 'IN_PROGRESS' }),
      Ticket.countDocuments({ createdBy: userId, status: 'PENDING' }),
      Ticket.countDocuments({ createdBy: userId, status: 'RESOLVED' }),
      Ticket.countDocuments({ createdBy: userId, status: 'CLOSED' }),
      Ticket.find({ createdBy: userId })
        .populate('assignedTo', 'name email role department')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean()
    ]);

    // Attach live SLA metrics to recent tickets
    const recentTickets = recentTicketsRaw.map((t) => ({
      ...t,
      slaMetrics: getSlaMetrics(t.slaDeadline, t.status, t.resolution?.resolvedAt)
    }));

    return {
      role: 'EMPLOYEE',
      metrics: {
        totalTickets,
        open: openTickets,
        inProgress: inProgressTickets,
        pending: pendingTickets,
        resolved: resolvedTickets,
        closed: closedTickets
      },
      recentTickets
    };
  }

  /**
   * Support Agent Dashboard Metrics & Workload
   */
  async getAgentDashboard(agentId) {
    const now = new Date();

    const [
      myAssignedTotal,
      myAssignedOpen,
      myAssignedInProgress,
      myAssignedPending,
      myAssignedResolved,
      myHighPriority,
      myCriticalPriority,
      unassignedQueueCount,
      slaBreachedCount,
      urgentAssignedRaw,
      unassignedQueueRaw
    ] = await Promise.all([
      Ticket.countDocuments({ assignedTo: agentId }),
      Ticket.countDocuments({ assignedTo: agentId, status: 'ASSIGNED' }),
      Ticket.countDocuments({ assignedTo: agentId, status: 'IN_PROGRESS' }),
      Ticket.countDocuments({ assignedTo: agentId, status: 'PENDING' }),
      Ticket.countDocuments({ assignedTo: agentId, status: 'RESOLVED' }),
      Ticket.countDocuments({
        assignedTo: agentId,
        priority: 'HIGH',
        status: { $nin: ['RESOLVED', 'CLOSED'] }
      }),
      Ticket.countDocuments({
        assignedTo: agentId,
        priority: 'CRITICAL',
        status: { $nin: ['RESOLVED', 'CLOSED'] }
      }),
      Ticket.countDocuments({ assignedTo: null, status: 'OPEN' }),
      Ticket.countDocuments({
        assignedTo: agentId,
        status: { $nin: ['RESOLVED', 'CLOSED'] },
        slaDeadline: { $lt: now }
      }),
      // Urgent active workload
      Ticket.find({
        assignedTo: agentId,
        status: { $nin: ['RESOLVED', 'CLOSED'] }
      })
        .populate('createdBy', 'name email department')
        .sort({ slaDeadline: 1 })
        .limit(5)
        .lean(),
      // Unassigned tickets waiting to be claimed
      Ticket.find({ assignedTo: null, status: 'OPEN' })
        .populate('createdBy', 'name email department')
        .sort({ createdAt: 1 })
        .limit(5)
        .lean()
    ]);

    const urgentAssigned = urgentAssignedRaw.map((t) => ({
      ...t,
      slaMetrics: getSlaMetrics(t.slaDeadline, t.status, t.resolution?.resolvedAt)
    }));

    const unassignedQueue = unassignedQueueRaw.map((t) => ({
      ...t,
      slaMetrics: getSlaMetrics(t.slaDeadline, t.status, t.resolution?.resolvedAt)
    }));

    return {
      role: 'SUPPORT_AGENT',
      metrics: {
        assignedTickets: myAssignedTotal,
        inProgress: myAssignedInProgress,
        pending: myAssignedPending,
        resolved: myAssignedResolved,
        assignedOpen: myAssignedOpen,
        highPriority: myHighPriority,
        criticalPriority: myCriticalPriority,
        unassignedQueueCount,
        slaBreachedCount
      },
      urgentAssigned,
      unassignedQueue
    };
  }

  /**
   * System-wide Administrator Dashboard Analytics
   */
  async getAdminDashboard() {
    const now = new Date();

    const [
      totalUsers,
      totalEmployees,
      totalAgents,
      totalAdmins,
      activeUsers,
      totalTickets,
      openTickets,
      assignedTickets,
      inProgressTickets,
      pendingTickets,
      resolvedTickets,
      closedTickets,
      criticalTickets,
      slaBreachedTickets,
      categoryDistributionRaw,
      recentTicketsRaw
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'EMPLOYEE' }),
      User.countDocuments({ role: 'SUPPORT_AGENT' }),
      User.countDocuments({ role: 'ADMIN' }),
      User.countDocuments({ isActive: true }),
      Ticket.countDocuments(),
      Ticket.countDocuments({ status: 'OPEN' }),
      Ticket.countDocuments({ status: 'ASSIGNED' }),
      Ticket.countDocuments({ status: 'IN_PROGRESS' }),
      Ticket.countDocuments({ status: 'PENDING' }),
      Ticket.countDocuments({ status: 'RESOLVED' }),
      Ticket.countDocuments({ status: 'CLOSED' }),
      Ticket.countDocuments({
        priority: 'CRITICAL',
        status: { $nin: ['RESOLVED', 'CLOSED'] }
      }),
      Ticket.countDocuments({
        status: { $nin: ['RESOLVED', 'CLOSED'] },
        slaDeadline: { $lt: now }
      }),
      // Aggregation: count tickets grouped by category
      Ticket.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Ticket.find()
        .populate('createdBy', 'name email department')
        .populate('assignedTo', 'name email')
        .sort({ createdAt: -1 })
        .limit(6)
        .lean()
    ]);

    const recentTickets = recentTicketsRaw.map((t) => ({
      ...t,
      slaMetrics: getSlaMetrics(t.slaDeadline, t.status, t.resolution?.resolvedAt)
    }));

    const categoryDistribution = categoryDistributionRaw.map((c) => ({
      category: c._id || 'Uncategorized',
      count: c.count
    }));

    return {
      role: 'ADMIN',
      userStats: {
        totalUsers,
        totalEmployees,
        totalAgents,
        totalAdmins,
        activeUsers
      },
      ticketStats: {
        totalTickets,
        open: openTickets,
        assigned: assignedTickets,
        inProgress: inProgressTickets,
        pending: pendingTickets,
        resolved: resolvedTickets,
        closed: closedTickets,
        critical: criticalTickets,
        slaBreached: slaBreachedTickets
      },
      categoryDistribution,
      recentTickets
    };
  }
}

module.exports = new DashboardService();

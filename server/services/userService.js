const mongoose = require('mongoose');
const { User, Ticket, AuditLog } = require('../models');
const AppError = require('../utils/appError');

class UserService {
  /**
   * Retrieve paginated, filterable list of users (Admin only)
   */
  async getAllUsers(queryParams = {}) {
    const filter = {};

    // 1. Keyword search (name, email, department)
    if (queryParams.search && queryParams.search.trim() !== '') {
      const searchRegex = new RegExp(queryParams.search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { department: searchRegex }
      ];
    }

    // 2. Role filter
    if (queryParams.role) {
      const roleUpper = queryParams.role.toUpperCase();
      if (['EMPLOYEE', 'SUPPORT_AGENT', 'ADMIN'].includes(roleUpper)) {
        filter.role = roleUpper;
      }
    }

    // 3. Status filter
    if (queryParams.isActive !== undefined && queryParams.isActive !== '') {
      if (typeof queryParams.isActive === 'boolean') {
        filter.isActive = queryParams.isActive;
      } else if (typeof queryParams.isActive === 'string') {
        filter.isActive = queryParams.isActive.toLowerCase() === 'true';
      }
    }

    // 4. Department filter
    if (queryParams.department && queryParams.department.trim() !== '') {
      filter.department = new RegExp(`^${queryParams.department.trim()}$`, 'i');
    }

    // 5. Pagination
    const page = Math.max(1, parseInt(queryParams.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(queryParams.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const totalUsers = await User.countDocuments(filter);
    const totalPages = Math.ceil(totalUsers / limit) || 1;

    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return {
      users,
      pagination: {
        page,
        limit,
        totalUsers,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  }

  /**
   * Get single user by ID with summary activity telemetry
   */
  async getUserById(userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw AppError.badRequest('Invalid user ID format');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw AppError.notFound(`User with ID ${userId} not found`);
    }

    // Aggregate incident activity statistics
    const [ticketsCreatedCount, ticketsAssignedCount] = await Promise.all([
      Ticket.countDocuments({ createdBy: user._id }),
      Ticket.countDocuments({ assignedTo: user._id })
    ]);

    return {
      user,
      activity: {
        ticketsCreatedCount,
        ticketsAssignedCount
      }
    };
  }

  /**
   * Update user role with critical last-admin safeguard and audit trail
   */
  async updateUserRole(adminUser, userId, newRole) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw AppError.badRequest('Invalid user ID format');
    }

    const validRoles = ['EMPLOYEE', 'SUPPORT_AGENT', 'ADMIN'];
    const roleUpper = (newRole || '').toUpperCase();
    if (!validRoles.includes(roleUpper)) {
      throw AppError.badRequest(
        `Invalid role: "${newRole}". Must be one of: ${validRoles.join(', ')}`
      );
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      throw AppError.notFound(`User with ID ${userId} not found`);
    }

    const oldRole = targetUser.role;
    if (oldRole === roleUpper) {
      return targetUser;
    }

    // Critical Safeguard: Prevent demoting the last active administrator
    if (oldRole === 'ADMIN' && roleUpper !== 'ADMIN') {
      const activeAdminCount = await User.countDocuments({
        role: 'ADMIN',
        isActive: true
      });

      if (activeAdminCount <= 1) {
        throw AppError.badRequest(
          'Cannot demote the last active administrator. ServiceFlow requires at least one active administrator.'
        );
      }
    }

    targetUser.role = roleUpper;
    await targetUser.save();

    // Record immutable audit trail
    await AuditLog.create({
      userId: adminUser._id,
      action: 'USER_ROLE_CHANGED',
      oldValue: oldRole,
      newValue: roleUpper,
      metadata: {
        targetUserId: targetUser._id,
        targetUserName: targetUser.name,
        targetUserEmail: targetUser.email
      }
    });

    return targetUser;
  }

  /**
   * Update user status (active/inactive) with last-admin safeguard and audit trail
   */
  async updateUserStatus(adminUser, userId, isActive) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw AppError.badRequest('Invalid user ID format');
    }

    const boolStatus = typeof isActive === 'boolean'
      ? isActive
      : String(isActive).toLowerCase() === 'true';

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      throw AppError.notFound(`User with ID ${userId} not found`);
    }

    const oldStatus = targetUser.isActive;
    if (oldStatus === boolStatus) {
      return targetUser;
    }

    // Critical Safeguard: Prevent deactivating the last active administrator
    if (targetUser.role === 'ADMIN' && !boolStatus) {
      const activeAdminCount = await User.countDocuments({
        role: 'ADMIN',
        isActive: true
      });

      if (activeAdminCount <= 1) {
        throw AppError.badRequest(
          'Cannot deactivate the last active administrator. ServiceFlow requires at least one active administrator.'
        );
      }
    }

    targetUser.isActive = boolStatus;
    await targetUser.save();

    // Record immutable audit trail
    await AuditLog.create({
      userId: adminUser._id,
      action: 'USER_STATUS_CHANGED',
      oldValue: oldStatus ? 'ACTIVE' : 'DEACTIVATED',
      newValue: boolStatus ? 'ACTIVE' : 'DEACTIVATED',
      metadata: {
        targetUserId: targetUser._id,
        targetUserName: targetUser.name,
        targetUserEmail: targetUser.email
      }
    });

    return targetUser;
  }
}

module.exports = new UserService();

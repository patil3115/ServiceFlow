const AppError = require('./appError');

const TICKET_STATUS = {
  OPEN: 'OPEN',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  PENDING: 'PENDING',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED'
};

/**
 * State Machine Transition Matrix
 * Enforces valid ITSM ticket lifecycle progressions and prevents arbitrary jumps.
 */
const VALID_TRANSITIONS = {
  [TICKET_STATUS.OPEN]: [TICKET_STATUS.ASSIGNED],
  [TICKET_STATUS.ASSIGNED]: [TICKET_STATUS.IN_PROGRESS, TICKET_STATUS.ASSIGNED], // reassignments allowed
  [TICKET_STATUS.IN_PROGRESS]: [TICKET_STATUS.PENDING, TICKET_STATUS.RESOLVED],
  [TICKET_STATUS.PENDING]: [TICKET_STATUS.IN_PROGRESS, TICKET_STATUS.RESOLVED],
  [TICKET_STATUS.RESOLVED]: [TICKET_STATUS.CLOSED, TICKET_STATUS.IN_PROGRESS], // confirmation or reopen
  [TICKET_STATUS.CLOSED]: [] // Terminal state
};

/**
 * Validate whether a status transition is permitted according to business rules
 *
 * @param {string} currentStatus - Current ticket status
 * @param {string} nextStatus - Proposed next status
 * @param {string} userRole - Performing user role ('ADMIN', 'SUPPORT_AGENT', 'EMPLOYEE')
 * @returns {boolean}
 */
const isValidTransition = (currentStatus, nextStatus, userRole = 'EMPLOYEE') => {
  if (currentStatus === nextStatus) return true;

  // Administrators have emergency override authority except modifying closed tickets without reopening
  if (userRole === 'ADMIN' && currentStatus !== TICKET_STATUS.CLOSED) {
    return true;
  }

  const allowedNextStatuses = VALID_TRANSITIONS[currentStatus] || [];
  return allowedNextStatuses.includes(nextStatus);
};

/**
 * Assert transition or throw descriptive AppError
 */
const assertValidTransition = (currentStatus, nextStatus, userRole = 'EMPLOYEE') => {
  if (!isValidTransition(currentStatus, nextStatus, userRole)) {
    const validTargets = VALID_TRANSITIONS[currentStatus] || [];
    const validStr = validTargets.length > 0 ? validTargets.join(', ') : 'None (Terminal state)';
    throw AppError.badRequest(
      `Invalid ticket status transition: Cannot transition from '${currentStatus}' to '${nextStatus}'. Permitted next state(s): [${validStr}].`
    );
  }
};

module.exports = {
  TICKET_STATUS,
  VALID_TRANSITIONS,
  isValidTransition,
  assertValidTransition
};

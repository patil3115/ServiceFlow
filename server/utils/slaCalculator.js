/**
 * Service Level Agreement (SLA) Duration Rules (in hours)
 */
const SLA_DURATIONS_HOURS = {
  CRITICAL: 2,
  HIGH: 4,
  MEDIUM: 8,
  LOW: 24
};

/**
 * Calculate the exact SLA deadline date based on creation timestamp and priority
 *
 * @param {Date|string|number} createdAt - Ticket creation timestamp
 * @param {string} priority - Ticket priority ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')
 * @returns {Date} Calculated SLA deadline Date
 */
const calculateSlaDeadline = (createdAt = new Date(), priority = 'MEDIUM') => {
  const createdDate = new Date(createdAt);
  const durationHours = SLA_DURATIONS_HOURS[priority] || SLA_DURATIONS_HOURS.MEDIUM;
  return new Date(createdDate.getTime() + durationHours * 60 * 60 * 1000);
};

/**
 * Assess live SLA compliance state for a ticket
 *
 * @param {Date|string} slaDeadline - Ticket SLA deadline
 * @param {string} status - Ticket current status
 * @param {Date|string|null} resolvedAt - Resolution timestamp if resolved
 * @returns {Object} SLA status metrics
 */
const getSlaMetrics = (slaDeadline, status, resolvedAt = null) => {
  const now = new Date();
  const deadline = new Date(slaDeadline);

  // If resolved or closed, measure compliance at the time of resolution
  if (['RESOLVED', 'CLOSED'].includes(status) && resolvedAt) {
    const resolvedTime = new Date(resolvedAt);
    const isBreached = resolvedTime > deadline;
    const diffMs = Math.abs(resolvedTime - deadline);
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    return {
      isBreached,
      statusText: isBreached ? 'RESOLVED_BREACHED' : 'RESOLVED_WITHIN_SLA',
      diffMinutes
    };
  }

  // Active / in-flight ticket calculation
  const isBreached = now > deadline;
  const diffMs = Math.abs(now - deadline);
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  return {
    isBreached,
    statusText: isBreached ? 'SLA_BREACHED' : 'WITHIN_SLA',
    diffMinutes,
    remainingMs: isBreached ? 0 : diffMs,
    exceededMs: isBreached ? diffMs : 0
  };
};

module.exports = {
  SLA_DURATIONS_HOURS,
  calculateSlaDeadline,
  getSlaMetrics
};

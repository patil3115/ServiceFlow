const { Ticket } = require('../models');

/**
 * Generate sequential, human-friendly ticket numbers (e.g. INC-1001, INC-1002).
 * Uses MongoDB numeric collation to reliably find the highest existing ticket sequence.
 *
 * @returns {Promise<string>} Next ticket number formatted as 'INC-XXXX'
 */
const generateTicketNumber = async () => {
  // Use numericOrdering: true collation to ensure INC-1010 sorts after INC-1009 and INC-1002
  const lastTicket = await Ticket.findOne({ ticketNumber: /^INC-\d+$/ })
    .collation({ locale: 'en_US', numericOrdering: true })
    .sort({ ticketNumber: -1 })
    .lean();

  if (!lastTicket || !lastTicket.ticketNumber) {
    return 'INC-1001';
  }

  // Extract numeric digits from 'INC-XXXX'
  const match = lastTicket.ticketNumber.match(/INC-(\d+)/i);
  if (!match) {
    return 'INC-1001';
  }

  let nextNum = parseInt(match[1], 10) + 1;
  let candidate = `INC-${nextNum}`;

  // Collision guard in case of race condition or gaps
  while (await Ticket.exists({ ticketNumber: candidate })) {
    nextNum += 1;
    candidate = `INC-${nextNum}`;
  }

  return candidate;
};

module.exports = {
  generateTicketNumber
};

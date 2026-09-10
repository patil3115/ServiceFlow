const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// All ticket routes require authentication
router.use(protect);

router
  .route('/')
  .post(ticketController.createTicket)
  .get(ticketController.getTickets);

// Specific action routes
router.put('/:id/assign', authorize('SUPPORT_AGENT', 'ADMIN'), ticketController.assignTicket);
router.put('/:id/status', authorize('SUPPORT_AGENT', 'ADMIN'), ticketController.updateStatus);
router.put('/:id/priority', authorize('SUPPORT_AGENT', 'ADMIN'), ticketController.updatePriority);
router.put('/:id/resolve', authorize('SUPPORT_AGENT', 'ADMIN'), ticketController.resolveTicket);
router.put('/:id/close', authorize('EMPLOYEE', 'ADMIN'), ticketController.closeTicket);
router.put('/:id/reopen', authorize('EMPLOYEE', 'ADMIN'), ticketController.reopenTicket);

router
  .route('/:id')
  .get(ticketController.getTicketById)
  .put(ticketController.updateTicket)
  .delete(ticketController.deleteTicket);

module.exports = router;

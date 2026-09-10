const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { protect } = require('../middleware/authMiddleware');

// All ticket routes require authentication
router.use(protect);

router
  .route('/')
  .post(ticketController.createTicket)
  .get(ticketController.getTickets);

router
  .route('/:id')
  .get(ticketController.getTicketById)
  .put(ticketController.updateTicket)
  .delete(ticketController.deleteTicket);

module.exports = router;

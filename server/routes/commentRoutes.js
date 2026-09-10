const express = require('express');
// mergeParams preserves req.params from parent router (i.e. :ticketId)
const router = express.Router({ mergeParams: true });
const commentController = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');

// All comment routes require authentication
router.use(protect);

router
  .route('/')
  .post(commentController.addComment)
  .get(commentController.getComments);

module.exports = router;

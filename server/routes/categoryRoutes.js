const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Routes: /api/categories
router
  .route('/')
  .get(protect, categoryController.getCategories)
  .post(protect, authorize('ADMIN'), categoryController.createCategory);

router
  .route('/:id')
  .get(protect, categoryController.getCategoryById)
  .put(protect, authorize('ADMIN'), categoryController.updateCategory);

module.exports = router;

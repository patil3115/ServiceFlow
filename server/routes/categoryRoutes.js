const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

// Routes: /api/categories
router
  .route('/')
  .get(categoryController.getCategories)
  .post(categoryController.createCategory); // In Phase 5 roleMiddleware will guard this to ADMIN

router
  .route('/:id')
  .get(categoryController.getCategoryById)
  .put(categoryController.updateCategory); // In Phase 5 roleMiddleware will guard this to ADMIN

module.exports = router;

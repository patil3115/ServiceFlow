const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// All dashboard endpoints require authentication
router.use(protect);

// Auto-detected role dashboard
router.get('/', dashboardController.getDashboard);

// Role-restricted deep dive views
router.get('/agent', authorize('SUPPORT_AGENT', 'ADMIN'), dashboardController.getAgentDashboard);
router.get('/admin', authorize('ADMIN'), dashboardController.getAdminDashboard);

module.exports = router;

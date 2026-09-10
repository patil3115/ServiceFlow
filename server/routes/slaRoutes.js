const express = require('express');
const router = express.Router();
const slaController = require('../controllers/slaController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

// SLA organizational analytics report
router.get('/report', authorize('SUPPORT_AGENT', 'ADMIN'), slaController.getSlaReport);

// Trigger on-demand breach evaluation
router.post('/sync', authorize('ADMIN'), slaController.syncBreaches);

module.exports = router;

const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// System-wide audit logs are restricted to Administrators
router.use(protect);
router.use(authorize('ADMIN'));

router.get('/', auditController.getSystemAuditLogs);

module.exports = router;

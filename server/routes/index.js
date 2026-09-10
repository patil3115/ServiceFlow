const express = require('express');
const router = express.Router();

const categoryRoutes = require('./categoryRoutes');
const authRoutes = require('./authRoutes');
const ticketRoutes = require('./ticketRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const auditRoutes = require('./auditRoutes');
const slaRoutes = require('./slaRoutes');
const userRoutes = require('./userRoutes');

// Mount sub-routers
router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/tickets', ticketRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/audit-logs', auditRoutes);
router.use('/sla', slaRoutes);
router.use('/users', userRoutes);

// Informative index route for /api
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'ServiceFlow Enterprise API v1.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      tickets: '/api/tickets',
      comments: '/api/tickets/:id/comments',
      categories: '/api/categories',
      users: '/api/users'
    }
  });
});

module.exports = router;

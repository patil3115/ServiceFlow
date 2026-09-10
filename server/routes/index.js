const express = require('express');
const router = express.Router();

const categoryRoutes = require('./categoryRoutes');
const authRoutes = require('./authRoutes');
const ticketRoutes = require('./ticketRoutes');

// Mount sub-routers
router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/tickets', ticketRoutes);

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

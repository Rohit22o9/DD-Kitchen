const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const bookingRoutes = require('./bookingRoutes');
const storageRoutes = require('./storageRoutes');
const invoiceRoutes = require('./invoiceRoutes');
const adminRoutes = require('./adminRoutes');
const enquiryRoutes = require('./enquiryRoutes');

// Mount sub-routes
router.use('/auth', authRoutes);
router.use('/', bookingRoutes);
router.use('/', storageRoutes);
router.use('/', invoiceRoutes);
router.use('/', adminRoutes);
router.use('/', enquiryRoutes);

const mongoose = require('mongoose');

// Health check endpoint (verifies live MongoDB connectivity)
router.get('/health', (req, res) => {
  const dbReady = mongoose.connection.readyState === 1;
  const statusCode = dbReady ? 200 : 503;
  res.status(statusCode).json({
    status: dbReady ? 'healthy' : 'degraded',
    database: dbReady ? 'connected' : 'disconnected',
    service: 'Daily Drop Commercial Kitchen Rental API',
    engine: 'Node.js Express + MongoDB (MVC)',
    timezone: process.env.PERTH_TIMEZONE || 'Australia/Perth',
    facility: 'Unit 1, 1 Lichfield St, Victoria Park, Perth WA 6101',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;

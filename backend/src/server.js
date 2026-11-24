const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { connectDB } = require('./config/db');
const seedDatabase = require('./utils/seedData');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorMiddleware');

const app = express();
const PORT = process.env.PORT || 8000;

// Enable CORS for frontend clients
app.use(
  cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  })
);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Mount Master API Router
app.use('/api', routes);

// Root Welcome Endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Daily Drop Commercial Kitchen & Storage Management API',
    documentation: '/api/health',
    version: '1.0.0',
    engine: 'Node.js Express + MongoDB (MVC)',
    location: 'Victoria Park, Perth, WA 6101',
  });
});

// 404 Not Found Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Cannot ${req.method} ${req.originalUrl}. Route not found.`,
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

// Start Server and Database Connection
const startServer = async () => {
  try {
    await connectDB();
    await seedDatabase();

    const server = app.listen(PORT, () => {
      console.log('====================================================');
      console.log(' DAILY DROP COMMERCIAL KITCHEN API (NODE.JS + MONGODB)');
      console.log(` Server running on: http://localhost:${PORT}`);
      console.log(` Health check:      http://localhost:${PORT}/api/health`);
      console.log(` Architecture:      MVC (Model-View-Controller)`);
      console.log(` Perth Timezone:    ${process.env.PERTH_TIMEZONE || 'Australia/Perth'}`);
      console.log('====================================================');
    });

    return server;
  } catch (err) {
    console.error('Server startup failed:', err);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };

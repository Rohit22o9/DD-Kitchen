const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const { connectDB } = require('./config/db');
const seedDatabase = require('./utils/seedData');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorMiddleware');

const app = express();
const PORT = process.env.PORT || 8000;

// Security headers
app.use(helmet());

// CORS Allowlist
const defaultOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:4173'];
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
  : defaultOrigins;

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      // In local development, allow any localhost / 127.0.0.1 port (e.g. Vite 5173, 5174, etc.)
      if (
        process.env.NODE_ENV !== 'production' &&
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
      ) {
        return callback(null, true);
      }
      const corsErr = new Error(`Origin ${origin} is not allowed by CORS policy`);
      corsErr.statusCode = 403;
      return callback(corsErr);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  })
);

// Rate limiting on auth and booking mutations
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many authentication attempts. Please try again later.' },
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Please slow down.' },
});

app.use('/api/auth', authLimiter);
app.use('/api/admin/login', authLimiter);
app.use('/api/superadmin/login', authLimiter);
app.use('/api', apiLimiter);

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

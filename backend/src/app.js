const crypto = require('crypto');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const env = require('./config/env');
const routes = require('./routes');
const { globalLimiter } = require('./middlewares/rateLimiters');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');

const createApp = () => {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', env.trustProxy);

  app.use((req, res, next) => {
    req.id = crypto.randomUUID();
    res.setHeader('X-Request-Id', req.id);
    next();
  });

  app.use(helmet());
  app.use(
    cors({
      origin(origin, cb) {
        // Non-browser clients send no Origin header.
        if (!origin || env.corsOrigins.includes(origin)) return cb(null, true);
        return cb(null, false);
      },
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      maxAge: 600,
    })
  );
  // Bank statement CSVs can be larger than normal requests.
  app.use('/api/invoices/reconcile', express.json({ limit: '3mb' }));
  app.use(express.json({ limit: '100kb' }));

  if (!env.isTest) {
    morgan.token('id', (req) => req.id);
    app.use(morgan(env.isProd ? ':id :remote-addr :method :url :status :res[content-length] - :response-time ms' : 'dev'));
  }

  app.use('/api', globalLimiter, routes);
  app.get('/', (req, res) => res.json({ service: 'Daily Drop Kitchen API', health: '/api/health' }));
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
};

module.exports = { createApp };

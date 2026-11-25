const env = require('../config/env');
const logger = require('../utils/logger');

const notFoundHandler = (req, res) => {
  res.status(404).json({ success: false, error: 'Route not found.', request_id: req.id });
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let status = err.status || err.statusCode || 500;
  let message = err.expose ? err.message : 'Something went wrong on our side. Please try again.';
  let details = err.expose ? err.details : undefined;

  if (err.type === 'entity.too.large') {
    status = 413;
    message = 'Request is too large.';
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Request body is not valid JSON.';
  } else if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  } else if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid identifier.';
  } else if (err.code === 11000) {
    status = 409;
    message = 'That record already exists.';
  } else if (err.name === 'MulterError') {
    status = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'File is too large (max 5 MB).' : 'File upload failed.';
  }

  if (status >= 500) {
    logger.error(`[${req.id}] ${req.method} ${req.originalUrl}`, err);
  }

  const body = { success: false, error: message, request_id: req.id };
  if (details) body.details = details;
  if (!env.isProd && status >= 500) body.debug = err.message;
  res.status(status).json(body);
};

module.exports = { errorHandler, notFoundHandler };

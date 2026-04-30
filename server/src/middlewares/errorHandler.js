/**
 * Global Error Handler Middleware
 * FIX: Centralized error handling for consistency and security
 */

import { sendError } from '../utils/response.js';

/**
 * Global error handler middleware
 * Must be mounted AFTER all routes
 */
export const globalErrorHandler = (err, req, res, next) => {
  console.error('[Error Handler]', {
    message: err.message,
    status: err.status || 500,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Don't expose error details in production
  const isProd = process.env.NODE_ENV === 'production';
  const message = isProd ? 'Internal server error' : err.message;
  const status = err.status || 500;

  return sendError(res, message, status);
};

/**
 * 404 Not Found handler
 * Must be mounted AFTER all routes
 */
export const notFoundHandler = (req, res, next) => {
  return sendError(res, 'Route not found', 404);
};

/**
 * Async route wrapper to catch errors
 * Use this to wrap async route handlers
 * Example: router.get('/route', asyncHandler(async (req, res) => { ... }))
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

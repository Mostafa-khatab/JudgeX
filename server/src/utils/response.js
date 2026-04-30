/**
 * Response Utility - Standardized response format across the application
 */

export const sendSuccess = (res, data = null, message = 'Success', status = 200) => {
  return res.status(status).json({
    success: true,
    msg: message,
    data,
  });
};

export const sendError = (res, message = 'An error occurred', status = 400, additionalData = null) => {
  return res.status(status).json({
    success: false,
    msg: message,
    ...(additionalData && { data: additionalData }),
  });
};

/**
 * Wrapper for consistent error handling in catch blocks
 */
export const handleError = (res, error, context = '', defaultStatus = 400) => {
  console.error(`[ERROR] ${context}:`, error);

  // Determine if production mode
  const isProd = process.env.NODE_ENV === 'production';

  // Don't expose stack traces in production
  const message = isProd ? 'An error occurred' : error.message;
  const status = error.status || defaultStatus;

  return sendError(res, message, status);
};

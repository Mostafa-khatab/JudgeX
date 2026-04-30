/**
 * Audit Logging Middleware
 * Tracks sensitive operations for security and compliance
 */

export const auditLog = (action, resource) => {
  return (req, res, next) => {
    const originalJson = res.json;

    res.json = function (data) {
      // Only log successful sensitive operations
      if (data.success === true && res.statusCode < 400) {
        const logEntry = {
          timestamp: new Date().toISOString(),
          action,
          resource,
          userId: req.userId || 'anonymous',
          ip: req.ip || req.connection.remoteAddress,
          method: req.method,
          path: req.path,
          status: res.statusCode,
        };

        console.log('[AUDIT]', JSON.stringify(logEntry));
      }

      return originalJson.call(this, data);
    };

    next();
  };
};

/**
 * Sensitive Operations Audit Log Tracker
 */
export const sensitiveOperations = {
  AUTH_LOGIN: 'AUTH_LOGIN',
  AUTH_SIGNUP: 'AUTH_SIGNUP',
  AUTH_LOGOUT: 'AUTH_LOGOUT',
  PASSWORD_RESET: 'PASSWORD_RESET',
  EMAIL_VERIFY: 'EMAIL_VERIFY',
  INTERVIEW_CREATE: 'INTERVIEW_CREATE',
  INTERVIEW_DELETE: 'INTERVIEW_DELETE',
  SUBMISSION_CREATE: 'SUBMISSION_CREATE',
  USER_UPDATE: 'USER_UPDATE',
  ADMIN_ACTION: 'ADMIN_ACTION',
};

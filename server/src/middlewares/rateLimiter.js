/**
 * Rate Limiting Middleware
 * Prevents brute force attacks and abuse
 */

import rateLimit from 'express-rate-limit';
import {
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_LOGIN_ATTEMPTS,
  RATE_LIMIT_SIGNUP_ATTEMPTS,
  RATE_LIMIT_VERIFY_ATTEMPTS,
  RATE_LIMIT_PASSWORD_RESET_ATTEMPTS,
} from '../constants/config.js';

/**
 * Login rate limiter
 * 5 attempts per 15 minutes per IP
 */
export const loginLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_LOGIN_ATTEMPTS,
  message: 'Too many login attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

/**
 * Signup rate limiter
 * 3 attempts per 15 minutes per IP
 */
export const signupLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_SIGNUP_ATTEMPTS,
  message: 'Too many signup attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

/**
 * Email verification rate limiter
 * 10 attempts per 15 minutes per IP
 */
export const verifyEmailLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_VERIFY_ATTEMPTS,
  message: 'Too many verification attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed attempts
});

/**
 * Password reset rate limiter
 * 3 attempts per 15 minutes per IP
 */
export const passwordResetLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_PASSWORD_RESET_ATTEMPTS,
  message: 'Too many password reset attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP
 */
export const apiLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: 100,
  message: 'Too many requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// In-memory store for rate limiting (use Redis in production)
class MemoryStore {
  constructor() {
    this.clients = {};
  }

  incr(key, cb) {
    if (this.clients[key]) {
      this.clients[key]++;
    } else {
      this.clients[key] = 1;
    }
    cb(null, this.clients[key]);
  }

  decrement(key) {
    if (this.clients[key]) {
      this.clients[key]--;
    }
  }

  resetKey(key) {
    delete this.clients[key];
  }
}

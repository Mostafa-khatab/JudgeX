/**
 * Application Constants and Configuration
 * Centralized configuration to avoid magic numbers
 */

// ==================== AUTH CONSTANTS ====================
export const TOKEN_EXPIRY_DAYS = 30;
export const TOKEN_EXPIRY_HOURS_SHORT = 24;
export const VERIFICATION_CODE_EXPIRY_HOURS = 24;
export const PASSWORD_RESET_EXPIRY_MINUTES = 60;

// ==================== INTERVIEW CONSTANTS ====================
export const INTERVIEW_DURATION_MIN = 15;
export const INTERVIEW_DURATION_MAX = 180;

// ==================== HTTP CONSTANTS ====================
export const HTTP_TIMEOUT_MS = 15000;
export const JDOODLE_TIMEOUT_MS = 8500;
export const JDOODLE_BATCH_SIZE = 3;
export const JDOODLE_REQUEST_TIMEOUT_MS = 15000;

// ==================== SUBMISSION CONSTANTS ====================
export const SUBMISSION_BATCH_SIZE = 3;
export const SUBMISSION_TIMEOUT_MS = 8500;

// ==================== PAGINATION CONSTANTS ====================
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// ==================== CONSTRAINTS ====================
export const MAX_PROBLEM_TITLE_LENGTH = 200;
export const MAX_INTERVIEW_TITLE_LENGTH = 200;
export const MAX_USER_NAME_LENGTH = 100;
export const MAX_BIO_LENGTH = 500;

// ==================== RATE LIMITING ====================
export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
export const RATE_LIMIT_LOGIN_ATTEMPTS = 5;
export const RATE_LIMIT_SIGNUP_ATTEMPTS = 3;
export const RATE_LIMIT_VERIFY_ATTEMPTS = 10;
export const RATE_LIMIT_PASSWORD_RESET_ATTEMPTS = 3;

// ==================== CACHE CONSTANTS ====================
export const CACHE_TTL_USER_RANK = 3600; // 1 hour
export const CACHE_TTL_STATS = 1800; // 30 minutes
export const CACHE_TTL_PROBLEM = 7200; // 2 hours

// ==================== VALIDATION REGEX ====================
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PASSWORD_MIN_LENGTH = 8;
export const VERIFICATION_TOKEN_REGEX = /^[a-f0-9]{64}$/; // 32 bytes hex
export const RESET_TOKEN_REGEX = /^[a-f0-9]{40}$/; // 20 bytes hex

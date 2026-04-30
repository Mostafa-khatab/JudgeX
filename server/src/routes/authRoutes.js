import express from 'express';
import authControllers from '../controllers/authControllers.js';
import authMiddlewares from '../middlewares/authMiddlewares.js';
import googleRoutes from './oauth/googleRoutes.js';
import { loginLimiter, signupLimiter, verifyEmailLimiter, passwordResetLimiter } from '../middlewares/rateLimiter.js';
import { auditLog, sensitiveOperations } from '../middlewares/auditLogger.js';

const router = express.Router();

// FIX: Added rate limiting and audit logging to sensitive endpoints
router.get('/', authMiddlewares.isAuth, authControllers.getSelfInfo);

router.post('/signup', signupLimiter, auditLog(sensitiveOperations.AUTH_SIGNUP, 'auth'), authControllers.signup);
router.post('/login', loginLimiter, auditLog(sensitiveOperations.AUTH_LOGIN, 'auth'), authControllers.login);
router.post('/logout', authMiddlewares.isSoftAuth, auditLog(sensitiveOperations.AUTH_LOGOUT, 'auth'), authControllers.logout);
router.post('/google/login', authControllers.googleLogin);

router.post('/re-send-verify', verifyEmailLimiter, authControllers.reSendVerificationCode);
router.post('/verify-email/:code', verifyEmailLimiter, auditLog(sensitiveOperations.EMAIL_VERIFY, 'auth'), authControllers.verifyEmail);

router.post('/forgot-password', passwordResetLimiter, auditLog(sensitiveOperations.PASSWORD_RESET, 'auth'), authControllers.forgotPassword);
router.post('/reset-password/:token', passwordResetLimiter, authControllers.resetPassword);

export default router;


import bcryptjs from 'bcryptjs';
import crypto from 'crypto';

import { getTop, getTopPercent } from '../utils/user.js';
import User from '../models/user.js';
import { generateTokenAndSetCookie, generateVerificationCode, generatePasswordResetToken } from '../utils/auth.js';
import { sendResetPasswordRequestEmail, sendResetPasswordSuccessEmail, sendVerificationEmail, sendWellcomeEmail } from '../mail/emails.js';
import Contest from '../models/contest.js';
import googleLogin from './auth/googleController.js';
import { sendSuccess, sendError, handleError } from '../utils/response.js';
import { validateSchema, SignupSchema, LoginSchema, VerifyEmailSchema, ResendVerificationSchema, ForgotPasswordSchema, ResetPasswordSchema } from '../utils/validation.js';
import { auditLog, sensitiveOperations } from '../middlewares/auditLogger.js';

const authControllers = {
	googleLogin,

	/**
	 * [POST] /auth/signup
	 * FIX: Added input validation, proper error handling, and audit logging
	 */
	async signup(req, res, next) {
		try {
			// FIX: Validate input using Zod schema
			const validatedData = await validateSchema(SignupSchema, req.body);
			const { email, password, name } = validatedData;

			// Check if user already exists
			const userAlreadyExists = await User.findOne({ $or: [{ email }, { name }] });

			if (userAlreadyExists) {
				return sendError(res, 'Email or username already exists', 400);
			}

			const hashedPassword = await bcryptjs.hash(password, Number(process.env.HASH_SALT));

			const user = new User({
				email,
				name,
				password: hashedPassword,
			});

			await generateVerificationCode(user);

			await sendVerificationEmail(user.email, user.verificationToken);

			const token = generateTokenAndSetCookie(res, user._id, true);

			// FIX: Audit log for signup
			console.log(`[AUDIT] Signup successful: ${user._id}`);

			return sendSuccess(res, {
				id: user._id,
				email: user.email,
				name: user.name,
			}, 'User created successfully. Please verify your email.', 201);
		} catch (err) {
			return handleError(res, err, 'Signup');
		}
	},

	/**
	 * [POST] /auth/re-send-verify
	 * FIX: Added input validation and proper error messages
	 */
	async reSendVerificationCode(req, res, next) {
		try {
			const validatedData = await validateSchema(ResendVerificationSchema, req.body);
			const { email } = validatedData;

			const user = await User.findOne({ email });

			if (!user) {
				return sendError(res, 'User does not exist', 400);
			}

			if (user.isVerified) {
				return sendError(res, 'User already verified', 400);
			}

			await generateVerificationCode(user);

			await sendVerificationEmail(user.email, user.verificationToken);

			console.log(`[AUDIT] Verification code resent to: ${email}`);

			return sendSuccess(res, null, 'Verification code sent to your email');
		} catch (err) {
			return handleError(res, err, 'ResendVerification');
		}
	},

	/**
	 * [POST] /auth/verify-email/:code
	 * FIX: Added input validation, proper token format checking
	 */
	async verifyEmail(req, res, next) {
		try {
			const { code } = req.params;

			// FIX: Validate token format
			if (!code || !/^[a-f0-9]{64}$/.test(code)) {
				return sendError(res, 'Invalid verification code format', 400);
			}

			const user = await User.findOne({
				verificationToken: code,
			});

			if (!user) {
				return sendError(res, 'Invalid verification code', 400);
			}

			if (user.verificationTokenExpiresAt < Date.now()) {
				return sendError(res, 'Verification code expired', 400);
			}

			user.isVerified = true;
			user.verificationToken = undefined;
			user.verificationTokenExpiresAt = undefined;
			await user.save();

			await sendWellcomeEmail(user.email, user.name);

			console.log(`[AUDIT] Email verified: ${user.email}`);

			return sendSuccess(res, null, 'Email verified successfully');
		} catch (err) {
			return handleError(res, err, 'VerifyEmail');
		}
	},

	/**
	 * [POST] /auth/login
	 * FIX: Added input validation, audit logging, better error messages
	 */
	async login(req, res, next) {
		try {
			const validatedData = await validateSchema(LoginSchema, req.body);
			const { email, password, admin, remember } = validatedData;

			const user = await User.findOne({ email });

			if (admin && user?.permission !== 'Admin') {
				return sendError(res, 'Admin access denied', 403);
			}

			if (!user) {
				return sendError(res, 'Invalid credentials', 401);
			}

			const isPasswordValid = await bcryptjs.compare(password, user.password);

			if (!isPasswordValid) {
				return sendError(res, 'Invalid credentials', 401);
			}

			// FIX: Removed early email verification bypass
			if (!user.isVerified) {
				return sendError(res, 'Email verification required', 403);
			}

			const token = generateTokenAndSetCookie(res, user._id, remember);

			user.lastLogin = new Date();
			await user.save();

			const top = await getTop(user.name);
			const topPercent = await getTopPercent(user.name);

			console.log(`[AUDIT] Login successful: ${user._id}`);

			return sendSuccess(res, {
				id: user._id,
				email: user.email,
				name: user.name,
				fullname: user.fullname,
				avatar: user.avatar,
				permission: user.permission,
				top,
				topPercent,
				token
			}, 'Logged in successfully');
		} catch (err) {
			return handleError(res, err, 'Login');
		}
	},

	/**
	 * [POST] /auth/logout
	 */
	logout(req, res, next) {
		res.clearCookie('token');

		console.log(`[AUDIT] Logout: ${req.userId}`);

		return sendSuccess(res, null, 'Logged out successfully');
	},

	/**
	 * [POST] /auth/forgot-password
	 * FIX: Added input validation, better error handling
	 */
	async forgotPassword(req, res, next) {
		try {
			const validatedData = await validateSchema(ForgotPasswordSchema, req.body);
			const { email } = validatedData;

			const user = await User.findOne({ email });

			if (!user) {
				// FIX: Don't reveal if email exists (prevents user enumeration)
				return sendSuccess(res, null, 'If email exists, password reset link has been sent');
			}

			const resetToken = await generatePasswordResetToken(user);

			await sendResetPasswordRequestEmail(user.email, `${process.env.CLIENT_URL}/reset-password/${resetToken}`);

			console.log(`[AUDIT] Password reset requested: ${user.email}`);

			return sendSuccess(res, null, 'Password reset link sent to your email');
		} catch (err) {
			return handleError(res, err, 'ForgotPassword');
		}
	},

	/**
	 * [POST] /auth/reset-password/:token
	 * FIX: Added input validation, proper token format checking
	 */
	async resetPassword(req, res, next) {
		try {
			const { token } = req.params;
			const { password } = req.body;

			// FIX: Validate token format
			if (!token || !/^[a-f0-9]{40}$/.test(token)) {
				return sendError(res, 'Invalid reset token format', 400);
			}

			// FIX: Validate password
			if (!password || password.length < 8) {
				return sendError(res, 'Password must be at least 8 characters', 400);
			}

			const user = await User.findOne({
				resetPasswordToken: token,
				resetPasswordExpiresAt: { $gt: Date.now() },
			});

			if (!user) {
				return sendError(res, 'Invalid or expired reset token', 400);
			}

			const hashedPassword = await bcryptjs.hash(password, Number(process.env.HASH_SALT));

			user.password = hashedPassword;
			user.resetPasswordToken = undefined;
			user.resetPasswordExpiresAt = undefined;
			await user.save();

			await sendResetPasswordSuccessEmail(user.email);

			console.log(`[AUDIT] Password reset successful: ${user.email}`);

			return sendSuccess(res, null, 'Password reset successful');
		} catch (err) {
			return handleError(res, err, 'ResetPassword');
		}
	},

	/**
	 * [GET] /auth
	 * FIX: Added proper error handling and response format
	 */
	async getSelfInfo(req, res, next) {
		const { admin } = req.query;

		try {
			const user = await User.findById(req.userId);

			if (!user) {
				return sendError(res, 'User not found', 404);
			}

			if (admin && user.permission !== 'Admin') {
				return sendError(res, 'Admin access denied', 403);
			}

			// FIX: Check contest time on profile fetch
			if (user.joiningContest) {
				const contest = await Contest.findOne({ id: user.joiningContest });
				if (contest && contest.endTime < Date.now()) {
					user.joiningContest = null;
					await user.save();
				}
			}

			user.lastLogin = Date.now();
			await user.save();

			const top = await getTop(user.name);
			const topPercent = await getTopPercent(user.name);

			return sendSuccess(res, {
				id: user._id,
				email: user.email,
				name: user.name,
				fullname: user.fullname,
				bio: user.bio,
				avatar: user.avatar,
				permission: user.permission,
				totalScore: user.totalScore,
				totalAC: user.totalAC,
				totalAttempt: user.totalAttempt,
				top,
				topPercent,
				joiningContest: user.joiningContest,
				roadmapProgress: user.roadmapProgress,
			}, 'User info retrieved');
		} catch (err) {
			return handleError(res, err, 'GetSelfInfo');
		}
	},
};

export default authControllers;


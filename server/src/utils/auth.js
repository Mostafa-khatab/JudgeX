import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { TOKEN_EXPIRY_DAYS, TOKEN_EXPIRY_HOURS_SHORT, VERIFICATION_CODE_EXPIRY_HOURS } from '../constants/config.js';

/**
 * Generate JWT token and set secure cookie
 * FIX: Consistent JWT and cookie expiry, proper secure flags
 */
export const generateTokenAndSetCookie = (res, userId, remember = true) => {
	// Match JWT expiry to cookie expiry
	const expiresIn = remember ? `${TOKEN_EXPIRY_DAYS}d` : `${TOKEN_EXPIRY_HOURS_SHORT}h`;
	const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
		expiresIn,
	});

	// Calculate cookie maxAge (in milliseconds)
	const maxAge = remember
		? TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000
		: TOKEN_EXPIRY_HOURS_SHORT * 60 * 60 * 1000;

	res.cookie('token', token, {
		httpOnly: true,
		secure: true, // Always true for cross-domain support over HTTPS
		sameSite: 'none', // Required for cross-domain cookies
		maxAge,
	});

	return token;
};

/**
 * Generate cryptographically secure verification token
 * FIX: Use crypto.randomBytes instead of Math.random() for better security
 */
export const generateVerificationCode = async (user) => {
	try {
		// Generate 32-byte (256-bit) random token in hex format
		const verificationToken = crypto.randomBytes(32).toString('hex');
		user.verificationToken = verificationToken;
		user.verificationTokenExpiresAt = Date.now() + VERIFICATION_CODE_EXPIRY_HOURS * 60 * 60 * 1000;

		await user.save();

		console.log('Verification code generated successfully');
	} catch (err) {
		console.error('Error generating verification code:', err);
		throw new Error(`Error generating verification code: ${err.message}`);
	}
};

/**
 * Generate cryptographically secure password reset token
 * FIX: Use crypto.randomBytes instead of Math.random()
 */
export const generatePasswordResetToken = async (user) => {
	try {
		// Generate 20-byte (160-bit) random token in hex format
		const resetToken = crypto.randomBytes(20).toString('hex');
		user.resetPasswordToken = resetToken;
		user.resetPasswordExpiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

		await user.save();

		console.log('Password reset token generated successfully');
		return resetToken;
	} catch (err) {
		console.error('Error generating password reset token:', err);
		throw new Error(`Error generating password reset token: ${err.message}`);
	}
};

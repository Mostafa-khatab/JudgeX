import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import User from '../../models/user.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleLogin = async (req, res) => {
	try {
		const { credential } = req.body;

		if (!credential) {
			return res.status(400).json({
				success: false,
				msg: 'No credential provided',
			});
		}

		let ticket;
		try {
			// First try as ID token
			ticket = await client.verifyIdToken({
				idToken: credential,
				audience: process.env.GOOGLE_CLIENT_ID,
			});
		} catch (error) {
			console.error('Failed to verify ID token:', error);
			try {
				// If ID token fails, try as access token
				const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
					headers: { Authorization: `Bearer ${credential}` },
				});
				const payload = await response.json();
				ticket = { getPayload: () => payload };
			} catch (error2) {
				console.error('Failed to verify access token:', error2);
				throw new Error('Invalid Google credential');
			}
		}

		const { email, name, picture } = ticket.getPayload();

		// Find or create user
		let user = await User.findOne({ email });

		if (!user) {
			// Create new user if doesn't exist
			user = await User.create({
				email,
				name,
				avatar: picture,
				isVerified: true, // Google accounts are pre-verified
				permission: 'User',
			});
		}

		// Generate JWT token
		const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '90d' });

		// Set cookie
		res.cookie('token', token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: (process.env.JWT_COOKIE_EXPIRES_IN || 90) * 24 * 60 * 60 * 1000,
		});

		// Send response
		res.status(200).json({
			success: true,
			msg: 'Successfully logged in with Google',
			user: {
				id: user._id,
				name: user.name,
				email: user.email,
				avatar: user.avatar,
				permission: user.permission,
			},
		});
	} catch (err) {
		console.error('Google auth error:', err);
		res.status(401).json({
			success: false,
			msg: 'Failed to authenticate with Google',
		});
	}
};

export default googleLogin;

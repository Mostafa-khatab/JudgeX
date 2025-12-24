import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import User from '../../models/user.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleController = {
	async login(req, res) {
		try {
			const { credential } = req.body;
			const ticket = await client.verifyIdToken({
				idToken: credential,
				audience: process.env.GOOGLE_CLIENT_ID,
			});

			const payload = ticket.getPayload();
			const { email, name, picture } = payload;

			// Check if user exists
			let user = await User.findOne({ email });

			if (!user) {
				// Create new user if doesn't exist
				user = await User.create({
					email,
					name,
					avatar: picture,
					isVerified: true, // Google accounts are already verified
					permission: 'User',
				});
			}

			// Generate JWT
			const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

			// Set cookie
			res.cookie('token', token, {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'lax',
				maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
			});

			res.json({
				success: true,
				msg: 'Login successful',
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
			res.status(500).json({
				success: false,
				msg: 'Failed to authenticate with Google',
			});
		}
	},
};

export default googleController;

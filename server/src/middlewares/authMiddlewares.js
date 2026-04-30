import jwt from 'jsonwebtoken';

import User from '../models/user.js';

const authMiddlewares = {
	/**
	 * Strict authentication middleware
	 * Requires valid JWT token and verified user
	 */
	async isAuth(req, res, next) {
		try {
			// Support auth via cookie or Authorization: Bearer <token>
			let token = req.cookies.token;
			if (!token) {
				const authHeader = req.headers.authorization || req.headers.Authorization;
				if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
					token = authHeader.substring(7);
				}
			}

			if (!token) {
				return res.status(401).json({ success: false, msg: 'Unauthorized - no token provided' });
			}

			const decoded = jwt.verify(token, process.env.JWT_SECRET);

			if (!decoded) {
				return res.status(401).json({ success: false, msg: 'Unauthorized - invalid token' });
			}

			const user = await User.findById(decoded.userId);

			if (!user) {
				return res.status(401).json({ success: false, msg: 'Unauthorized - user not found' });
			}

			// FIX: Check verified status on protected routes
			if (!user.isVerified) {
				return res.status(401).json({ 
					success: false, 
					msg: 'Email verification required',
					needsVerification: true 
				});
			}

			req.userId = decoded.userId;
			req.userPermission = user.permission.toLowerCase();
			req.user = user; // Attach full user object for later use

			next();
		} catch (err) {
			if (err?.name === 'JsonWebTokenError' || err?.name === 'TokenExpiredError') {
				return res.status(401).json({ success: false, msg: 'Unauthorized - invalid or expired token' });
			}
			res.status(500).json({ success: false, msg: 'Server error' });
			console.error(`Error in checking auth: ${err.message}`);
		}
	},

	/**
	 * Soft authentication middleware
	 * Optional - continues if no valid token
	 */
	async isSoftAuth(req, res, next) {
		try {
			let token = req.cookies.token;
			if (!token) {
				const authHeader = req.headers.authorization || req.headers.Authorization;
				if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
					token = authHeader.substring(7);
				}
			}

			if (!token) {
				return next();
			}

			const decoded = jwt.verify(token, process.env.JWT_SECRET);

			if (!decoded) {
				return next();
			}

			const user = await User.findById(decoded.userId);

			if (!user || !user.isVerified) {
				return next();
			}

			req.userId = decoded.userId;
			req.userPermission = user.permission.toLowerCase();
			req.user = user;

			next();
		} catch (err) {
			// On any error, just continue without auth - this is soft auth
			console.error(`Soft auth error (continuing): ${err.message}`);
			next();
		}
	},

	/**
	 * Admin permission check middleware
	 */
	requireAd(req, res, next) {
		try {
			if (req.userPermission !== 'admin') {
				return res.status(403).json({ success: false, msg: 'Unauthorized - admin permission required' });
			}

			next();
		} catch (err) {
			res.status(500).json({ success: false, msg: 'Server error' });

			console.error(`Error in checking user permission: ${err.message}`);
		}
	},
};

// Compose middleware for admin requirement
authMiddlewares.requireAd = [authMiddlewares.isAuth, authMiddlewares.requireAd];

export default authMiddlewares;

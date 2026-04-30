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
			let source = 'cookie';
			
			if (!token) {
				const authHeader = req.headers.authorization || req.headers.Authorization;
				if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
					token = authHeader.substring(7);
					source = 'header';
				}
			}
 
			if (!token) {
				console.warn('[Auth] No token provided');
				return res.status(401).json({ success: false, msg: 'Unauthorized - no token provided' });
			}
 
			const decoded = jwt.verify(token, process.env.JWT_SECRET);
 
			if (!decoded) {
				console.warn('[Auth] Token verification failed (decoded is null)');
				return res.status(401).json({ success: false, msg: 'Unauthorized - invalid token' });
			}
 
			const user = await User.findById(decoded.userId);
 
			if (!user) {
				console.warn(`[Auth] User not found for ID: ${decoded.userId}`);
				return res.status(401).json({ success: false, msg: 'Unauthorized - user not found' });
			}
 
			// FIX: Check verified status on protected routes
			if (!user.isVerified) {
				console.warn(`[Auth] User not verified: ${user.email}`);
				return res.status(401).json({ 
					success: false, 
					msg: 'Email verification required',
					needsVerification: true 
				});
			}
 
			req.userId = decoded.userId;
			req.userPermission = user.permission.toLowerCase();
			req.user = user; // Attach full user object for later use
 
			console.log(`[Auth] User authenticated: ${user.email} (${source})`);
			next();
		} catch (err) {
			console.error(`[Auth] Error: ${err.message}`);
			if (err?.name === 'JsonWebTokenError' || err?.name === 'TokenExpiredError') {
				return res.status(401).json({ success: false, msg: 'Unauthorized - invalid or expired token' });
			}
			res.status(500).json({ success: false, msg: 'Server error' });
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

  async isInterviewParticipant(req, res, next) {
    try {
      // 1. Check for regular User Auth
      let token = req.cookies.token || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.substring(7) : null);
      
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const user = await User.findById(decoded.userId);
          if (user && user.isVerified) {
            req.userId = decoded.userId;
            req.userPermission = user.permission.toLowerCase();
            req.user = user;
            return next();
          }
        } catch (e) {
          // Fallback to candidate token if user auth fails
        }
      }

      // 2. Check for Candidate Token
      const candidateToken = req.headers['x-candidate-token'] || req.cookies.candidateToken;
      if (candidateToken) {
        req.isCandidate = true;
        req.candidateToken = candidateToken;
        return next();
      }

      return res.status(401).json({ success: false, msg: 'Unauthorized - please login or use a valid invite link' });
    } catch (err) {
      console.error('[isInterviewParticipant] Error:', err);
      res.status(500).json({ success: false, msg: 'Server error during authentication' });
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
authMiddlewares.isAuthAdmin = [authMiddlewares.isAuth, authMiddlewares.requireAd];

export default authMiddlewares;

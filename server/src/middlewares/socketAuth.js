/**
 * Socket.IO Authentication Middleware
 * FIX: Added comprehensive authentication and validation
 */

import jwt from 'jsonwebtoken';
import User from './models/user.js';
import Interview from './models/interview.js';

/**
 * Socket.IO Authentication Middleware
 * FIX: Verify JWT token before allowing connection
 */
export const socketAuthMiddleware = async (socket, next) => {
  try {
    // Extract token from handshake auth
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded || !decoded.userId) {
      return next(new Error('Invalid authentication token'));
    }

    // Fetch user from database
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return next(new Error('User not found'));
    }

    if (!user.isVerified) {
      return next(new Error('User email not verified'));
    }

    // Attach user info to socket
    socket.userId = decoded.userId;
    socket.user = user;
    socket.userPermission = user.permission.toLowerCase();

    console.log(`[Socket.IO] User authenticated: ${user._id}`);
    next();
  } catch (err) {
    console.error('[Socket.IO] Authentication error:', err.message);
    next(new Error('Authentication failed'));
  }
};

/**
 * Validate interview access for socket events
 * FIX: Ensure user has permission to access specific interview
 */
export const validateInterviewAccess = async (interviewId, socket) => {
  try {
    const interview = await Interview.findById(interviewId);
    
    if (!interview) {
      return { valid: false, reason: 'Interview not found' };
    }

    // Check if user is instructor
    if (interview.instructor.toString() === socket.userId) {
      return { valid: true, role: 'interviewer' };
    }

    // Check if user is candidate (via invite token in handshake)
    const inviteToken = socket.handshake.auth.inviteToken;
    if (inviteToken && interview.inviteToken === inviteToken) {
      return { valid: true, role: 'candidate' };
    }

    return { valid: false, reason: 'Access denied' };
  } catch (err) {
    console.error('[Socket.IO] Error validating interview access:', err);
    return { valid: false, reason: 'Validation error' };
  }
};

/**
 * Emit error to socket safely
 */
export const emitError = (socket, event, message) => {
  socket.emit('error', { event, message });
  console.error(`[Socket.IO] Error in ${event}: ${message}`);
};

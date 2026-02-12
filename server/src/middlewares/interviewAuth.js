import Interview from '../models/interview.js';
import User from '../models/user.js';

/**
 * Middleware to check if user is an instructor
 * Allows Admin and Instructor roles
 */
export const isInstructor = async (req, res, next) => {
  if (!req.userId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  // Allow Admin and Instructor roles
  if (req.userPermission !== 'admin' && req.userPermission !== 'instructor') {
    console.log('isInstructor check failed:', { userId: req.userId, permission: req.userPermission });
    return res.status(403).json({
      success: false,
      message: 'Instructor access required',
    });
  }

  // Get full user object for later use
  try {
    const user = await User.findById(req.userId);
    if (user) {
      req.user = user;
    }
  } catch (error) {
    console.error('Error fetching user:', error);
  }

  req.isInstructor = true;
  next();
};

/**
 * Middleware to check if user can access the interview
 * Works for both authenticated users and guest candidates
 */
export const canAccessInterview = async (req, res, next) => {
  try {
    const interviewId = req.params.id;
    const candidateToken = req.headers['x-candidate-token'] || req.query.candidateToken;

    // Try to find interview
    const interview = await Interview.findById(interviewId);

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found',
      });
    }

    // Check if authenticated user is the instructor
    if (req.userId && interview.instructor.toString() === req.userId.toString()) {
      req.isInstructor = true;
      req.interview = interview;
      // Get full user object
      const user = await User.findById(req.userId);
      if (user) req.user = user;
      return next();
    }

    // Check if guest candidate with valid token
    if (candidateToken && interview.inviteToken === candidateToken) {
      req.isInstructor = false;
      req.candidateToken = candidateToken;
      req.interview = interview;
      return next();
    }

    // Check if authenticated candidate
    if (req.userId && interview.candidate.userId?.toString() === req.userId.toString()) {
      req.isInstructor = false;
      req.interview = interview;
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied',
    });
  } catch (error) {
    console.error('canAccessInterview middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * Middleware to check if interview is currently active
 * Used for submission endpoints
 */
export const isInterviewActive = async (req, res, next) => {
  try {
    const interview = req.interview || (await Interview.findById(req.params.id));

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found',
      });
    }

    if (interview.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `Interview is ${interview.status}. Submissions not allowed.`,
      });
    }

    // Check if time has expired
    if (interview.remainingTime <= 0) {
      // Auto-end the interview
      interview.status = 'finished';
      interview.finishedAt = new Date();
      await interview.save();

      return res.status(400).json({
        success: false,
        message: 'Interview time has expired',
      });
    }

    req.interview = interview;
    next();
  } catch (error) {
    console.error('isInterviewActive middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * Optional authentication middleware
 * Sets req.user if token is valid, but doesn't block if not
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return next();
    }

    // Try to verify token - import jwt if needed
    const jwt = await import('jsonwebtoken');
    const decoded = jwt.default.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const User = (await import('../models/user.js')).default;
    const user = await User.findById(decoded.id);

    if (user) {
      req.user = user;
    }

    next();
  } catch (error) {
    // Token invalid or expired - continue without user
    next();
  }
};

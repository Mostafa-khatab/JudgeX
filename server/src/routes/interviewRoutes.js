import express from 'express';
import authMiddlewares from '../middlewares/authMiddlewares.js';

const { isAuth } = authMiddlewares;

// isInstructor middleware (check if user is instructor or admin)
const isInstructor = (req, res, next) => {
  if (!req.userPermission || !['instructor', 'admin'].includes(req.userPermission)) {
    return res.status(403).json({ success: false, message: 'Instructor permission required' });
  }
  next();
};
import {
  createInterview,
  getInterviews,
  getInterview,
  joinInterview,
  startInterview,
  pauseInterview,
  resumeInterview,
  endInterview,
  updateState,
  addMessage,
  saveFeedback,
  takeSnapshot,
  trackTabSwitch,
  getResults,
  deleteInterview,
  addQuestion
} from '../controllers/interviewController.js';

const router = express.Router();

/**
 * Interview Routes
 * 
 * Public routes:
 * - GET /join/:token - Join interview via invite link
 * 
 * Protected routes (require auth):
 * - All other routes
 */

// ==================== PUBLIC ====================
// Join interview via invite token
router.get('/join/:token', joinInterview);

// ==================== PROTECTED (Auth required) ====================
// CRUD
router.post('/', isAuth, isInstructor, createInterview);
router.get('/', isAuth, getInterviews);
router.get('/:id', isAuth, getInterview);
router.delete('/:id', isAuth, deleteInterview);

// Session control
router.post('/:id/start', isAuth, startInterview);
router.post('/:id/pause', isAuth, pauseInterview);
router.post('/:id/resume', isAuth, resumeInterview);
router.post('/:id/end', isAuth, endInterview);

// State sync
router.post('/:id/state', isAuth, updateState);

// Questions
router.post('/:id/questions', isAuth, addQuestion);

// Chat
router.post('/:id/messages', isAuth, addMessage);

// Feedback (interviewer only)
router.post('/:id/feedback', isAuth, saveFeedback);
router.get('/:id/results', isAuth, getResults);

// Snapshots
router.post('/:id/snapshot', isAuth, takeSnapshot);

// Proctoring
router.post('/:id/tab-switch', trackTabSwitch);

export default router;


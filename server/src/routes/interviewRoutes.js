import express from 'express';
import authMiddlewares from '../middlewares/authMiddlewares.js';

const { isAuth, isInterviewParticipant } = authMiddlewares;

import interviewController from '../controllers/interviewController.js';

const {
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
} = interviewController;

const router = express.Router();

/**
 * Interview Routes
 * 
 * Public routes:
 * - POST /join/:token - Join interview via invite link (POST body required)
 * 
 * Protected routes (require auth):
 * - All other routes
 */

// ==================== PUBLIC ====================
// Join interview via invite token (FIXED: Changed from GET to POST for CSRF protection)
router.post('/join/:token', joinInterview);

// ==================== PROTECTED (Auth required) ====================
// CRUD
router.post('/', isAuth, createInterview);
router.get('/', isAuth, getInterviews);
router.get('/:id', isInterviewParticipant, getInterview); // Allow candidate
router.delete('/:id', isAuth, deleteInterview);

// Session control
router.post('/:id/start', isAuth, startInterview);
router.post('/:id/pause', isAuth, pauseInterview);
router.post('/:id/resume', isAuth, resumeInterview);
router.post('/:id/end', isAuth, endInterview);

// State sync
router.post('/:id/state', isInterviewParticipant, updateState); // Allow candidate

// Questions
router.post('/:id/questions', isAuth, addQuestion);

// Chat
router.post('/:id/messages', isInterviewParticipant, addMessage); // Allow candidate

// Feedback (interviewer only)
router.post('/:id/feedback', isAuth, saveFeedback);
router.get('/:id/results', isAuth, getResults);

// Snapshots
router.post('/:id/snapshot', isInterviewParticipant, takeSnapshot); // Allow candidate

// Proctoring
router.post('/:id/tab-switch', isInterviewParticipant, trackTabSwitch); // Allow candidate

export default router;


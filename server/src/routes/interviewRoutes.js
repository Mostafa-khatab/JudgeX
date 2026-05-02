import express from 'express';
import authMiddlewares from '../middlewares/authMiddlewares.js';

const { isAuth, isInterviewParticipant } = authMiddlewares;

import interviewController from '../controllers/interviewController.js';

const {
  createInterview,
  getInterviews,
  getInterview,
  getInterviewByToken,
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
  bulkDeleteInterviews,
  cleanupInterviews,
  addQuestion
} = interviewController;

const router = express.Router();

/**
 * Interview Routes
 */

// ==================== PUBLIC ====================
router.get('/join/:token', getInterviewByToken);
router.post('/join/:token', joinInterview);

// ==================== PROTECTED (Auth required) ====================
// CRUD
router.post('/', isAuth, createInterview);
router.get('/', isAuth, getInterviews);
router.get('/:id', isInterviewParticipant, getInterview);
router.delete('/:id', isAuth, deleteInterview);
router.post('/bulk-delete', isAuth, bulkDeleteInterviews);
router.post('/cleanup', isAuth, cleanupInterviews);

// Session control
router.post('/:id/start', isAuth, startInterview);
router.post('/:id/pause', isAuth, pauseInterview);
router.post('/:id/resume', isAuth, resumeInterview);
router.post('/:id/end', isAuth, endInterview);

// State sync
router.post('/:id/state', isInterviewParticipant, updateState);

// Questions
router.post('/:id/questions', isAuth, addQuestion);

// Chat
router.post('/:id/messages', isInterviewParticipant, addMessage);

// Feedback (interviewer only)
router.post('/:id/feedback', isAuth, saveFeedback);
router.get('/:id/results', isAuth, getResults);

// Snapshots
router.post('/:id/snapshot', isInterviewParticipant, takeSnapshot);

// Proctoring
router.post('/:id/tab-switch', isInterviewParticipant, trackTabSwitch);

export default router;

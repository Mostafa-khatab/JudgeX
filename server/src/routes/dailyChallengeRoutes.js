import express from 'express';
import dailyChallengeController from '../controllers/dailyChallengeController.js';
import authMiddlewares from '../middlewares/authMiddlewares.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddlewares.isAuth);

// GET  /daily-challenge         — Get today's challenge
router.get('/', dailyChallengeController.getChallenge);

// POST /daily-challenge/complete — Mark challenge as completed
router.post('/complete', dailyChallengeController.completeChallenge);

// GET  /daily-challenge/streak   — Get streak info
router.get('/streak', dailyChallengeController.getStreak);

// GET  /daily-challenge/history  — Get past challenges
router.get('/history', dailyChallengeController.getHistory);

// POST /daily-challenge/train    — Trigger model training (admin)
router.post('/train', dailyChallengeController.trainModel);

export default router;

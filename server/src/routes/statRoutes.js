import express from 'express';

import authMiddlewares from '../middlewares/authMiddlewares.js';
import statControllers from '../controllers/statControllers.js';

const router = express.Router();

router.get('/', authMiddlewares.isSoftAuth, statControllers.getStat);
router.get('/weekly-submission', authMiddlewares.isAuthAdmin, statControllers.getWeeklySubmisson);
router.get('/weekly-accepted', authMiddlewares.isAuthAdmin, statControllers.getWeeklyAccepted);
router.get('/monthly-submission', authMiddlewares.isAuthAdmin, statControllers.getMonthlySubmission);
router.get('/monthly-language', authMiddlewares.isAuthAdmin, statControllers.getMonthlyLanguage);
router.get('/newest-activity', authMiddlewares.isSoftAuth, statControllers.getNewestActivity);
router.get('/problem/:id', authMiddlewares.isAuthAdmin, statControllers.getProblemStat);
router.get('/daily-submission', authMiddlewares.isAuthAdmin, statControllers.getDailySubmission);
router.get('/global-stats', authMiddlewares.isSoftAuth, statControllers.getGlobalStats);


export default router;

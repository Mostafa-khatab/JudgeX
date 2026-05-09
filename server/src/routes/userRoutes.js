import express from 'express';

import userControllers from '../controllers/userControllers.js';
import skillGapController from '../controllers/skillGapController.js';
import authMiddlewares from '../middlewares/authMiddlewares.js';
import { uploadAvatar } from '../config/multer.js';

const router = express.Router();

router.get('/', userControllers.getList);
router.get('/info/:name', userControllers.get);
router.get('/skill-gap/:name', skillGapController.getSkillGap);
router.post('/edit', authMiddlewares.isAuth, userControllers.edit);
router.post('/change-avatar', authMiddlewares.isAuth, uploadAvatar.single('file'), userControllers.changeAvatar);
router.patch('/roadmap/progress', authMiddlewares.isAuth, userControllers.updateRoadmapProgress);
router.post('/roadmap/verify-problem', authMiddlewares.isAuth, userControllers.verifyRoadmapProblem);
router.delete('/delete/:name', authMiddlewares.requireAd, userControllers.deleteUser);

export default router;

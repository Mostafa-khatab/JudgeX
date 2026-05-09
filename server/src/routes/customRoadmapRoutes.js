import express from 'express';
import { generateRoadmap, getMyRoadmaps, getRoadmapById, updateNodeProgress, deleteRoadmap } from '../controllers/customRoadmapController.js';
import authMiddlewares from '../middlewares/authMiddlewares.js';

const router = express.Router();

router.post('/generate', authMiddlewares.isAuth, generateRoadmap);
router.get('/me', authMiddlewares.isAuth, getMyRoadmaps);
router.get('/:id', authMiddlewares.isAuth, getRoadmapById);
router.patch('/:id/node/:nodeId', authMiddlewares.isAuth, updateNodeProgress);
router.delete('/:id', authMiddlewares.isAuth, deleteRoadmap);

export default router;
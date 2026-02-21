import express from 'express';
import { likeComment } from '../controllers/commentControllers.js';
import auth from '../middlewares/authMiddlewares.js';

const router = express.Router();

router.post('/:id/like', auth.isAuth, likeComment);

export default router;

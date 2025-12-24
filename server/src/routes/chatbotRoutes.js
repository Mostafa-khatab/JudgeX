import express from 'express';
import { sendMessage } from '../controllers/chatbotController.js';
import authMiddlewares from '../middlewares/authMiddlewares.js';

const router = express.Router();

// ChatBot message endpoint - requires authentication
router.post('/message', authMiddlewares.isAuth, sendMessage);

export default router;

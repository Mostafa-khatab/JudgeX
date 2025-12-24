import express from 'express';
import { runCode } from '../controllers/codeRunnerController.js';
import authMiddlewares from '../middlewares/authMiddlewares.js';

const router = express.Router();

router.post('/run', authMiddlewares.isAuth, runCode);

export default router;

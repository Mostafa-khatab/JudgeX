import express from 'express';
import { runCode } from '../controllers/codeRunnerController.js';
import authMiddlewares from '../middlewares/authMiddlewares.js';

const router = express.Router();

// Authenticated run (for regular users)
router.post('/run', authMiddlewares.isAuth, runCode);

// Interview run (for candidates with soft auth - allows guests with candidate token header)
router.post('/interview-run', authMiddlewares.isSoftAuth, runCode);

export default router;


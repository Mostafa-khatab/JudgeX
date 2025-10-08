import express from 'express';
import googleController from '../../controllers/oauth/googleController.js';

const router = express.Router();

router.post('/login', googleController.login);

export default router;
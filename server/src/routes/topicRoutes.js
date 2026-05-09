import express from 'express';

import topicControllers from '../controllers/topicControllers.js';

const router = express.Router();

router.get('/', topicControllers.list);
router.get('/:topicId', topicControllers.get);

export default router;

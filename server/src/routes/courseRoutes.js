import express from 'express';
import courseControllers from '../controllers/courseControllers.js';
import authMiddlewares from '../middlewares/authMiddlewares.js';
import { uploadVideo, uploadThumbnail } from '../config/multer.js';

const router = express.Router();

// Public routes
router.get('/', courseControllers.getList);
router.get('/:id', courseControllers.get);

// Protected routes (require authentication)
router.post('/:id/enroll', authMiddlewares.isAuth, courseControllers.enroll);
router.post('/:id/rate', authMiddlewares.isAuth, courseControllers.rate);

// Admin routes (require admin permission)
router.post('/', authMiddlewares.requireAd, courseControllers.create);
router.put('/:id', authMiddlewares.requireAd, courseControllers.update);
router.delete('/:id', authMiddlewares.requireAd, courseControllers.delete);

// Video upload routes
router.post('/:id/video', authMiddlewares.requireAd, uploadVideo.single('video'), courseControllers.uploadVideo);
router.post('/:id/thumbnail', authMiddlewares.requireAd, uploadThumbnail.single('thumbnail'), courseControllers.uploadThumbnail);

export default router;

import express from 'express';
import { getBlogs, syncCodeforcesBlogs, getBlogById, likeBlog, addComment, getBlogComments, createBlog } from '../controllers/blogControllers.js';
import auth from '../middlewares/authMiddlewares.js';

const router = express.Router();

router.get('/', auth.isSoftAuth, getBlogs);
router.post('/', auth.isAuth, createBlog); // Add this
router.get('/:id', auth.isSoftAuth, getBlogById); // Get single blog
router.post('/sync', syncCodeforcesBlogs); // Maybe protect this? For now open for demo.

// Social features
router.post('/:id/like', auth.isAuth, likeBlog);
router.post('/:id/comment', auth.isAuth, addComment);
router.get('/:id/comments', auth.isSoftAuth, getBlogComments);

export default router;

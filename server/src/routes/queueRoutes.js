import express from 'express';
import { getQueueStats, getJobStatus } from '../queue/index.js';
import authMiddlewares from '../middlewares/authMiddlewares.js';

const { isAuth: authMiddleware } = authMiddlewares;

const router = express.Router();

/**
 * GET /queue/stats
 * Get queue statistics (admin only)
 */
router.get('/stats', authMiddleware, async (req, res) => {
	try {
		// Check admin permission
		if (req.userPermission !== 'Admin') {
			return res.status(403).json({ 
				success: false, 
				message: 'Admin access required' 
			});
		}

		const stats = await getQueueStats();
		res.json({ success: true, data: stats });
	} catch (error) {
		console.error('Error getting queue stats:', error);
		res.status(500).json({ 
			success: false, 
			message: 'Failed to get queue statistics' 
		});
	}
});

/**
 * GET /queue/job/:id
 * Get job status by submission ID
 */
router.get('/job/:id', authMiddleware, async (req, res) => {
	try {
		const { id } = req.params;
		const status = await getJobStatus(id);

		if (!status) {
			return res.status(404).json({ 
				success: false, 
				message: 'Job not found' 
			});
		}

		res.json({ success: true, data: status });
	} catch (error) {
		console.error('Error getting job status:', error);
		res.status(500).json({ 
			success: false, 
			message: 'Failed to get job status' 
		});
	}
});

/**
 * GET /queue/health
 * Check queue health (public)
 */
router.get('/health', async (req, res) => {
	try {
		const stats = await getQueueStats();
		const isHealthy = stats.active >= 0; // Basic health check

		res.json({
			success: true,
			healthy: isHealthy,
			stats: {
				waiting: stats.waiting,
				active: stats.active,
			}
		});
	} catch (error) {
		res.status(503).json({
			success: false,
			healthy: false,
			message: 'Queue service unavailable'
		});
	}
});

export default router;

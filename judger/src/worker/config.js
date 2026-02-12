import Redis from 'ioredis';

// Redis connection configuration
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Create Redis connection for BullMQ
export const createRedisConnection = () => {
	return new Redis(REDIS_URL, {
		maxRetriesPerRequest: null,
		enableReadyCheck: false,
	});
};

// Worker configuration
export const workerConfig = {
	concurrency: parseInt(process.env.WORKER_CONCURRENCY) || 5, // Process 5 jobs concurrently
	limiter: {
		max: 10, // Max 10 jobs
		duration: 1000, // Per 1 second
	},
};

export default {
	createRedisConnection,
	workerConfig,
	REDIS_URL,
};

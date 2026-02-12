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

// Queue configuration options
export const queueConfig = {
	connection: {
		host: process.env.REDIS_HOST || (process.env.REDIS_URL ? new URL(process.env.REDIS_URL).hostname : 'localhost'),
		port: parseInt(process.env.REDIS_PORT) || (process.env.REDIS_URL ? parseInt(new URL(process.env.REDIS_URL).port) : 6379),
	},
	defaultJobOptions: {
		attempts: 3, // Retry failed jobs 3 times
		backoff: {
			type: 'exponential',
			delay: 1000, // Start with 1 second delay
		},
		removeOnComplete: {
			count: 1000, // Keep last 1000 completed jobs
			age: 24 * 3600, // Keep for 24 hours
		},
		removeOnFail: {
			count: 5000, // Keep last 5000 failed jobs
		},
	},
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
	queueConfig,
	workerConfig,
	REDIS_URL,
};

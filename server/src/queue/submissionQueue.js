import { Queue, QueueEvents } from 'bullmq';
import { queueConfig, createRedisConnection } from './config.js';

// Create submission queue
const submissionQueue = new Queue('submissions', {
	connection: createRedisConnection(),
	...queueConfig,
});

// Queue events for monitoring
const queueEvents = new QueueEvents('submissions', {
	connection: createRedisConnection(),
});

/**
 * Add a submission job to the queue
 * @param {Object} submissionData - The submission data
 * @param {string} submissionData.submissionId - MongoDB submission ID
 * @param {string} submissionData.src - Source code
 * @param {string} submissionData.language - Programming language
 * @param {Object} submissionData.problem - Problem details with testcases
 * @param {Object} options - Job options (priority, delay, etc.)
 */
export const addSubmissionJob = async (submissionData, options = {}) => {
	const job = await submissionQueue.add('judge', submissionData, {
		priority: options.priority || 0, // Lower = higher priority
		delay: options.delay || 0,
		jobId: submissionData.submissionId, // Use submission ID as job ID
	});

	console.log(`📥 Job ${job.id} added to queue for submission ${submissionData.submissionId}`);
	return job;
};

/**
 * Get job status by submission ID
 * @param {string} submissionId - The submission/job ID
 */
export const getJobStatus = async (submissionId) => {
	const job = await submissionQueue.getJob(submissionId);
	if (!job) return null;

	const state = await job.getState();
	return {
		id: job.id,
		state,
		progress: job.progress,
		data: job.data,
		result: job.returnvalue,
		failedReason: job.failedReason,
		attemptsMade: job.attemptsMade,
		timestamp: job.timestamp,
	};
};

/**
 * Get queue statistics
 */
export const getQueueStats = async () => {
	const [waiting, active, completed, failed, delayed] = await Promise.all([
		submissionQueue.getWaitingCount(),
		submissionQueue.getActiveCount(),
		submissionQueue.getCompletedCount(),
		submissionQueue.getFailedCount(),
		submissionQueue.getDelayedCount(),
	]);

	return { waiting, active, completed, failed, delayed };
};

/**
 * Clean old jobs from queue
 * @param {number} grace - Grace period in milliseconds
 */
export const cleanQueue = async (grace = 24 * 3600 * 1000) => {
	await submissionQueue.clean(grace, 1000, 'completed');
	await submissionQueue.clean(grace, 1000, 'failed');
};

// Event listeners for logging
queueEvents.on('completed', ({ jobId, returnvalue }) => {
	console.log(`✅ Job ${jobId} completed with result:`, returnvalue?.status);
});

queueEvents.on('failed', ({ jobId, failedReason }) => {
	console.error(`❌ Job ${jobId} failed:`, failedReason);
});

queueEvents.on('progress', ({ jobId, data }) => {
	console.log(`⏳ Job ${jobId} progress:`, data);
});

queueEvents.on('stalled', ({ jobId }) => {
	console.warn(`⚠️ Job ${jobId} stalled - will be reprocessed`);
});

export { submissionQueue, queueEvents };
export default submissionQueue;

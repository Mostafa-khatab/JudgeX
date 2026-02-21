import { Queue, QueueEvents } from 'bullmq';
import { queueConfig, createRedisConnection } from './config.js';

// ── Lazy singletons ──────────────────────────────────────────────────────────
// We do NOT create Queue/Redis at import time.
// They are created on first use so the server starts fine without Redis.

let _queue = null;
let _queueEvents = null;

const getQueue = () => {
	if (!_queue) {
		const conn = createRedisConnection();
		conn.on('error', (err) => {
			console.warn('[BullMQ] Redis connection error (queue):', err.message);
		});
		_queue = new Queue('submissions', {
			connection: conn,
			...queueConfig,
		});
		_queue.on('error', (err) => {
			console.warn('[BullMQ] Queue error:', err.message);
			// Reset singleton so next request gets a fresh connection
			_queue = null;
		});
	}
	return _queue;
};

const getQueueEvents = () => {
	if (!_queueEvents) {
		const conn = createRedisConnection();
		conn.on('error', (err) => {
			console.warn('[BullMQ] Redis connection error (events):', err.message);
		});
		_queueEvents = new QueueEvents('submissions', { connection: conn });
		_queueEvents.on('error', (err) => {
			console.warn('[BullMQ] QueueEvents error:', err.message);
		});

		// Logging
		_queueEvents.on('completed', ({ jobId, returnvalue }) => {
			console.log(`✅ Job ${jobId} completed:`, returnvalue?.status);
		});
		_queueEvents.on('failed', ({ jobId, failedReason }) => {
			console.error(`❌ Job ${jobId} failed:`, failedReason);
		});
		_queueEvents.on('progress', ({ jobId, data }) => {
			console.log(`⏳ Job ${jobId} progress:`, data);
		});
		_queueEvents.on('stalled', ({ jobId }) => {
			console.warn(`⚠️ Job ${jobId} stalled - will be reprocessed`);
		});
	}
	return _queueEvents;
};

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Add a submission job to the queue.
 */
export const addSubmissionJob = async (submissionData, options = {}) => {
	const queue = getQueue();
	const job = await queue.add('judge', submissionData, {
		priority: options.priority || 0,
		delay: options.delay || 0,
		jobId: submissionData.submissionId,
	});
	console.log(`📥 Job ${job.id} added to queue for submission ${submissionData.submissionId}`);
	return job;
};

/**
 * Get job status by submission ID.
 */
export const getJobStatus = async (submissionId) => {
	const queue = getQueue();
	const job = await queue.getJob(submissionId);
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
 * Get queue statistics.
 */
export const getQueueStats = async () => {
	const queue = getQueue();
	const [waiting, active, completed, failed, delayed] = await Promise.all([
		queue.getWaitingCount(),
		queue.getActiveCount(),
		queue.getCompletedCount(),
		queue.getFailedCount(),
		queue.getDelayedCount(),
	]);
	return { waiting, active, completed, failed, delayed };
};

/**
 * Clean old jobs from queue.
 */
export const cleanQueue = async (grace = 24 * 3600 * 1000) => {
	const queue = getQueue();
	await queue.clean(grace, 1000, 'completed');
	await queue.clean(grace, 1000, 'failed');
};

export default { addSubmissionJob, getJobStatus, getQueueStats, cleanQueue, getQueue, getQueueEvents };

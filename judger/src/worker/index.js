import { Worker } from 'bullmq';
import mongoose from 'mongoose';
import { createRedisConnection, workerConfig } from './config.js';
import DockerExecutor from './dockerExecutor.js';

// MongoDB connection for updating submission results
const connectDB = async () => {
	const dbUrl = process.env.DATABASE_URL || 'mongodb://localhost:27017/FloatPoint';
	await mongoose.connect(dbUrl);
	console.log('📦 Connected to MongoDB');
};

// Submission model (simplified - matches server model)
const submissionSchema = new mongoose.Schema({
	author: String,
	src: String,
	forProblem: String,
	forContest: String,
	language: String,
	time: { type: Number, default: 0 },
	memory: { type: Number, default: 0 },
	status: { type: String, default: 'IE' },
	msg: Object,
	point: { type: Number, default: 0 },
	testcase: [Object],
	jobId: String,
	queuedAt: Date,
	startedAt: Date,
	completedAt: Date,
	workerId: String,
	retryCount: { type: Number, default: 0 },
}, { timestamps: true });

const Submission = mongoose.model('Submission', submissionSchema);

// Initialize Docker executor
const executor = new DockerExecutor();

/**
 * Process a submission job
 */
const processSubmission = async (job) => {
	const { submissionId, src, language, problem } = job.data;
	const workerId = `worker-${process.pid}`;

	console.log(`\n🔧 Processing job ${job.id} (Submission: ${submissionId})`);
	console.log(`   Language: ${language}`);
	console.log(`   Problem: ${problem.id}`);
	console.log(`   Test cases: ${problem.testcase?.length || 0}`);

	try {
		// Update submission status to "Judging"
		await Submission.findByIdAndUpdate(submissionId, {
			startedAt: new Date(),
			workerId,
			status: 'JUDGING',
		});

		// Report progress
		await job.updateProgress({ stage: 'compiling', testcase: 0 });

		// Run the judge
		const result = await executor.judge(
			{ src, language, _id: submissionId },
			problem
		);

		// Calculate points
		const passedTests = result.testcase?.filter((t) => t.status === 'AC').length || 0;
		const totalTests = result.testcase?.length || 1;
		const point = passedTests === totalTests ? problem.point || 100 : 0;

		// Update submission with results
		await Submission.findByIdAndUpdate(submissionId, {
			status: result.status,
			time: result.time,
			memory: result.memory,
			msg: result.msg,
			testcase: result.testcase,
			point,
			completedAt: new Date(),
		});

		console.log(`✅ Job ${job.id} completed: ${result.status}`);
		console.log(`   Time: ${result.time?.toFixed(3)}s, Memory: ${result.memory?.toFixed(2)}MB`);
		console.log(`   Points: ${point}/${problem.point || 100}`);

		return {
			submissionId,
			status: result.status,
			time: result.time,
			memory: result.memory,
			point,
		};
	} catch (error) {
		console.error(`❌ Job ${job.id} failed:`, error);

		// Update submission with error
		await Submission.findByIdAndUpdate(submissionId, {
			status: 'IE',
			msg: { server: error.message },
			completedAt: new Date(),
		});

		throw error;
	}
};

/**
 * Create and start the worker
 */
const startWorker = async () => {
	await connectDB();

	const worker = new Worker('submissions', processSubmission, {
		connection: createRedisConnection(),
		concurrency: workerConfig.concurrency,
		limiter: workerConfig.limiter,
	});

	// Worker event handlers
	worker.on('ready', () => {
		console.log('🚀 Worker is ready and waiting for jobs...');
	});

	worker.on('active', (job) => {
		console.log(`⚡ Job ${job.id} started`);
	});

	worker.on('completed', (job, result) => {
		console.log(`✅ Job ${job.id} completed:`, result?.status);
	});

	worker.on('failed', (job, error) => {
		console.error(`❌ Job ${job?.id} failed:`, error.message);
	});

	worker.on('stalled', (jobId) => {
		console.warn(`⚠️ Job ${jobId} stalled`);
	});

	worker.on('error', (error) => {
		console.error('Worker error:', error);
	});

	// Graceful shutdown
	const shutdown = async () => {
		console.log('\n🛑 Shutting down worker...');
		await worker.close();
		await mongoose.disconnect();
		process.exit(0);
	};

	process.on('SIGTERM', shutdown);
	process.on('SIGINT', shutdown);

	return worker;
};

export { startWorker, processSubmission };
export default startWorker;

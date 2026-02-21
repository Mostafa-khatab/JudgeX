import 'dotenv/config';

import express from 'express';
import morgan from 'morgan';

import route from './routes.js';
import { startWorker } from './worker/index.js';

const app = express();

// Check if running in worker mode
const isWorkerMode = false; // HTTP mode: server calls /judge directly (no Redis needed)

app.use(
	express.urlencoded({
		extended: true,
	}),
);

app.use(express.json());

app.use(morgan('combined'));

// Health check endpoint
app.get('/health', (req, res) => {
	res.json({ 
		status: 'healthy', 
		mode: isWorkerMode ? 'worker' : 'http',
		timestamp: new Date().toISOString()
	});
});

route(app);

if (isWorkerMode) {
	// Worker mode: Start BullMQ worker to consume jobs from Redis
	console.log('🔧 Starting in WORKER mode...');
	startWorker()
		.then(() => {
			console.log('✅ Worker started successfully');
		})
		.catch((err) => {
			console.error('❌ Failed to start worker:', err);
			process.exit(1);
		});

	// Also start HTTP server for health checks
	const PORT = process.env.PORT || 8090;
	app.listen(PORT, () => console.log(`📡 Health server listening on port ${PORT}`));
} else {
	// HTTP mode: Traditional synchronous judging (fallback/legacy)
	console.log('🌐 Starting in HTTP mode...');
	const PORT = process.env.PORT || 8090;
	app.listen(PORT, () => console.log(`Judger Server listening on port ${PORT} ${process.env.PORT ? '' : '(default)'}`));
}

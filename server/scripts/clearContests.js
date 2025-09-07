import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import Contest from '../src/models/contest.js';

async function run() {
	try {
		await connectDB();
		await mongoose.connection.asPromise();
		const res = await Contest.deleteMany({});
		console.log(`🗑️  Deleted ${res.deletedCount} contests.`);
	} catch (err) {
		console.error('❌ Clear contests failed:', err);
		process.exitCode = 1;
	} finally {
		await mongoose.connection.close().catch(() => {});
	}
}

run();


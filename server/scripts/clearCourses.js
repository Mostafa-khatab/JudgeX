import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import Course from '../src/models/course.js';

async function run() {
	try {
		await connectDB();
		await mongoose.connection.asPromise();
		const res = await Course.deleteMany({});
		console.log(`🗑️  Deleted ${res.deletedCount} courses.`);
	} catch (err) {
		console.error('❌ Clear courses failed:', err);
		process.exitCode = 1;
	} finally {
		await mongoose.connection.close().catch(() => {});
	}
}

run();


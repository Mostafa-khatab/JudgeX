import mongoose from 'mongoose';

const connectDB = async (retries = 5, delay = 5000) => {
	for (let i = 1; i <= retries; i++) {
		try {
			await mongoose.connect(process.env.DATABASE_URL || 'mongodb://localhost:27017/FloatPoint', {
				serverSelectionTimeoutMS: 10000,
				family: 4, // Force IPv4 — fixes querySrv ECONNREFUSED on Windows
			});
			console.log(`✅ Success connect to db ${process.env.DATABASE_URL ? '' : '(default)'}`);
			return;
		} catch (err) {
			console.error(`❌ Failed to connect to db (attempt ${i}/${retries}):`, err.message);
			if (i < retries) {
				console.log(`⏳ Retrying in ${delay / 1000}s...`);
				await new Promise((r) => setTimeout(r, delay));
			}
		}
	}
	console.error('🚫 Could not connect to MongoDB after all retries. Server running without DB.');
};

export default connectDB;

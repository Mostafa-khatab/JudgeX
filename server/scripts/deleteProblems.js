import mongoose from 'mongoose';
import Problem from '../src/models/problem.js';
import 'dotenv/config';

const MONGO_URI = process.env.MONGO_URI || process.env.DATABASE_URL;

async function deleteAllProblems() {
  try {
    if (!MONGO_URI) {
      throw new Error("MongoDB URI not found. Please set MONGO_URI or DATABASE_URL in .env file");
    }

    await mongoose.connect(MONGO_URI);
    const result = await Problem.deleteMany({});
    console.log(`🗑️ Deleted ${result.deletedCount} problems`);
  } catch (err) {
    console.error('❌ Error deleting problems:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Database connection closed");
  }
}

deleteAllProblems();

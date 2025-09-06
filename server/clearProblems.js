// clearProblems.js
import 'dotenv/config.js'; // يحمّل المتغيرات من .env
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const MODEL_REL_PATH = './src/models/problem.js'; // غيّر لو المسار مختلف
const modelFullPath = path.resolve(process.cwd(), MODEL_REL_PATH);

console.log('Working directory:', process.cwd());
console.log('Checking model file path:', modelFullPath);

if (!fs.existsSync(modelFullPath)) {
  console.error('❌ Model file not found at:', modelFullPath);
  console.error('-> تأكد إن الملف موجود والمسار صحيح. المسار الافتراضي المفروض يكون: src/models/problem.js');
  process.exit(1);
}

try {
  // dynamic import عشان نتجنب ERR_MODULE_NOT_FOUND قبل ما نتحقق
  const imported = await import(MODEL_REL_PATH);
  const Problem = imported.default;
  if (!Problem) {
    console.error('❌ Problem model import succeeded but exported default is falsy.');
    process.exit(1);
  }

  const MONGO_URI = process.env.DATABASE_URL || 'mongodb://localhost:27017/FloatPoint';
  console.log('Using Mongo URI:', MONGO_URI);

  // connect and delete
  await mongoose.connect(MONGO_URI, {
    // خيارات اتصال آمنة؛ mongoose تلقائياً يتعامل مع بعضها
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log('✅ Connected to MongoDB');

  const result = await Problem.deleteMany({});
  console.log(`🗑️ Deleted ${result.deletedCount} problems from the database.`);

  await mongoose.disconnect();
  console.log('✅ Disconnected from MongoDB');
  process.exit(0);
} catch (err) {
  console.error('❌ Error while clearing problems:');
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
}

import 'dotenv/config';
import mongoose from 'mongoose';
import Problem from '../src/models/problem.js';

async function test() {
  await mongoose.connect(process.env.DATABASE_URL);
  console.log('Connected to DB');
  
  const problemId = '2098A';
  console.log('Searching for problem:', problemId);
  
  const problem = await Problem.findOne({ id: problemId });
  if (problem) {
    console.log('✅ Found problem:', problem.name);
  } else {
    console.log('❌ Problem not found');
  }
  
  await mongoose.disconnect();
}

test().catch(console.error);

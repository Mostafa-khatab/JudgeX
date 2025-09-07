// checkProblems.js - Check seeded problems
import mongoose from 'mongoose';
import Problem from '../src/models/problem.js';
import 'dotenv/config';

// Configuration
const CONFIG = {
  mongoURI: process.env.DATABASE_URL || 'mongodb://localhost:27017/FloatPoint'
};

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(CONFIG.mongoURI);
    console.log('✅ MongoDB connected successfully');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
}

// Check problems in database
async function checkProblems() {
  try {
    console.log('🔍 Checking problems in database...\n');
    
    // Get total count
    const totalCount = await Problem.countDocuments();
    console.log(`📊 Total problems in database: ${totalCount}`);
    
    if (totalCount === 0) {
      console.log('❌ No problems found in database');
      return;
    }
    
    // Get problems by difficulty
    const easyCount = await Problem.countDocuments({ difficulty: 'easy' });
    const mediumCount = await Problem.countDocuments({ difficulty: 'medium' });
    const hardCount = await Problem.countDocuments({ difficulty: 'hard' });
    
    console.log(`\n📈 Problems by difficulty:`);
    console.log(`   🟢 Easy: ${easyCount}`);
    console.log(`   🟡 Medium: ${mediumCount}`);
    console.log(`   🔴 Hard: ${hardCount}`);
    
    // Get problems with test cases
    const withTestCases = await Problem.countDocuments({ 
      testcase: { $exists: true, $not: { $size: 0 } } 
    });
    
    console.log(`\n🧪 Problems with test cases: ${withTestCases}`);
    
    // Get recent problems
    const recentProblems = await Problem.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('id name difficulty point tags createdAt');
    
    console.log(`\n📝 Recent problems:`);
    recentProblems.forEach((problem, index) => {
      console.log(`   ${index + 1}. ${problem.name} (${problem.difficulty}, ${problem.point}pts) - ${problem.id}`);
    });
    
    // Get problems by tags
    const tagStats = await Problem.aggregate([
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    console.log(`\n🏷️  Top tags:`);
    tagStats.forEach((tag, index) => {
      console.log(`   ${index + 1}. ${tag._id}: ${tag.count} problems`);
    });
    
    // Get problems by points range
    const pointRanges = [
      { min: 0, max: 500, label: '0-500' },
      { min: 501, max: 1000, label: '501-1000' },
      { min: 1001, max: 1500, label: '1001-1500' },
      { min: 1501, max: 2000, label: '1501-2000' },
      { min: 2001, max: 9999, label: '2000+' }
    ];
    
    console.log(`\n💰 Problems by points:`);
    for (const range of pointRanges) {
      const count = await Problem.countDocuments({
        point: { $gte: range.min, $lte: range.max }
      });
      console.log(`   ${range.label} points: ${count} problems`);
    }
    
  } catch (error) {
    console.error('❌ Error checking problems:', error.message);
  }
}

// Main function
async function main() {
  try {
    console.log('🚀 Starting problem verification...\n');
    
    // Connect to database
    await connectDB();
    
    // Check problems
    await checkProblems();
    
    console.log('\n✅ Problem verification completed!');
    
  } catch (error) {
    console.error('❌ Error in verification process:', error.message);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the script
main().catch(console.error);

export default main;

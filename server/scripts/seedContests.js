import mongoose from 'mongoose';
import Contest from '../src/models/contest.js'; // عدل المسار حسب مكان الموديل

const MONGO_URI = 'mongodb://localhost:27017/FloatPoint'; // عدل حسب اسم الداتا بيز

async function seedContestsWithProblems() {
    try {
      await mongoose.connect(MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
  
      console.log('Connected to MongoDB');
  
      // عدد المسابقات
      const numberOfContests = 3;
      const baseId = 2136;
      const startDate = new Date('2025-09-10T10:00:00Z');
  
      for (let i = 0; i < numberOfContests; i++) {
        const contestId = (baseId + i).toString();
  
        // مثال لمجموعة مشاكل لكل مسابقة
        const problems = [];
        for (let j = 0; j < 3; j++) { // 3 مشاكل لكل مسابقة
          problems.push(`${contestId}${String.fromCharCode(65 + j)}`); // 2136A, 2136B, 2136C
        }
  
        const contest = new Contest({
          id: contestId,
          title: `Contest ${contestId}`,
          description: `This contest contains multiple problems`,
          startTime: new Date(startDate.getTime() + i * 3 * 60 * 60 * 1000), // كل مسابقة بعدها 3 ساعات
          endTime: new Date(startDate.getTime() + (i * 3 + 2) * 60 * 60 * 1000),
          problems: problems,
          participant: [],
          standing: [],
        });
  
        await contest.save();
        console.log(`Contest ${contestId} seeded with problems: ${problems.join(', ')}`);
      }
  
      mongoose.disconnect();
      console.log('All contests seeded with multiple problems!');
    } catch (error) {
      console.error('Error seeding contests:', error);
      mongoose.disconnect();
    }
  }
  
  seedContestsWithProblems();

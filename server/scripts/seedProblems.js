// seedProblems.js
import mongoose from 'mongoose';
import axios from 'axios';
import puppeteer from 'puppeteer';
import Problem from '../src/models/problem.js'; // عدّل المسار حسب مشروعك

// -------------------------
// 1. Connect to MongoDB
// -------------------------
const mongoURI = 'mongodb://localhost:27017/FloatPoint'; // عدّل حسب بياناتك
mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// -------------------------
// 2. Fetch problem statement using Puppeteer
// -------------------------
async function fetchProblemStatement(contestId, index) {
  try {
    const url = `https://codeforces.com/problemset/problem/${contestId}/${index}`;
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // جلب الـ HTML بالكامل للـ statement
    const statementHTML = await page.$eval('.problem-statement', el => el.innerHTML);

    await browser.close();
    return statementHTML || '';
  } catch (err) {
    console.error(`Failed to fetch statement for ${contestId}${index}:`, err.message);
    return '';
  }
}

// -------------------------
// 3. Fetch problems from Codeforces API
// -------------------------
async function fetchProblems(limit = 50) {
  try {
    const res = await axios.get('https://codeforces.com/api/problemset.problems');
    if (res.data.status !== 'OK') throw new Error('Failed to fetch problems');

    const problems = res.data.result.problems.slice(0, limit);
    const problemStatistics = res.data.result.problemStatistics;

    const formattedProblems = [];

    for (const p of problems) {
      const stats = problemStatistics.find(
        (s) => s.contestId === p.contestId && s.index === p.index
      );

      console.log(`Fetching statement for problem: ${p.contestId}${p.index} - ${p.name}`);
      const statement = await fetchProblemStatement(p.contestId, p.index);

      formattedProblems.push({
        id: `${p.contestId}${p.index}`,
        name: p.name,
        tags: p.tags || [],
        public: true,
        contest: [String(p.contestId)],
        point: p.rating || 100,
        timeLimit: 1,
        memoryLimit: 256,
        difficulty: p.rating
          ? p.rating <= 1200
            ? 'easy'
            : p.rating <= 1800
            ? 'medium'
            : 'hard'
          : 'medium',
        noOfSubm: stats ? stats.submitted : 0,
        noOfSuccess: stats ? stats.solved : 0,
        task: statement,
        testcase: [],
      });

      // تأخير بسيط لتجنب الحظر
      await new Promise(r => setTimeout(r, 500));
    }

    return formattedProblems;
  } catch (err) {
    console.error('Error fetching problems:', err.message);
    return [];
  }
}

// -------------------------
// 4. Save problems to MongoDB
// -------------------------
async function saveProblems() {
  const problems = await fetchProblems(50); // أول 50 مشكلة

  for (const p of problems) {
    try {
      await Problem.updateOne(
        { id: p.id },
        { $set: p },
        { upsert: true }
      );
      console.log(`Saved problem: ${p.name}`);
    } catch (err) {
      console.error(`Failed to save problem ${p.name}:`, err.message);
    }
  }

  console.log('All problems processed.');
  mongoose.connection.close();
}

// -------------------------
// Run the script
// -------------------------
saveProblems();

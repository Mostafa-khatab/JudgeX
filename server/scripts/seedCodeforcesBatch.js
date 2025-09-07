import mongoose from 'mongoose';
import puppeteer from 'puppeteer';
import fetch from 'node-fetch';
import Problem from '../src/models/problem.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.DATABASE_URL || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/FloatPoint";
if (!MONGO_URI) { console.error("❌ MongoDB URI not found"); process.exit(1); }

// 📝 جلب قائمة المشاكل من API
async function fetchProblemsList() {
    const res = await fetch(`https://codeforces.com/api/problemset.problems`);
    const data = await res.json();
    if (data.status !== 'OK') return [];
    return data.result.problems;
}

// 📝 جلب نص المشكلة والعينات المرئية
async function fetchProblemPage(contestId, index) {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36');

        const url = `https://codeforces.com/contest/${contestId}/problem/${index}`;
        console.log(`🔍 Fetching: ${url}`);

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
        await page.waitForSelector('.problem-statement', { timeout: 20000 });

        const problemData = await page.evaluate(() => {
            const statement = document.querySelector('.problem-statement');
            if (!statement) return null;

            const inputSpec = statement.querySelector('.input-specification')?.innerText.trim() || '';
            const outputSpec = statement.querySelector('.output-specification')?.innerText.trim() || '';

            let problemParas = [];
            let child = statement.firstElementChild;
            while (child && !child.classList.contains('input-specification')) {
                if (!child.classList.contains('title') && !child.classList.contains('time-limit') && !child.classList.contains('memory-limit')) {
                    problemParas.push(child.innerText.trim());
                }
                child = child.nextElementSibling;
            }
            const problemText = problemParas.join('\n\n');

            const sampleTests = [];
            const sampleInputs = statement.querySelectorAll('.input pre');
            const sampleOutputs = statement.querySelectorAll('.output pre');

            for (let i = 0; i < Math.min(sampleInputs.length, sampleOutputs.length); i++) {
                const stdin = sampleInputs[i].innerText;
                const stdout = sampleOutputs[i].innerText;
                sampleTests.push({ stdin, stdout });
            }

            return { statement: problemText, inputSpec, outputSpec, sampleTests };
        });

        return problemData;
    } catch (err) {
        console.error(`❌ Error fetching page ${contestId}${index}:`, err.message);
        return null;
    } finally {
        await browser.close();
    }
}

// 🚀 السكريبت الرئيسي
(async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected to MongoDB");

        const allProblems = await fetchProblemsList();
        const problemsToFetch = allProblems.slice(0, 300); // أول 300 مشكلة

        for (const problemMeta of problemsToFetch) {
            const { contestId, index, name, rating, tags } = problemMeta;
            const pageData = await fetchProblemPage(contestId, index);

            if (!pageData) {
                console.log(`⚠️ Skipped problem ${contestId}${index}`);
                continue;
            }

            const points = rating ? Math.round(rating / 100) : 1;
            let difficulty = 'easy';
            if (rating >= 1800) difficulty = 'hard';
            else if (rating >= 1000) difficulty = 'medium';

            const details = {
                title: name,
                timeLimit: problemMeta.timeLimitSeconds || 1,
                memoryLimit: problemMeta.memoryLimitBytes ? problemMeta.memoryLimitBytes / 1024 / 1024 : 256,
                ...pageData,
                points,
                difficulty,
                tags: tags || [] // إضافة التاجز من API
            };

            const formattedTask = `
**Time limit per test:** ${details.timeLimit} seconds  
**Memory limit per test:** ${details.memoryLimit} MB  
**Points:** ${details.points}  
**Difficulty:** ${details.difficulty}
**Tags:** ${details.tags.join(', ')}

## Problem Statement
${details.statement}

## Input
${details.inputSpec}

## Output
${details.outputSpec}

## Examples
${details.sampleTests.map((t, i) => `**Example ${i + 1}:**

Input:
\`\`\`
${t.stdin}
\`\`\`

Output:
\`\`\`
${t.stdout}
\`\`\``).join('\n\n')}
`;

            const problem = new Problem({
                id: `${contestId}${index}`,
                name: details.title,
                contest: [String(contestId)],
                timeLimit: details.timeLimit,
                memoryLimit: details.memoryLimit,
                task: formattedTask,
                testcase: details.sampleTests,
                points: details.points,
                difficulty: details.difficulty,
                tags: details.tags,
                public: true // جميع المشاكل Public
            });

            await problem.save();
            console.log(`✅ Saved problem ${contestId}${index} as public`);
        }

    } catch (err) {
        console.error("❌ Database error:", err.message);
    } finally {
        await mongoose.disconnect();
        console.log("🔌 Disconnected from MongoDB");
    }
})();

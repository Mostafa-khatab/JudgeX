import mongoose from 'mongoose';
import puppeteer from 'puppeteer';
import fetch from 'node-fetch';
import TurndownService from 'turndown';
import Problem from '../src/models/problem.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URI = process.env.DATABASE_URL || "mongodb://127.0.0.1:27017/FloatPoint";

// Initialize Turndown service
const turndownService = new TurndownService();

// Fetch problem list from Codeforces API
async function fetchProblemsList() {
    try {
        const res = await fetch(`https://codeforces.com/api/problemset.problems`);
        const data = await res.json();
        if (data.status !== 'OK') return [];
        // Filter out problems without rating (often unrated/training)
        return data.result.problems.filter(p => p.rating !== undefined);
    } catch (err) {
        console.error("Failed to fetch problem list:", err.message);
        return [];
    }
}

// Scrape problem page
async function fetchProblemPage(browser, contestId, index) {
    const page = await browser.newPage();
    try {
        // Set user agent to avoid bot detection
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

        const url = `https://codeforces.com/contest/${contestId}/problem/${index}`;
        console.log(`🔍 Fetching: ${url}`);

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        
        // Wait for usage of the selector
        try {
            await page.waitForSelector('.problem-statement', { timeout: 10000 });
        } catch (e) {
            console.warn(`⚠️ Problem statement not found for ${contestId}${index}`);
            return null;
        }

        const problemData = await page.evaluate(() => {
            const statement = document.querySelector('.problem-statement');
            if (!statement) return null;

            // Helper to get innerHTML of a query
            const getHtml = (sel) => {
                const el = statement.querySelector(sel);
                return el ? el.innerHTML : '';
            };

            const header = statement.querySelector('.header');
            let info = { timeLimit: '', memoryLimit: '', inputFile: '', outputFile: '' };
            
            if (header) {
                const timeLimitEl = header.querySelector('.time-limit');
                const memoryLimitEl = header.querySelector('.memory-limit');
                if (timeLimitEl) info.timeLimit = timeLimitEl.innerText.replace('time limit per test', '').trim();
                if (memoryLimitEl) info.memoryLimit = memoryLimitEl.innerText.replace('memory limit per test', '').trim();
            }

            // Get all sections
            const title = header ? header.querySelector('.title').innerText : '';
            
            // Statement text: usually generic paragraphs before input-spec
            // We'll grab the raw HTML of the children divs that assume structure
            // Codeforces usually has <div> (statement) <div> (input) <div> (output) <div> (sample) <div> (note)
            
            const children = Array.from(statement.children);
            let statementHtml = '';
            let inputHtml = '';
            let outputHtml = '';
            
            let currentSection = 'statement'; // statement, input, output, note
            
            children.forEach(child => {
                if (child.classList.contains('header')) return;
                
                if (child.classList.contains('input-specification')) {
                    const title = child.querySelector('.section-title');
                    if (title) title.remove();
                    inputHtml = child.innerHTML;
                    return;
                }
                if (child.classList.contains('output-specification')) {
                    const title = child.querySelector('.section-title');
                    if (title) title.remove();
                    outputHtml = child.innerHTML;
                    return;
                }
                if (child.classList.contains('sample-tests')) {
                    return; // Handled separately
                }
                if (child.classList.contains('note')) {
                    return; // Skip note for now or append to statement
                }
                
                if (currentSection === 'statement') {
                   statementHtml += child.outerHTML;
                }
            });

            // Sample tests
            const sampleTests = [];
            const sampleInputs = statement.querySelectorAll('.sample-test .input pre');
            const sampleOutputs = statement.querySelectorAll('.sample-test .output pre');

            for (let i = 0; i < Math.min(sampleInputs.length, sampleOutputs.length); i++) {
                // Use innerText to get newlines correctly, but be careful with <br>
                const stdin = sampleInputs[i].innerText.trim();
                const stdout = sampleOutputs[i].innerText.trim();
                sampleTests.push({ stdin, stdout });
            }

            return { 
                title,
                statementHtml, 
                inputHtml, 
                outputHtml, 
                sampleTests,
                info
            };
        });

        if (!problemData) return null;

        return problemData;

    } catch (err) {
        console.error(`❌ Error fetching page ${contestId}${index}:`, err.message);
        return null;
    } finally {
        await page.close();
    }
}

// Main Script
(async () => {
    let browser;
    try {
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected to MongoDB");

        console.log("🚀 Launching browser...");
        browser = await puppeteer.launch({ 
            headless: "new", 
            args: ['--no-sandbox', '--disable-setuid-sandbox'] 
        });

        console.log("📥 Fetching problem list...");
        const allProblems = await fetchProblemsList();
        console.log(`Found ${allProblems.length} problems via API.`);

        // Sort by contestId descending (newest first)
        allProblems.sort((a, b) => b.contestId - a.contestId);
        
        let processedCount = 0;
        const TARGET_COUNT = 50; 
        
        for (const problemMeta of allProblems) {
            if (processedCount >= TARGET_COUNT) break;

            const { contestId, index, name, rating, tags } = problemMeta;
            const problemId = `${contestId}${index}`;

            // Check if exists
            const existing = await Problem.findOne({ id: problemId });
            if (existing) {
                console.log(`⏭️  Skipping/Existing: ${problemId}`);
                continue;
            }

            const pageData = await fetchProblemPage(browser, contestId, index);

            if (!pageData) {
                console.log(`⚠️ Skipped problem ${problemId} (failed to parse)`);
                continue;
            }

            // Convert HTML to Markdown
            const statementMd = turndownService.turndown(pageData.statementHtml);
            const inputMd = turndownService.turndown(pageData.inputHtml);
            const outputMd = turndownService.turndown(pageData.outputHtml);
            
            // Format for JudgeX Task
            const formattedTask = `## ${pageData.title}
            
${statementMd}

### Input
${inputMd}

### Output
${outputMd}

### Examples
${pageData.sampleTests.map((t, i) => `#### Example ${i + 1}
**Input**
\`\`\`
${t.stdin}
\`\`\`
**Output**
\`\`\`
${t.stdout}
\`\`\`
`).join('\n')}
`;

            // Calculate difficulty
            let difficulty = 'easy';
            if (rating >= 2000) difficulty = 'hard';
            else if (rating >= 1400) difficulty = 'medium';

            // Parse Limits (e.g., "1.0 s", "256 MB")
            const timeLimit = parseFloat(pageData.info.timeLimit) || 1; 
            const memoryLimit = parseFloat(pageData.info.memoryLimit) || 256;

            const problem = new Problem({
                id: problemId,
                name: pageData.title || name,
                contest: [String(contestId)],
                timeLimit: timeLimit,
                memoryLimit: memoryLimit,
                task: formattedTask,
                testcase: pageData.sampleTests,
                point: rating ? Math.round(rating / 100) * 100 : 100, // Round to nearest 100
                difficulty: difficulty,
                tags: tags || [],
                public: true,
                noOfSubm: 0,
                noOfSuccess: 0
            });

            await problem.save();
            console.log(`✅ Saved problem ${problemId} (${name})`);
            processedCount++;

            // Wait a bit to be nice to Codeforces
            await new Promise(r => setTimeout(r, 2000));
        }

    } catch (err) {
        console.error("❌ Database/Script error:", err);
    } finally {
        if (browser) await browser.close();
        await mongoose.disconnect();
        console.log("🔌 Disconnected from MongoDB");
    }
})();

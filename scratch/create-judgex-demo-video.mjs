import fs from 'node:fs/promises';
import path from 'node:path';
import puppeteer from '../server/node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';

const ROOT = path.resolve(process.cwd());
const OUT_DIR = path.join(ROOT, 'scratch', 'demo-video');
const FRAME_DIR = path.join(OUT_DIR, 'frames');
const VIDEO_PATH = path.join(OUT_DIR, 'judgex-demo.webm');
const CLIENT_URL = 'http://localhost:5173';
const ADMIN_URL = 'http://localhost:5174';
const API_URL = 'http://localhost:8080';

await fs.mkdir(FRAME_DIR, { recursive: true });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getJson(url, fallback) {
	try {
		const res = await fetch(url);
		if (!res.ok) return fallback;
		return await res.json();
	} catch {
		return fallback;
	}
}

const problemsPayload = await getJson(`${API_URL}/problem`, { data: [] });
const contestsPayload = await getJson(`${API_URL}/contest`, { data: [] });
const coursesPayload = await getJson(`${API_URL}/course`, { data: [] });
const problem = problemsPayload.data?.[0] || { id: 'demo', name: 'Demo Problem' };
const contest = contestsPayload.data?.[0] || { id: 'demo' };
const course = coursesPayload.data?.[0] || { _id: 'demo' };

const browser = await puppeteer.launch({
	headless: 'new',
	defaultViewport: { width: 1366, height: 768 },
	args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required'],
});

const page = await browser.newPage();
await page.setRequestInterception(true);
page.on('request', (request) => {
	const url = request.url();
	const method = request.method();

	if (url === `${API_URL}/auth` && method === 'GET') {
		return request.respond({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({
				success: true,
				data: {
					_id: 'demo-user',
					name: 'demo_coder',
					fullname: 'Demo Coder',
					email: 'demo@judgex.local',
					role: 'user',
					totalScore: 1280,
					joiningContest: null,
				},
			}),
		});
	}

	if (url === `${API_URL}/code/run` && method === 'POST') {
		return request.respond({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({
				success: true,
				data: {
					output: 'All sample tests passed',
					status: 'Accepted',
					time: '46 ms',
					memory: '12 MB',
				},
			}),
		});
	}

	if (url === `${API_URL}/submission/submit` && method === 'POST') {
		return request.respond({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({
				success: true,
				data: { _id: 'demo-submission', verdict: 'Accepted', score: 100 },
				msg: 'Submission accepted',
			}),
		});
	}

	if (url === `${API_URL}/chatbot/message` && method === 'POST') {
		return request.respond({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({
				success: true,
				data: {
					message: 'Hint: start from the constraints, choose the right data structure, then validate with the sample tests.',
				},
			}),
		});
	}

	request.continue();
});

async function prep() {
	await page.evaluateOnNewDocument(() => {
		localStorage.setItem('token', 'demo-token');
		localStorage.setItem('theme', 'dark');
		localStorage.setItem('lang', 'en');
	});
}

async function capture(name, title, description, wait = 900) {
	await sleep(wait);
	const file = path.join(FRAME_DIR, `${String(slides.length + 1).padStart(2, '0')}-${name}.png`);
	await page.screenshot({ path: file, fullPage: false });
	slides.push({ file, title, description });
	console.log(`Captured: ${title}`);
}

async function goto(url) {
	await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
}

await prep();
const slides = [];

await goto(`${CLIENT_URL}/`);
await capture('welcome', 'JudgeX Landing', 'Entry point with quick access to practice, contests, auth, and the platform story.');

await goto(`${CLIENT_URL}/home`);
await capture('home', 'Personal Dashboard', 'Authenticated home dashboard with activity stats, roadmap entry points, AI lab, and daily practice modules.');

await goto(`${CLIENT_URL}/problems`);
await capture('problems', 'Problem Bank', 'Browse coding problems with difficulty, tags, status, and quick navigation into a selected challenge.');
const searchInput = await page.$('input[placeholder*="Search"], input[type="search"], input');
if (searchInput) {
	await searchInput.click();
	await searchInput.type(problem.name?.split(' ')?.[0] || 'A');
	await capture('problem-search', 'Problem Search', 'Search and filtering make the practice list easier to narrow down.');
}

await goto(`${CLIENT_URL}/problem/${problem.id}`);
await capture('problem-detail', 'Problem Details', 'Statement, constraints, examples, metadata, and the Solve action are collected in one view.');

await goto(`${CLIENT_URL}/problem/${problem.id}/solve`);
await capture('solve-editor', 'Solve Workspace', 'LeetCode-style split view with statement, language selector, Monaco editor, run, submit, and submission history.');
const buttons = await page.$$('button');
for (const button of buttons) {
	const text = await page.evaluate((el) => el.innerText || el.textContent || '', button);
	if (/run/i.test(text)) {
		await button.click();
		await capture('run-code', 'Run Code', 'Sample execution is triggered from the editor and returns immediate feedback.');
		break;
	}
}
for (const button of await page.$$('button')) {
	const text = await page.evaluate((el) => el.innerText || el.textContent || '', button);
	if (/submit/i.test(text)) {
		await button.click();
		await capture('submit-code', 'Submit Solution', 'Final submission flow returns a verdict and links back to detailed submission history.');
		break;
	}
}

await goto(`${CLIENT_URL}/submissions`);
await capture('submissions', 'Submissions', 'Global submission history can be filtered by user, problem, contest, verdict, and language.');

await goto(`${CLIENT_URL}/contests`);
await capture('contests', 'Contests', 'Contest discovery page lists scheduled contests and opens standings/problem sets.');
await goto(`${CLIENT_URL}/contest/${contest.id}`);
await capture('contest-detail', 'Contest Detail', 'Contest page combines problems, participant context, standings, and user contest actions.');

await goto(`${CLIENT_URL}/courses`);
await capture('courses', 'Courses', 'Learning content is organized into courses with lessons and external resources.');
await goto(`${CLIENT_URL}/course/${course._id}`);
await capture('course-detail', 'Course Detail', 'Individual course pages expose modules, resources, and progress-oriented learning material.');

await goto(`${CLIENT_URL}/users`);
await capture('leaderboard', 'Leaderboard', 'User rankings and profile links highlight competitive progress across the platform.');

await goto(`${CLIENT_URL}/interview`);
await capture('interview', 'Interview System', 'Authenticated interview area supports coding rooms, collaboration, video/signaling, chat, and candidate evaluation workflows.');

await goto(`${ADMIN_URL}/login`);
await capture('admin-login', 'Admin Console', 'Separate admin app for managing problems, contests, submissions, users, and course content.');

const composer = await browser.newPage();
await composer.setViewport({ width: 1366, height: 768 });
const slideInputs = await Promise.all(
	slides.map(async (slide) => ({
		...slide,
		dataUrl: `data:image/png;base64,${await fs.readFile(slide.file, 'base64')}`,
	})),
);

const videoBase64 = await composer.evaluate(async ({ slideInputs }) => {
	const width = 1366;
	const height = 768;
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	document.body.appendChild(canvas);
	const ctx = canvas.getContext('2d');
	const stream = canvas.captureStream(30);
	const chunks = [];
	const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
	recorder.ondataavailable = (event) => {
		if (event.data.size > 0) chunks.push(event.data);
	};
	const loadImage = (src) =>
		new Promise((resolve, reject) => {
			const img = new Image();
			img.onload = () => resolve(img);
			img.onerror = reject;
			img.src = src;
		});
	const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
	const drawSlide = (img, slide, progress) => {
		ctx.fillStyle = '#07111f';
		ctx.fillRect(0, 0, width, height);
		ctx.globalAlpha = 0.92;
		ctx.drawImage(img, 0, 0, width, height);
		ctx.globalAlpha = 1;
		const barHeight = 118;
		ctx.fillStyle = 'rgba(5, 12, 23, 0.86)';
		ctx.fillRect(0, height - barHeight, width, barHeight);
		ctx.fillStyle = '#38bdf8';
		ctx.fillRect(0, height - 6, Math.max(1, width * progress), 6);
		ctx.font = '700 34px Arial, sans-serif';
		ctx.fillStyle = '#ffffff';
		ctx.fillText(slide.title, 42, height - 70);
		ctx.font = '400 21px Arial, sans-serif';
		ctx.fillStyle = '#dbeafe';
		ctx.fillText(slide.description, 42, height - 34);
	};
	recorder.start();
	const images = [];
	for (const slide of slideInputs) images.push(await loadImage(slide.dataUrl));
	for (let i = 0; i < slideInputs.length; i += 1) {
		for (let frame = 0; frame < 75; frame += 1) {
			drawSlide(images[i], slideInputs[i], (i + frame / 75) / slideInputs.length);
			await wait(33);
		}
	}
	recorder.stop();
	await new Promise((resolve) => {
		recorder.onstop = resolve;
	});
	const blob = new Blob(chunks, { type: 'video/webm' });
	const buffer = await blob.arrayBuffer();
	let binary = '';
	const bytes = new Uint8Array(buffer);
	for (let i = 0; i < bytes.byteLength; i += 1) binary += String.fromCharCode(bytes[i]);
	return btoa(binary);
}, { slideInputs });

await fs.writeFile(VIDEO_PATH, Buffer.from(videoBase64, 'base64'));
await browser.close();

console.log(`Video written to ${VIDEO_PATH}`);

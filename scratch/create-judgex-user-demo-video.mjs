import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import puppeteer from '../server/node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';

const execFileAsync = promisify(execFile);

const ROOT = path.resolve(process.cwd());
const OUT_DIR = path.join(ROOT, 'scratch', 'user-demo-video');
const FRAME_DIR = path.join(OUT_DIR, 'frames');
const VIDEO_PATH = path.join(OUT_DIR, 'judgex-user-demo-with-voice.webm');
const AUDIO_PATH = path.join(OUT_DIR, 'voiceover.wav');
const NARRATION_PATH = path.join(OUT_DIR, 'voiceover.txt');
const CLIENT_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:8080';

await fs.mkdir(FRAME_DIR, { recursive: true });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function readCredentials() {
	const rl = readline.createInterface({ input, output, terminal: true });
	const email = (await rl.question('Email: ')).trim();
	const password = (await rl.question('Password: ')).trim();
	rl.close();
	if (!email || !password) {
		throw new Error('Expected both email and password.');
	}
	return { email, password };
}

async function getJson(url, fallback) {
	try {
		const res = await fetch(url);
		if (!res.ok) return fallback;
		return await res.json();
	} catch {
		return fallback;
	}
}

async function clickText(page, pattern, timeout = 2500) {
	const handles = await page.$$('button, [role="button"]');
	for (const handle of handles) {
		const text = await page.evaluate((el) => (el.innerText || el.textContent || el.getAttribute('aria-label') || '').trim(), handle);
		if (pattern.test(text)) {
			await handle.click();
			await sleep(timeout);
			return true;
		}
	}
	return false;
}

async function safeGoto(page, url) {
	await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 }).catch(async () => {
		await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
	});
	await sleep(900);
}

async function capture(page, slides, name, titleAr, captionAr, spoken, duration = 5) {
	const file = path.join(FRAME_DIR, `${String(slides.length + 1).padStart(2, '0')}-${name}.png`);
	await page.screenshot({ path: file, fullPage: false });
	slides.push({ file, titleAr, captionAr, spoken, duration });
	console.log(`Captured: ${titleAr}`);
}

async function createVoiceover(slides) {
	const spokenText = slides
		.map((slide, index) => `Part ${index + 1}. ${slide.spoken}`)
		.join('\r\n\r\n');
	await fs.writeFile(NARRATION_PATH, spokenText, 'utf8');

	const ps = `
Add-Type -AssemblyName System.Speech
$s = New-Object System.Speech.Synthesis.SpeechSynthesizer
$s.SelectVoice('Microsoft David Desktop')
$s.Rate = -1
$s.Volume = 100
$text = Get-Content -LiteralPath '${NARRATION_PATH.replace(/'/g, "''")}' -Raw
$s.SetOutputToWaveFile('${AUDIO_PATH.replace(/'/g, "''")}')
$s.Speak($text)
$s.Dispose()
`;
	await execFileAsync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', ps], { cwd: ROOT, windowsHide: true });
}

async function composeVideo(slides) {
	const composer = await puppeteer.launch({
		headless: 'new',
		defaultViewport: { width: 1366, height: 768 },
		args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
	});
	const page = await composer.newPage();
	await page.setViewport({ width: 1366, height: 768 });

	const slideInputs = await Promise.all(
		slides.map(async (slide) => ({
			...slide,
			dataUrl: `data:image/png;base64,${await fs.readFile(slide.file, 'base64')}`,
		})),
	);
	const audioDataUrl = `data:audio/wav;base64,${await fs.readFile(AUDIO_PATH, 'base64')}`;

	const videoBase64 = await page.evaluate(async ({ slideInputs, audioDataUrl }) => {
		const width = 1366;
		const height = 768;
		const canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;
		document.body.appendChild(canvas);
		const ctx = canvas.getContext('2d');

		const loadImage = (src) =>
			new Promise((resolve, reject) => {
				const img = new Image();
				img.onload = () => resolve(img);
				img.onerror = reject;
				img.src = src;
			});
		const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
		const images = [];
		for (const slide of slideInputs) images.push(await loadImage(slide.dataUrl));

		const audioContext = new AudioContext();
		const audioBuffer = await fetch(audioDataUrl)
			.then((res) => res.arrayBuffer())
			.then((buffer) => audioContext.decodeAudioData(buffer));
		const source = audioContext.createBufferSource();
		source.buffer = audioBuffer;
		const destination = audioContext.createMediaStreamDestination();
		source.connect(destination);
		source.connect(audioContext.destination);

		const canvasStream = canvas.captureStream(30);
		const stream = new MediaStream([
			...canvasStream.getVideoTracks(),
			...destination.stream.getAudioTracks(),
		]);
		const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
			? 'video/webm;codecs=vp9,opus'
			: 'video/webm;codecs=vp8,opus';
		const chunks = [];
		const recorder = new MediaRecorder(stream, { mimeType });
		recorder.ondataavailable = (event) => {
			if (event.data.size > 0) chunks.push(event.data);
		};

		const totalPlanned = slideInputs.reduce((sum, slide) => sum + slide.duration, 0);
		const totalDuration = Math.max(totalPlanned, audioBuffer.duration + 1);
		const plannedScale = totalDuration / totalPlanned;
		const durations = slideInputs.map((slide) => slide.duration * plannedScale);
		const cumulative = durations.reduce((acc, duration) => {
			acc.push((acc.at(-1) || 0) + duration);
			return acc;
		}, []);

		const wrapText = (text, maxWidth, font) => {
			ctx.font = font;
			const words = text.split(/\s+/);
			const lines = [];
			let line = '';
			for (const word of words) {
				const test = line ? `${line} ${word}` : word;
				if (ctx.measureText(test).width > maxWidth && line) {
					lines.push(line);
					line = word;
				} else {
					line = test;
				}
			}
			if (line) lines.push(line);
			return lines;
		};

		const drawSlide = (img, slide, index, slideProgress, overallProgress) => {
			ctx.fillStyle = '#07111f';
			ctx.fillRect(0, 0, width, height);
			const zoom = 1 + slideProgress * 0.018;
			const zw = width * zoom;
			const zh = height * zoom;
			ctx.drawImage(img, (width - zw) / 2, (height - zh) / 2, zw, zh);

			const panelHeight = 154;
			const gradient = ctx.createLinearGradient(0, height - panelHeight, 0, height);
			gradient.addColorStop(0, 'rgba(3, 7, 18, 0.25)');
			gradient.addColorStop(0.35, 'rgba(3, 7, 18, 0.86)');
			gradient.addColorStop(1, 'rgba(3, 7, 18, 0.96)');
			ctx.fillStyle = gradient;
			ctx.fillRect(0, height - panelHeight, width, panelHeight);

			ctx.fillStyle = '#38bdf8';
			ctx.fillRect(0, height - 7, Math.max(1, width * overallProgress), 7);

			ctx.fillStyle = 'rgba(56, 189, 248, 0.95)';
			ctx.beginPath();
			ctx.roundRect(42, height - 133, 78, 30, 15);
			ctx.fill();
			ctx.font = '700 16px Arial, sans-serif';
			ctx.fillStyle = '#04111f';
			ctx.fillText(`${index + 1}/${slideInputs.length}`, 64, height - 112);

			ctx.font = '700 34px Arial, sans-serif';
			ctx.fillStyle = '#ffffff';
			ctx.direction = 'rtl';
			ctx.textAlign = 'right';
			ctx.fillText(slide.titleAr, width - 42, height - 101);

			const captionFont = '400 23px Arial, sans-serif';
			const lines = wrapText(slide.captionAr, width - 84, captionFont).slice(0, 2);
			ctx.font = captionFont;
			ctx.fillStyle = '#e0f2fe';
			lines.forEach((line, lineIndex) => {
				ctx.fillText(line, width - 42, height - 61 + lineIndex * 31);
			});
			ctx.direction = 'ltr';
			ctx.textAlign = 'left';
		};

		recorder.start();
		source.start();
		await audioContext.resume();
		const started = performance.now();
		let elapsed = 0;
		while (elapsed < totalDuration) {
			elapsed = (performance.now() - started) / 1000;
			const index = Math.min(cumulative.findIndex((end) => elapsed <= end), slideInputs.length - 1);
			const safeIndex = index < 0 ? slideInputs.length - 1 : index;
			const slideStart = safeIndex === 0 ? 0 : cumulative[safeIndex - 1];
			const slideProgress = Math.min(1, Math.max(0, (elapsed - slideStart) / durations[safeIndex]));
			drawSlide(images[safeIndex], slideInputs[safeIndex], safeIndex, slideProgress, Math.min(1, elapsed / totalDuration));
			await wait(33);
		}
		recorder.stop();
		await new Promise((resolve) => {
			recorder.onstop = resolve;
		});
		source.stop();
		await audioContext.close();
		const blob = new Blob(chunks, { type: mimeType });
		const buffer = await blob.arrayBuffer();
		let binary = '';
		const bytes = new Uint8Array(buffer);
		for (let i = 0; i < bytes.byteLength; i += 1) binary += String.fromCharCode(bytes[i]);
		return btoa(binary);
	}, { slideInputs, audioDataUrl });

	await fs.writeFile(VIDEO_PATH, Buffer.from(videoBase64, 'base64'));
	await composer.close();
}

const { email, password } = await readCredentials();
const problemsPayload = await getJson(`${API_URL}/problem`, { data: [] });
const contestsPayload = await getJson(`${API_URL}/contest`, { data: [] });
const coursesPayload = await getJson(`${API_URL}/course`, { data: [] });
const problem = problemsPayload.data?.find((item) => item.testcase?.length) || problemsPayload.data?.[0] || { id: '2097E', name: 'Clearing the Snowdrift' };
const contest = contestsPayload.data?.[0] || { id: '2136' };
const course = coursesPayload.data?.[0] || { _id: '68bd77b6a0d6f9daad0c34f4' };

const browser = await puppeteer.launch({
	headless: 'new',
	defaultViewport: { width: 1366, height: 768 },
	args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required'],
});

const page = await browser.newPage();
await page.setRequestInterception(true);
page.on('request', (request) => {
	const url = request.url();
	if (url === `${API_URL}/chatbot/message` && request.method() === 'POST') {
		return request.respond({
			status: 200,
			headers: {
				'Access-Control-Allow-Origin': CLIENT_URL,
				'Access-Control-Allow-Credentials': 'true',
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				success: true,
				data: {
					message: 'Hint: read the constraints first, identify the core data structure, then test your idea on the samples before submitting.',
				},
			}),
		});
	}
	request.continue();
});

const slides = [];

await safeGoto(page, `${CLIENT_URL}/login`);
await capture(page, slides, 'login', 'تسجيل الدخول', 'بنبدأ كيوزر حقيقي: المستخدم يدخل بالإيميل والباسورد عشان تظهر له الصفحات المحمية والـ dashboard الشخصي.', 'Ahlan beek. Hena benebda demo JudgeX men login page. El user beyedkhol bel email wel password, ashan negrrab el website ka user haqiqi.', 5);
await page.type('input[type="email"]', email, { delay: 18 });
await page.type('input[type="password"]', password, { delay: 18 });
await clickText(page, /^login$/i, 4500);
await page.waitForFunction(() => location.pathname !== '/login', { timeout: 20000 }).catch(() => {});

await safeGoto(page, `${CLIENT_URL}/home`);
await capture(page, slides, 'dashboard', 'Dashboard المستخدم', 'هنا مركز التحكم: إحصائيات سريعة، Daily Challenge، مسابقات قادمة، وأفضل المستخدمين.', 'Baad el login, di el dashboard. Hena el user yeshof el activity, daily challenge, upcoming contests, we top users.', 6);

await safeGoto(page, `${CLIENT_URL}/home?tab=roadmap`);
await capture(page, slides, 'roadmap', 'Roadmap التعلم', 'الـ Roadmap بترتب رحلة التعلم إلى topics وخطوات واضحة، وتساعد المستخدم يعرف يبدأ منين ويكمل إزاي.', 'El roadmap beyqassem tareeq el taallom le topics wa khotawat. Da beysaaed el user yaaraf yebda menen we yekammel ezzay.', 6);

await safeGoto(page, `${CLIENT_URL}/home?tab=ailab`);
await capture(page, slides, 'ai-lab', 'AI Lab', 'منطقة أدوات الذكاء الاصطناعي: توليد مسارات، مساعدات تعليمية، وتجارب تساعد في التدريب والتحليل.', 'El AI lab feeh tools zay roadmap generation, learning helpers, we experiments tesaaed fel practice wel analysis.', 6);

await safeGoto(page, `${CLIENT_URL}/problems`);
await capture(page, slides, 'problem-bank', 'بنك المسائل', 'صفحة Problems بتعرض المسائل مع الصعوبة والتاجز والحالة، وتخلي المستخدم يفلتر ويدور بسرعة.', 'Di problem bank. El user yeshof el difficulty, tags, status, we yefilter aw yedawwar ala problem besor3a.', 6);
const firstSearch = await page.$('input[placeholder*="Search"], input[type="search"], input');
if (firstSearch) {
	await firstSearch.click();
	await firstSearch.type(problem.name?.split(' ')?.[0] || 'snow', { delay: 20 });
	await sleep(1000);
	await capture(page, slides, 'problem-search', 'البحث والفلترة', 'جربنا البحث داخل بنك المسائل، وده مهم لما عدد المسائل يكبر والمستخدم يدور حسب الاسم أو الموضوع.', 'Hena bengarrab search. Lama el problems tekbar, el filter we search beykhaloo el user yewsal lel problem aw el topic besor3a.', 5);
}

await safeGoto(page, `${CLIENT_URL}/problem/${problem.id}`);
await capture(page, slides, 'problem-detail', 'تفاصيل المسألة', 'صفحة المسألة فيها الوصف، القيود، الوقت والذاكرة، التاجز، الإحصائيات، وزر الدخول للحل.', 'Di problem details page. Feeha statement, constraints, time limit, memory limit, tags, statistics, we solve action.', 6);

await safeGoto(page, `${CLIENT_URL}/problem/${problem.id}/solve`);
await capture(page, slides, 'solve-workspace', 'مساحة الحل', 'واجهة حل شبه LeetCode: الوصف شمال، المحرر يمين، اختيار اللغة، وأزرار Run و Submit.', 'Di solve workspace. Problem statement shmal, code editor yemeen, language selector, run button, we submit button.', 6);
await clickText(page, /^run$/i, 5000);
await capture(page, slides, 'run-code', 'تجربة Run', 'ضغطنا Run عشان نجرب الكود على test cases ونشوف النتيجة قبل الإرسال النهائي.', 'Hena bengarrab Run. El code yetshaghal ala sample test cases, we el user yeshof output we expected output qabl el submit.', 6);
await clickText(page, /^submit$/i, 5000);
await capture(page, slides, 'submit-code', 'تجربة Submit', 'ضغطنا Submit عشان يروح الحل للـ judge ويتسجل في submissions مع verdict ووقت وذاكرة.', 'Baad keda bengarrab Submit. El solution betetbaat lel judge, we tetseggel fel submissions ma3 verdict, time, we memory.', 6);

const chatButton = await page.$('button[aria-label="Open assistant"], button[aria-label="Close assistant"]');
if (chatButton) {
	await chatButton.click();
	await sleep(1000);
	const textarea = await page.$('textarea');
	if (textarea) {
		await textarea.type('Give me a hint for this problem', { delay: 18 });
		await page.keyboard.press('Enter');
		await sleep(2200);
	}
	await capture(page, slides, 'assistant', 'Neural Assistant', 'جربنا المساعد الذكي داخل صفحة الحل: بيقرأ سياق المسألة والكود ويساعد بتلميحات وخطوات تفكير.', 'Hena bengarrab Neural Assistant. Beyefham context beta3 el problem wel code, we yeddi hints we debugging guidance.', 7);
}

await safeGoto(page, `${CLIENT_URL}/submissions`);
await capture(page, slides, 'submissions', 'Submissions', 'هنا المستخدم يراجع كل الإرسالات، يفلتر حسب المشكلة أو اللغة أو الحالة، ويفتح تفاصيل كل submission.', 'Di submissions page. El user yeraage3 kol el attempts, yefilter by problem, language, aw verdict, we yeftah details.', 6);

await safeGoto(page, `${CLIENT_URL}/contests`);
await capture(page, slides, 'contests', 'المسابقات', 'صفحة Contests بتعرض المسابقات ومواعيدها، ومنها يدخل المستخدم على صفحة المسابقة والـ standings.', 'Di contests page. Betعرض contests, start time, end time, we tedkhallak ala contest page wel standings.', 6);
await safeGoto(page, `${CLIENT_URL}/contest/${contest.id}`);
await capture(page, slides, 'contest-detail', 'تفاصيل المسابقة', 'داخل المسابقة تظهر المسائل، حالة المشاركة، والـ standing لمتابعة ترتيب المشاركين.', 'Gowa contest page, el user yeshof problems, participation state, we standings ashan yetabe3 el ranking.', 6);

await safeGoto(page, `${CLIENT_URL}/courses`);
await capture(page, slides, 'courses', 'الكورسات', 'جزء Courses منظم للمحتوى التعليمي: كورسات، وصف، مصادر، وروابط تساعد المستخدم يتعلم بجانب حل المسائل.', 'El courses section monazzam lel learning content. Courses, descriptions, resources, we links tesaaed el user yetaalem.', 6);
await safeGoto(page, `${CLIENT_URL}/course/${course._id}`);
await capture(page, slides, 'course-detail', 'صفحة الكورس', 'صفحة الكورس بتعرض تفاصيل المحتوى والموارد المرتبطة به، فتخلي التدريب مش مجرد حل عشوائي.', 'Course details page betعرض el content wel resources, fa el practice mayebqash random, yebqa learning path.', 6);

await safeGoto(page, `${CLIENT_URL}/users`);
await capture(page, slides, 'leaderboard', 'Leaderboard والمستخدمين', 'صفحة Users بتوضح ترتيب المستخدمين وسكور كل واحد، وده يضيف جانب تنافسي للموقع.', 'Users page betعرض leaderboard we scores. Da beyضيف competitive side lel platform.', 5);

await safeGoto(page, `${CLIENT_URL}/interview`);
await capture(page, slides, 'interview', 'نظام المقابلات', 'جزء Interview معمول لجلسات كودينج مشتركة: روم، محرر، شات، تتبع أحداث، وتقييم المرشح.', 'Interview system le live coding sessions. Room, editor, chat, activity tracking, we candidate evaluation.', 6);

await browser.close();

await createVoiceover(slides);
await composeVideo(slides);

console.log(`Video written to ${VIDEO_PATH}`);
console.log(`Voiceover written to ${AUDIO_PATH}`);

import fs from 'node:fs/promises';
import path from 'node:path';
import puppeteer from '../server/node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';

const ROOT = path.resolve(process.cwd());
const OUT_DIR = path.join(ROOT, 'scratch', 'user-demo-video');
const FRAME_DIR = path.join(OUT_DIR, 'frames');
const AUDIO_PATH = path.join(OUT_DIR, 'voiceover.wav');
const VIDEO_PATH = path.join(OUT_DIR, 'judgex-user-demo-with-voice.webm');

const meta = [
	['تسجيل الدخول', 'بنبدأ كيوزر حقيقي: المستخدم يدخل بالإيميل والباسورد عشان تظهر له الصفحات المحمية والـ dashboard الشخصي.', 5],
	['Dashboard المستخدم', 'هنا مركز التحكم: إحصائيات سريعة، Daily Challenge، مسابقات قادمة، وأفضل المستخدمين.', 6],
	['Roadmap التعلم', 'الـ Roadmap بترتب رحلة التعلم إلى topics وخطوات واضحة، وتساعد المستخدم يعرف يبدأ منين ويكمل إزاي.', 6],
	['AI Lab', 'منطقة أدوات الذكاء الاصطناعي: توليد مسارات، مساعدات تعليمية، وتجارب تساعد في التدريب والتحليل.', 6],
	['بنك المسائل', 'صفحة Problems بتعرض المسائل مع الصعوبة والتاجز والحالة، وتخلي المستخدم يفلتر ويدور بسرعة.', 6],
	['البحث والفلترة', 'جربنا البحث داخل بنك المسائل، وده مهم لما عدد المسائل يكبر والمستخدم يدور حسب الاسم أو الموضوع.', 5],
	['تفاصيل المسألة', 'صفحة المسألة فيها الوصف، القيود، الوقت والذاكرة، التاجز، الإحصائيات، وزر الدخول للحل.', 6],
	['مساحة الحل', 'واجهة حل شبه LeetCode: الوصف شمال، المحرر يمين، اختيار اللغة، وأزرار Run و Submit.', 6],
	['تجربة Run', 'ضغطنا Run عشان نجرب الكود على test cases ونشوف النتيجة قبل الإرسال النهائي.', 6],
	['تجربة Submit', 'ضغطنا Submit عشان يروح الحل للـ judge ويتسجل في submissions مع verdict ووقت وذاكرة.', 6],
	['Neural Assistant', 'جربنا المساعد الذكي داخل صفحة الحل: بيقرأ سياق المسألة والكود ويساعد بتلميحات وخطوات تفكير.', 7],
	['Submissions', 'هنا المستخدم يراجع كل الإرسالات، يفلتر حسب المشكلة أو اللغة أو الحالة، ويفتح تفاصيل كل submission.', 6],
	['المسابقات', 'صفحة Contests بتعرض المسابقات ومواعيدها، ومنها يدخل المستخدم على صفحة المسابقة والـ standings.', 6],
	['تفاصيل المسابقة', 'داخل المسابقة تظهر المسائل، حالة المشاركة، والـ standing لمتابعة ترتيب المشاركين.', 6],
	['الكورسات', 'جزء Courses منظم للمحتوى التعليمي: كورسات، وصف، مصادر، وروابط تساعد المستخدم يتعلم بجانب حل المسائل.', 6],
	['صفحة الكورس', 'صفحة الكورس بتعرض تفاصيل المحتوى والموارد المرتبطة به، فتخلي التدريب مش مجرد حل عشوائي.', 6],
	['Leaderboard والمستخدمين', 'صفحة Users بتوضح ترتيب المستخدمين وسكور كل واحد، وده يضيف جانب تنافسي للموقع.', 5],
	['نظام المقابلات', 'جزء Interview معمول لجلسات كودينج مشتركة: روم، محرر، شات، تتبع أحداث، وتقييم المرشح.', 6],
];

const frameFiles = (await fs.readdir(FRAME_DIR))
	.filter((name) => name.endsWith('.png'))
	.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

const slides = await Promise.all(frameFiles.map(async (name, index) => ({
	file: path.join(FRAME_DIR, name),
	titleAr: meta[index]?.[0] || name,
	captionAr: meta[index]?.[1] || '',
	duration: meta[index]?.[2] || 5,
	dataUrl: `data:image/png;base64,${await fs.readFile(path.join(FRAME_DIR, name), 'base64')}`,
})));

const browser = await puppeteer.launch({
	headless: 'new',
	protocolTimeout: 900000,
	defaultViewport: { width: 1366, height: 768 },
	args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
});

const page = await browser.newPage();
page.setDefaultTimeout(0);
await page.setViewport({ width: 1366, height: 768 });
const audioDataUrl = `data:audio/wav;base64,${await fs.readFile(AUDIO_PATH, 'base64')}`;

const videoBase64 = await page.evaluate(async ({ slides, audioDataUrl }) => {
	const width = 1366;
	const height = 768;
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	document.body.appendChild(canvas);
	const ctx = canvas.getContext('2d');
	const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
	const loadImage = (src) =>
		new Promise((resolve, reject) => {
			const img = new Image();
			img.onload = () => resolve(img);
			img.onerror = reject;
			img.src = src;
		});
	const images = [];
	for (const slide of slides) images.push(await loadImage(slide.dataUrl));

	const audioContext = new AudioContext();
	const audioBuffer = await fetch(audioDataUrl)
		.then((res) => res.arrayBuffer())
		.then((buffer) => audioContext.decodeAudioData(buffer));
	const source = audioContext.createBufferSource();
	source.buffer = audioBuffer;
	const destination = audioContext.createMediaStreamDestination();
	source.connect(destination);

	const canvasStream = canvas.captureStream(30);
	const stream = new MediaStream([...canvasStream.getVideoTracks(), ...destination.stream.getAudioTracks()]);
	const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus') ? 'video/webm;codecs=vp8,opus' : 'video/webm';
	const chunks = [];
	const recorder = new MediaRecorder(stream, { mimeType });
	recorder.ondataavailable = (event) => {
		if (event.data.size > 0) chunks.push(event.data);
	};

	const planned = slides.reduce((sum, slide) => sum + slide.duration, 0);
	const totalDuration = Math.max(planned, audioBuffer.duration + 0.5);
	const scale = totalDuration / planned;
	const durations = slides.map((slide) => slide.duration * scale);
	const ends = durations.reduce((acc, duration) => {
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

	const draw = (slide, img, index, progress, totalProgress) => {
		ctx.fillStyle = '#07111f';
		ctx.fillRect(0, 0, width, height);
		const zoom = 1 + progress * 0.015;
		ctx.drawImage(img, (width - width * zoom) / 2, (height - height * zoom) / 2, width * zoom, height * zoom);

		const panelHeight = 154;
		const gradient = ctx.createLinearGradient(0, height - panelHeight, 0, height);
		gradient.addColorStop(0, 'rgba(3, 7, 18, 0.20)');
		gradient.addColorStop(0.32, 'rgba(3, 7, 18, 0.88)');
		gradient.addColorStop(1, 'rgba(3, 7, 18, 0.96)');
		ctx.fillStyle = gradient;
		ctx.fillRect(0, height - panelHeight, width, panelHeight);
		ctx.fillStyle = '#38bdf8';
		ctx.fillRect(0, height - 7, Math.max(1, width * totalProgress), 7);

		ctx.fillStyle = 'rgba(56, 189, 248, 0.95)';
		ctx.beginPath();
		ctx.roundRect(42, height - 133, 78, 30, 15);
		ctx.fill();
		ctx.font = '700 16px Arial, sans-serif';
		ctx.fillStyle = '#04111f';
		ctx.fillText(`${index + 1}/${slides.length}`, 64, height - 112);

		ctx.direction = 'rtl';
		ctx.textAlign = 'right';
		ctx.font = '700 34px Arial, sans-serif';
		ctx.fillStyle = '#ffffff';
		ctx.fillText(slide.titleAr, width - 42, height - 101);
		const lines = wrapText(slide.captionAr, width - 84, '400 23px Arial, sans-serif').slice(0, 2);
		ctx.font = '400 23px Arial, sans-serif';
		ctx.fillStyle = '#e0f2fe';
		lines.forEach((line, lineIndex) => ctx.fillText(line, width - 42, height - 61 + lineIndex * 31));
		ctx.direction = 'ltr';
		ctx.textAlign = 'left';
	};

	recorder.start(1000);
	source.start();
	const started = performance.now();
	let elapsed = 0;
	while (elapsed < totalDuration) {
		elapsed = (performance.now() - started) / 1000;
		const index = Math.max(0, Math.min(ends.findIndex((end) => elapsed <= end), slides.length - 1));
		const start = index === 0 ? 0 : ends[index - 1];
		const progress = Math.min(1, Math.max(0, (elapsed - start) / durations[index]));
		draw(slides[index], images[index], index, progress, Math.min(1, elapsed / totalDuration));
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
	for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
	return btoa(binary);
}, { slides, audioDataUrl });

await fs.writeFile(VIDEO_PATH, Buffer.from(videoBase64, 'base64'));
await browser.close();
console.log(`Video written to ${VIDEO_PATH}`);

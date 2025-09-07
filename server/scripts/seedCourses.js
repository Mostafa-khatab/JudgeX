import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import Course from '../src/models/course.js';

function extractYouTubeId(url) {
	try {
		const u = new URL(url);
		if (u.hostname.includes('youtu.be')) {
			return u.pathname.slice(1);
		}
		if (u.hostname.includes('youtube.com')) {
			if (u.pathname === '/watch') return u.searchParams.get('v');
			const parts = u.pathname.split('/').filter(Boolean);
			return parts[1] || parts[0] || null;
		}
	} catch (_) {
		return null;
	}
	return null;
}

function youtubeThumb(url) {
	const id = extractYouTubeId(url);
	return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : '';
}

const samples = [
	{
		title: 'JavaScript Basics',
		description: 'Learn variables, functions, arrays, and objects with hands-on examples.',
		instructor: 'FloatPoint Team',
		thumbnail: '',
		difficulty: 'beginner',
		duration: '3h 20m',
		isPublished: true,
		tags: ['javascript', 'basics'],
		videos: [
			{ title: 'Intro to JS', url: 'https://www.youtube.com/watch?v=W6NZfCO5SIk', duration: '12m' },
			{ title: 'Variables & Types', url: 'https://www.youtube.com/watch?v=B7wHpNUUT4Y', duration: '18m' },
		],
		links: [
			{ title: 'MDN JavaScript Guide', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide', type: 'documentation' },
		],
	},
	{
		title: 'React Fundamentals',
		description: 'Understand components, props, state, and hooks to build modern UIs.',
		instructor: 'FloatPoint Team',
		thumbnail: '',
		difficulty: 'intermediate',
		duration: '4h 05m',
		isPublished: true,
		tags: ['react', 'frontend'],
		videos: [
			{ title: 'React Intro', url: 'https://www.youtube.com/watch?v=SqcY0GlETPk', duration: '22m' },
			{ title: 'Hooks Overview', url: 'https://www.youtube.com/watch?v=TNhaISOUy6Q', duration: '28m' },
		],
		links: [
			{ title: 'React Docs', url: 'https://react.dev/learn', type: 'documentation' },
		],
	},
	{
		title: 'Data Structures in JS',
		description: 'Arrays, maps, sets, stacks, queues, and complexity basics.',
		instructor: 'FloatPoint Team',
		thumbnail: '',
		difficulty: 'advanced',
		duration: '2h 40m',
		isPublished: true,
		tags: ['algorithms', 'ds'],
		videos: [
			{ title: 'Arrays & Strings', url: 'https://www.youtube.com/watch?v=FO9f1J9r7Gk', duration: '20m' },
		],
		links: [
			{ title: 'Big-O Cheatsheet', url: 'https://www.bigocheatsheet.com/', type: 'reference' },
		],
	},
	{
		title: 'Node.js Crash Course',
		description: 'Fast-paced introduction to Node.js, modules, fs, and HTTP.',
		instructor: 'FloatPoint Team',
		thumbnail: '',
		difficulty: 'beginner',
		duration: '2h 10m',
		isPublished: true,
		tags: ['node', 'backend'],
		videos: [
			{ title: 'Node.js Intro', url: 'https://www.youtube.com/watch?v=TlB_eWDSMt4', duration: '35m' },
		],
		links: [
			{ title: 'Node.js Docs', url: 'https://nodejs.org/en/docs', type: 'documentation' },
		],
	},
	{
		title: 'MongoDB Basics',
		description: 'Collections, documents, CRUD, and indexes for beginners.',
		instructor: 'FloatPoint Team',
		thumbnail: '',
		difficulty: 'beginner',
		duration: '1h 30m',
		isPublished: true,
		tags: ['mongodb', 'database'],
		videos: [
			{ title: 'MongoDB Intro', url: 'https://www.youtube.com/watch?v=-56x56UppqQ', duration: '25m' },
		],
		links: [
			{ title: 'MongoDB Manual', url: 'https://www.mongodb.com/docs/manual/', type: 'documentation' },
		],
	},
];

// Generate 30 more courses (10 competitive programming, 10 databases, 10 programming languages)
const cpTopics = [
	{ title: 'Greedy Algorithms', id: 'HbwYm9pOxT8' },
	{ title: 'Dynamic Programming Intro', id: 'NJuKJ8sasGk' },
	{ title: 'Binary Search Patterns', id: 'v57lNF2mb_s' },
	{ title: 'Graph BFS/DFS', id: 'pcKY4hjDrxk' },
	{ title: 'Dijkstra Shortest Path', id: 'GazC3A4OQTE' },
	{ title: 'Union-Find DSU', id: 'abzA1nT7N3A' },
	{ title: 'Segment Trees Basics', id: '79gWm14ZJ8s' },
	{ title: 'Fenwick Tree (BIT)', id: 'RgITNht_f4Q' },
	{ title: 'Two Pointers Technique', id: 'JH5q4sQHH3E' },
	{ title: 'Sliding Window', id: 'MK-NZ4hN7rs' },
];

const dbTopics = [
	{ title: 'SQL Joins Deep Dive', id: '9yeOJ0ZMUYw' },
	{ title: 'Indexes and Performance', id: 'HubezTbLxVE' },
	{ title: 'Transactions & ACID', id: '7YcW25PHnAA' },
	{ title: 'MongoDB Aggregation', id: 'E-1xI85Zog8' },
	{ title: 'Normalization vs Denormalization', id: 'UrYLYV7WSHM' },
	{ title: 'PostgreSQL Basics', id: 'qw--VYLpxG4' },
	{ title: 'MySQL Crash Course', id: '9ylj9NR0Lcg' },
	{ title: 'MongoDB Indexing', id: 'oSIv-E60NiU' },
	{ title: 'Sharding vs Replication', id: 'Ghg3q7K6W98' },
	{ title: 'ER Modeling', id: '7J7X7bQG6bU' },
];

const langTopics = [
	{ title: 'Python Basics', id: 'rfscVS0vtbw' },
	{ title: 'C++ STL Overview', id: 'eC6UdfGBqvA' },
	{ title: 'Java OOP Crash', id: 'grEKMHGYyns' },
	{ title: 'Go for Beginners', id: 'YS4e4q9oBaU' },
	{ title: 'Rust Ownership', id: '8M0QfLUDaaA' },
	{ title: 'TypeScript in 100 Minutes', id: 'zQnBQ4tB3ZA' },
	{ title: 'Kotlin Intro', id: 'F9UC9DY-vIU' },
	{ title: 'Swift Basics', id: 'comQ1-x2a1Q' },
	{ title: 'PHP Crash Course', id: 'OK_JCtrrv-c' },
	{ title: 'Ruby Basics', id: 'UCI0P5pL3r0' },
];

function fromTopic(topic, category, difficulty = 'beginner') {
	const url = `https://www.youtube.com/watch?v=${topic.id}`;
	return {
		title: `${category}: ${topic.title}`,
		description: `${category} course covering ${topic.title}.`,
		instructor: 'FloatPoint Team',
		thumbnail: '',
		difficulty,
		duration: '45m',
		isPublished: true,
		tags: [category.toLowerCase().replace(/\s+/g, '-')],
		videos: [
			{ title: topic.title, url, duration: '45m' },
		],
		links: [],
	};
}

const generated = [
	...cpTopics.map((t, i) => fromTopic(t, 'Competitive Programming', i < 3 ? 'beginner' : i < 7 ? 'intermediate' : 'advanced')),
	...dbTopics.map((t, i) => fromTopic(t, 'Databases', i < 3 ? 'beginner' : i < 7 ? 'intermediate' : 'advanced')),
	...langTopics.map((t, i) => fromTopic(t, 'Programming Language', i < 3 ? 'beginner' : i < 7 ? 'intermediate' : 'advanced')),
];

const allSamples = [...samples, ...generated];

async function run() {
	try {
		await connectDB();
		await mongoose.connection.asPromise();
		const withThumbs = allSamples.map((doc) => {
			const firstVideoUrl = doc.videos?.[0]?.url;
			const autoThumb = firstVideoUrl ? youtubeThumb(firstVideoUrl) : '';
			return {
				...doc,
				thumbnail: doc.thumbnail || autoThumb,
			};
		});
		const upserts = await Promise.all(
			withThumbs.map((doc) =>
				Course.updateOne({ title: doc.title }, { $set: doc }, { upsert: true })
			),
		);
		const count = upserts.length;
		console.log(`✅ Seeded/updated ${count} courses.`);
	} catch (err) {
		console.error('❌ Seeding courses failed:', err);
		process.exitCode = 1;
	} finally {
		await mongoose.connection.close().catch(() => {});
	}
}

run();



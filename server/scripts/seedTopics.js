import 'dotenv/config';

import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import Topic from '../src/models/topic.js';
import Problem from '../src/models/problem.js';

function embed(id) {
	return `https://www.youtube.com/embed/${id}`;
}

function slug(s) {
	return String(s)
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)/g, '');
}

function q(question, options, answer) {
	return { question, options, answer };
}

const topics = [
	{
		order: 0,
		topicId: 'variables',
		title: 'Variables & Types',
		description: 'Understand variables, basic types, and common pitfalls like overflow and type coercion.',
		videoUrl: embed('W6NZfCO5SIk'),
		quizzes: [
			q('Which is the best description of a variable?', ['A named storage location', 'A loop condition', 'A compiler flag', 'A function argument only'], 'A named storage location'),
			q('Which type is best suited for storing true/false?', ['boolean', 'string', 'array', 'object'], 'boolean'),
			q('What does integer overflow mean?', ['Value exceeds representable range', 'String too long', 'Too many function calls', 'Array index negative'], 'Value exceeds representable range'),
		],
	},
	{
		order: 1,
		topicId: 'loops',
		title: 'Loops & Iteration',
		description: 'Learn for/while loops, iteration patterns, and off-by-one errors.',
		videoUrl: embed('OnDr4J2UXSA'),
		quizzes: [
			q('What is the most common bug in loops?', ['Off-by-one error', 'Garbage collection', 'SQL injection', 'Undefined behavior always'], 'Off-by-one error'),
			q('A while-loop repeats until...', ['its condition becomes false', 'the compiler stops', 'memory is full', 'the program ends'], 'its condition becomes false'),
			q('Which pattern is best for scanning a string once?', ['single pointer i++', 'nested loops over all pairs', 'recursion for each char', 'random access only'], 'single pointer i++'),
		],
	},
	{
		order: 2,
		topicId: 'functions',
		title: 'Functions & Parameters',
		description: 'Decompose problems using functions, understand parameters, return values, and scope.',
		videoUrl: embed('8x1mO1d6-4w'),
		quizzes: [
			q('A function is mainly used to...', ['encapsulate reusable logic', 'increase file size', 'remove variables', 'avoid testing'], 'encapsulate reusable logic'),
			q('What is a return value?', ['Output produced by a function', 'A loop variable', 'A compiler warning', 'A class member'], 'Output produced by a function'),
			q('What does scope describe?', ['Where a name is visible', 'How fast code runs', 'How many files exist', 'Network latency'], 'Where a name is visible'),
		],
	},
	{
		order: 3,
		topicId: 'arrays',
		title: 'Arrays',
		description: 'Indexing, traversal, prefix sums, and complexity tradeoffs.',
		videoUrl: embed('8hly31xKli0'),
		quizzes: [
			q('Array access by index is typically...', ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], 'O(1)'),
			q('Prefix sums help compute range sums in...', ['O(1) per query after O(n) preprocessing', 'O(n) per query', 'O(log n) per query only', 'O(n^2) total'], 'O(1) per query after O(n) preprocessing'),
			q('An out-of-bounds index usually causes...', ['runtime error/undefined behavior', 'automatic resizing', 'sorting', 'memoization'], 'runtime error/undefined behavior'),
		],
	},
	{
		order: 4,
		topicId: 'linked-lists',
		title: 'Linked Lists',
		description: 'Nodes, pointers, traversal, and common patterns like fast/slow pointers.',
		videoUrl: embed('R9PTBwOzceo'),
		quizzes: [
			q('Linked lists are best when you need...', ['frequent insertions/deletions', 'random access', 'binary search', 'constant-time indexing'], 'frequent insertions/deletions'),
			q('To find the middle of a list efficiently, use...', ['fast/slow pointers', 'sorting first', 'hashing nodes', 'matrix DP'], 'fast/slow pointers'),
			q('Time to access the k-th node is typically...', ['O(k)', 'O(1)', 'O(log k)', 'O(n log n)'], 'O(k)'),
		],
	},
	{
		order: 5,
		topicId: 'stacks',
		title: 'Stacks',
		description: 'LIFO structure, monotonic stacks, and parsing problems.',
		videoUrl: embed('wjI1WNcIntg'),
		quizzes: [
			q('A stack is...', ['LIFO', 'FIFO', 'random', 'sorted'], 'LIFO'),
			q('Which operation is valid on a stack?', ['push/pop', 'enqueue/dequeue', 'union/find', 'rotate/split'], 'push/pop'),
			q('Monotonic stacks are often used for...', ['next greater element', 'graph shortest path', 'tree balancing', 'string hashing'], 'next greater element'),
		],
	},
	{
		order: 6,
		topicId: 'queues',
		title: 'Queues',
		description: 'FIFO structure, BFS traversal, and typical applications.',
		videoUrl: embed('wBq3Wz-0B2E'),
		quizzes: [
			q('A queue is...', ['FIFO', 'LIFO', 'random', 'always sorted'], 'FIFO'),
			q('BFS commonly uses a...', ['queue', 'stack', 'heap', 'set'], 'queue'),
			q('Deque supports...', ['push/pop from both ends', 'only push', 'only pop', 'only random access'], 'push/pop from both ends'),
		],
	},
	{
		order: 7,
		topicId: 'hash-tables',
		title: 'Hash Tables',
		description: 'Fast lookups with hashing, collisions, and practical use-cases.',
		videoUrl: embed('shs0KM3wKv8'),
		quizzes: [
			q('Average-case lookup in a hash table is...', ['O(1)', 'O(n)', 'O(log n)', 'O(n log n)'], 'O(1)'),
			q('A collision occurs when...', ['two keys map to same bucket', 'array is full', 'a loop never ends', 'a tree is unbalanced'], 'two keys map to same bucket'),
			q('Good hashing aims for...', ['uniform distribution', 'sorted buckets', 'no memory usage', 'always perfect uniqueness'], 'uniform distribution'),
		],
	},
	{
		order: 8,
		topicId: 'trees',
		title: 'Trees',
		description: 'Binary trees, traversals, recursion, and basic properties.',
		videoUrl: embed('oSWTXtMglKE'),
		quizzes: [
			q('A tree with N nodes has how many edges?', ['N-1', 'N', '2N', 'N^2'], 'N-1'),
			q('In-order traversal of a BST yields...', ['sorted order', 'reverse insertion order', 'random order', 'level order'], 'sorted order'),
			q('A leaf node is a node with...', ['no children', 'two children', 'one parent only', 'a cycle'], 'no children'),
		],
	},
	{
		order: 9,
		topicId: 'graphs',
		title: 'Graphs',
		description: 'Representations, BFS/DFS, connectivity, and basic shortest paths.',
		videoUrl: embed('tWVWeAqZ0WU'),
		quizzes: [
			q('An adjacency list is best for...', ['sparse graphs', 'dense matrices only', 'sorting arrays', 'hashing strings'], 'sparse graphs'),
			q('DFS is often implemented with...', ['stack/recursion', 'only queue', 'only heap', 'only hashmap'], 'stack/recursion'),
			q('BFS on unweighted graphs finds...', ['shortest path by edges', 'minimum spanning tree always', 'topological order always', 'cycle length only'], 'shortest path by edges'),
		],
	},
	{
		order: 10,
		topicId: 'sorting',
		title: 'Sorting Algorithms',
		description: 'Understand comparison sorting, stability, and common patterns.',
		videoUrl: embed('kPRA0W1kECg'),
		quizzes: [
			q('Which is typically O(n log n) average?', ['quicksort', 'bubble sort', 'insertion sort', 'selection sort'], 'quicksort'),
			q('A stable sort preserves...', ['relative order of equal elements', 'memory usage', 'only unique values', 'graph connectivity'], 'relative order of equal elements'),
			q('Sorting is often used before...', ['binary search', 'string concatenation', 'memory allocation', 'file I/O'], 'binary search'),
		],
	},
	{
		order: 11,
		topicId: 'binary-search',
		title: 'Binary Search',
		description: 'Search patterns, invariants, and boundary handling.',
		videoUrl: embed('P3YID7liBug'),
		quizzes: [
			q('Binary search requires the data to be...', ['sorted or monotonic', 'random', 'hashed', 'graph-based'], 'sorted or monotonic'),
			q('Binary search time complexity is...', ['O(log n)', 'O(n)', 'O(1)', 'O(n log n)'], 'O(log n)'),
			q('A common bug in binary search is...', ['incorrect mid/bounds update', 'too many arrays', 'missing imports', 'slow I/O only'], 'incorrect mid/bounds update'),
		],
	},
	{
		order: 12,
		topicId: 'recursion',
		title: 'Recursion',
		description: 'Base cases, call stacks, and solving problems via divide-and-conquer.',
		videoUrl: embed('KEEKn7Me-ms'),
		quizzes: [
			q('Every recursive function must have...', ['a base case', 'a queue', 'a hashmap', 'a class'], 'a base case'),
			q('Recursion uses...', ['call stack', 'heap only', 'disk I/O', 'network'], 'call stack'),
			q('Divide-and-conquer typically...', ['splits problem into subproblems', 'always uses BFS', 'requires hashing', 'eliminates complexity'], 'splits problem into subproblems'),
		],
	},
	{
		order: 13,
		topicId: 'dynamic-programming',
		title: 'Dynamic Programming',
		description: 'Overlapping subproblems, optimal substructure, memoization and tabulation.',
		videoUrl: embed('oBt53YbR9Kk'),
		quizzes: [
			q('DP is useful when subproblems...', ['overlap and repeat', 'never repeat', 'require sorting', 'use only graphs'], 'overlap and repeat'),
			q('Memoization is...', ['top-down caching', 'bottom-up filling only', 'greedy choice', 'binary splitting'], 'top-down caching'),
			q('A DP transition defines...', ['how to build answer from smaller states', 'how to parse input', 'how to print output', 'how to randomize'], 'how to build answer from smaller states'),
		],
	},
	{
		order: 14,
		topicId: 'greedy',
		title: 'Greedy Algorithms',
		description: 'Make locally optimal choices with proofs/intuition and counterexamples.',
		videoUrl: embed('ARvQcqJ_-NY'),
		quizzes: [
			q('Greedy algorithms make decisions that are...', ['locally optimal', 'always globally optimal by default', 'random', 'based on hashing only'], 'locally optimal'),
			q('Greedy works when the problem has...', ['greedy-choice property', 'only recursion', 'no constraints', 'a database'], 'greedy-choice property'),
			q('If greedy fails, a common next approach is...', ['dynamic programming', 'remove constraints', 'use slower hardware', 'avoid tests'], 'dynamic programming'),
		],
	},
	{
		order: 15,
		topicId: 'strings',
		title: 'Strings',
		description: 'String basics, frequency counting, two-pointer patterns, and edge cases.',
		videoUrl: embed('s6FhG--P7z0'),
		quizzes: [
			q('Comparing strings lexicographically means...', ['dictionary order comparison', 'length comparison only', 'hash comparison only', 'random order'], 'dictionary order comparison'),
			q('A common technique for anagrams is...', ['frequency counting', 'binary search', 'topological sort', 'segment tree'], 'frequency counting'),
			q('Two pointers are useful for...', ['palindrome checks', 'graph shortest paths', 'hash collisions', 'tree balancing'], 'palindrome checks'),
		],
	},
	{
		order: 16,
		topicId: 'two-pointers',
		title: 'Two Pointers',
		description: 'Solve array/string problems efficiently using left/right pointers and invariants.',
		videoUrl: embed('OnKnZzFJvOM'),
		quizzes: [
			q('The core idea of two pointers is to...', ['move pointers based on an invariant', 'sort every time', 'use recursion always', 'require hashing'], 'move pointers based on an invariant'),
			q('Two pointers on a sorted array can often solve...', ['pair sum problems', 'Dijkstra paths', 'tree traversal', 'DP knapsack'], 'pair sum problems'),
			q('Sliding window is a special case of...', ['two pointers', 'binary lifting', 'union-find', 'topological sort'], 'two pointers'),
		],
	},
];

async function seed() {
	try {
		await connectDB();
		await mongoose.connection.asPromise();

		const problems = await Problem.find().select('_id id name').lean();
		if (!problems.length) {
			throw new Error('No problems found in DB. Seed problems first, then seed topics.');
		}

		const upserts = await Promise.all(
			topics.map(async (t, idx) => {
				const p = problems[idx % problems.length];
				const doc = {
					order: t.order,
					topicId: t.topicId || slug(t.title),
					title: t.title,
					description: t.description,
					videoUrl: t.videoUrl,
					quizzes: t.quizzes,
					linkedProblems: [p._id],
				};
				return Topic.updateOne({ topicId: doc.topicId }, { $set: doc }, { upsert: true });
			}),
		);

		console.log(`✅ Seeded/updated ${upserts.length} topics.`);
	} catch (err) {
		console.error('❌ Seeding topics failed:', err);
		process.exitCode = 1;
	} finally {
		await mongoose.connection.close().catch(() => {});
	}
}

seed();

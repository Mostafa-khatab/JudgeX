import fs from 'node:fs/promises';
import path from 'node:path';

const projectRoot = path.resolve(process.cwd());
const srcRoot = path.join(projectRoot, 'src');

const exts = new Set(['.js', '.jsx', '.mjs', '.ts', '.tsx']);

async function walk(dir) {
	const entries = await fs.readdir(dir, { withFileTypes: true });
	const files = [];
	for (const entry of entries) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			if (entry.name === 'node_modules' || entry.name === 'dist') continue;
			files.push(...(await walk(full)));
		} else if (entry.isFile()) {
			if (exts.has(path.extname(entry.name))) files.push(full);
		}
	}
	return files;
}

function toPosix(p) {
	return p.split(path.sep).join('/');
}

function normalizeFile(p) {
	return toPosix(path.relative(projectRoot, p));
}

function resolveImport(fromFileAbs, spec) {
	// Handle alias
	let resolvedSpec = spec;
	let forceProjectRootResolve = false;
	if (resolvedSpec.startsWith('~/')) {
		resolvedSpec = resolvedSpec.slice(2); // keep leading slash after ~
		forceProjectRootResolve = true;
	}

	// Only resolve relative + absolute-from-root + aliased
	if (!forceProjectRootResolve && !resolvedSpec.startsWith('./') && !resolvedSpec.startsWith('../') && !resolvedSpec.startsWith('/')) {
		return null;
	}

	const fromDir = path.dirname(fromFileAbs);
	let candidate;
	if (forceProjectRootResolve) {
		candidate = path.join(projectRoot, 'src', resolvedSpec);
	} else {
		candidate = resolvedSpec.startsWith('/')
			? path.join(projectRoot, resolvedSpec)
			: path.resolve(fromDir, resolvedSpec);
	}

	const tryFiles = [];
	if (path.extname(candidate)) {
		tryFiles.push(candidate);
	} else {
		for (const ext of exts) tryFiles.push(candidate + ext);
		for (const ext of exts) tryFiles.push(path.join(candidate, 'index' + ext));
	}

	return tryFiles;
}

const IMPORT_RE = /(?:^|\n)\s*(?:import|export)\s+(?:[^;'"\n]+\s+from\s+)?["']([^"']+)["']/g;

async function buildGraph() {
	const filesAbs = await walk(srcRoot);
	const nodes = new Set(filesAbs.map(normalizeFile));
	const graph = new Map();
	for (const fileAbs of filesAbs) {
		const from = normalizeFile(fileAbs);
		const content = await fs.readFile(fileAbs, 'utf8');
		const deps = new Set();
		let m;
		while ((m = IMPORT_RE.exec(content))) {
			const spec = m[1];
			const candidates = resolveImport(fileAbs, spec);
			if (!candidates) continue;
			for (const cand of candidates) {
				try {
					const st = await fs.stat(cand);
					if (!st.isFile()) continue;
					const to = normalizeFile(cand);
					if (nodes.has(to)) deps.add(to);
					break;
				} catch {
					// ignore
				}
			}
		}
		graph.set(from, [...deps]);
	}
	return { nodes: [...nodes], graph };
}

function findCycles(nodes, graph) {
	const visiting = new Set();
	const visited = new Set();
	const stack = [];
	const cycles = [];
	const seen = new Set();

	function recordCycle(startIndex) {
		const cycle = stack.slice(startIndex);
		// canonical key
		const min = cycle.reduce((best, cur, i) => (cur < cycle[best] ? i : best), 0);
		const rotated = [...cycle.slice(min), ...cycle.slice(0, min)];
		const key = rotated.join(' -> ');
		if (seen.has(key)) return;
		seen.add(key);
		cycles.push(rotated);
	}

	function dfs(node) {
		visiting.add(node);
		stack.push(node);

		for (const dep of graph.get(node) || []) {
			if (visiting.has(dep)) {
				const idx = stack.indexOf(dep);
				if (idx !== -1) recordCycle(idx);
				continue;
			}
			if (!visited.has(dep)) dfs(dep);
		}

		stack.pop();
		visiting.delete(node);
		visited.add(node);
	}

	for (const n of nodes) {
		if (!visited.has(n)) dfs(n);
	}

	return cycles;
}

const { nodes, graph } = await buildGraph();
const cycles = findCycles(nodes, graph);

if (!cycles.length) {
	console.log('No circular dependencies found in client/src');
	process.exit(0);
}

console.log(`Found ${cycles.length} circular dependencies in client/src:`);
for (const cyc of cycles) {
	console.log('\n- ' + cyc.join(' -> ') + ' -> ' + cyc[0]);
}

process.exit(1);

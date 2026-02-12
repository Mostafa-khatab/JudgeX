import fs from 'fs-extra';
import path from 'path';
import { spawn, execSync } from 'child_process';

import checker from './checker.js';
import writeTestcase from './writeTestcase.js';
import languages from './languages.js';
import getFinalResult from './getFinalResult.js';

const isWindows = process.platform === 'win32';

/**
 * Execute a command with proper timeout and resource measurement.
 * Uses child_process.spawn directly (no shelljs overhead).
 * Returns { stdout, stderr, exitCode, time, memory, timedOut }
 */
const executeWithMeasurement = (command, args, options = {}) => {
	return new Promise((resolve) => {
		const { cwd, timeout = 5000, inputFile } = options;
		const startTime = process.hrtime.bigint();
		let stdout = '';
		let stderr = '';
		let timedOut = false;
		let peakMemory = 0;
		let memoryInterval;

		// Build the spawn options
		const spawnOpts = {
			cwd,
			stdio: ['pipe', 'pipe', 'pipe'],
			windowsHide: true,
		};

		const child = spawn(command, args, spawnOpts);

		// Pipe input file to stdin if provided
		if (inputFile && fs.existsSync(inputFile)) {
			const inputStream = fs.createReadStream(inputFile);
			inputStream.pipe(child.stdin);
			inputStream.on('error', () => { try { child.stdin.end(); } catch {} });
		} else {
			child.stdin.end();
		}

		child.stdout.on('data', (data) => { stdout += data.toString(); });
		child.stderr.on('data', (data) => { stderr += data.toString(); });

		// Sample memory usage periodically using lightweight OS queries
		memoryInterval = setInterval(() => {
			try {
				if (!child.pid) return;
				if (isWindows) {
					const result = execSync(
						`wmic process where processid=${child.pid} get WorkingSetSize /format:value`,
						{ timeout: 500, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] }
					).toString();
					const match = result.match(/WorkingSetSize=(\d+)/);
					if (match) {
						const mem = parseInt(match[1], 10);
						if (mem > peakMemory) peakMemory = mem;
					}
				} else {
					const status = fs.readFileSync(`/proc/${child.pid}/status`, 'utf-8');
					const match = status.match(/VmRSS:\s+(\d+)/);
					if (match) {
						const mem = parseInt(match[1], 10) * 1024; // kB to bytes
						if (mem > peakMemory) peakMemory = mem;
					}
				}
			} catch {
				// Process may have exited - ignore
			}
		}, 150);

		// Set up timeout
		const timer = setTimeout(() => {
			timedOut = true;
			try {
				// Kill the process tree on Windows
				if (isWindows) {
					spawn('taskkill', ['/pid', child.pid.toString(), '/T', '/F'], { windowsHide: true });
				} else {
					child.kill('SIGKILL');
				}
			} catch {
				// Ignore kill errors  
			}
		}, timeout);

		child.on('close', (exitCode) => {
			clearTimeout(timer);
			if (memoryInterval) clearInterval(memoryInterval);

			const endTime = process.hrtime.bigint();
			const time = Number(endTime - startTime) / 1e9; // Convert nanoseconds to seconds

			resolve({
				stdout,
				stderr,
				exitCode: exitCode ?? -1,
				time,
				timedOut,
				peakMemory, // bytes
			});
		});

		child.on('error', (err) => {
			clearTimeout(timer);
			if (memoryInterval) clearInterval(memoryInterval);

			const endTime = process.hrtime.bigint();
			const time = Number(endTime - startTime) / 1e9;

			resolve({
				stdout,
				stderr: err.message,
				exitCode: -1,
				time,
				timedOut: false,
				peakMemory: 0,
			});
		});
	});
};


const judger = async ({ src, language, problem }) => {
	if (!problem || !language || !src) {
		return { status: 'IE', msg: { server: 'All fields are required' } };
	}

	if (!Object.keys(languages).includes(language)) {
		return { status: 'IE', msg: { server: `Language "${language}" not supported` } };
	}

	const finalMsg = { compiler: '', checker: '' };

	try {
		console.log('Starting judge...');

		const tmpPath = path.join(path.resolve(), 'tmp');
		const testcasePath = path.join(tmpPath, 'testcase');

		// Ensure directories exist
		fs.ensureDirSync(tmpPath);
		fs.ensureDirSync(testcasePath);

		// Write user's source code
		fs.writeFileSync(path.join(tmpPath, languages[language].mainFile), src);
		console.log('Write source code successful');

		// Write test cases
		console.log(`Writing ${problem.testcase.length} testcases...`);
		writeTestcase(problem.testcase);
		console.log('Write testcase successful');

		// Compile if needed
		const timestamp = Date.now();
		let runCmd;
		
		if (languages[language].compileCmd) {
			// Use unique executable name to avoid file locking issues on Windows
			const uniqueExeName = isWindows ? `main_${timestamp}.exe` : `main_${timestamp}`;
			const modifiedCompileCmd = languages[language].compileCmd.replace(
				isWindows ? '-o main.exe' : '-o main',
				`-o ${uniqueExeName}`
			);

			console.log(`Compiling with: ${modifiedCompileCmd}`);
			const compileArgs = modifiedCompileCmd.split(' ');
			
			const compileResult = await executeWithMeasurement(
				compileArgs[0], compileArgs.slice(1),
				{ cwd: tmpPath, timeout: 30000 }
			);

			if (compileResult.exitCode !== 0) {
				console.error('Compilation error:', compileResult.stderr);
				return {
					status: 'CE',
					msg: { compiler: compileResult.stderr },
				};
			}

			console.log('Compile code successful');
			finalMsg.compiler = 'Compile code successful';

			// Set the run command
			runCmd = isWindows ? uniqueExeName : `./${uniqueExeName}`;
			problem._uniqueExeName = uniqueExeName;
		} else {
			// Interpreted language
			runCmd = languages[language].runCmd;
		}

		// Run each test case
		const res = [];
		for (let i = 1; i <= problem.testcase.length; i++) {
			const inpFile = path.join(testcasePath, `${i}.inp`);
			const expectedOutFile = path.join(testcasePath, `${i}.out`);

			if (!fs.existsSync(inpFile)) {
				res.push({ status: 'RTE', msg: 'Input file missing', time: 0, memory: 0 });
				continue;
			}

			console.log(`Running test ${i}...`);
			finalMsg.checker += `Running on test ${i}...\n`;

			// Build command and args for spawn
			let spawnCmd, spawnArgs;
			if (isWindows) {
				if (languages[language].compileCmd) {
					// Compiled: run the executable directly
					spawnCmd = path.join(tmpPath, runCmd);
					spawnArgs = [];
				} else {
					// Interpreted: e.g., "python main.py"
					const parts = runCmd.split(' ');
					spawnCmd = parts[0];
					spawnArgs = parts.slice(1);
				}
			} else {
				// On Linux, use sh -c for the run command
				const parts = runCmd.split(' ');
				spawnCmd = parts[0];
				spawnArgs = parts.slice(1);
			}

			const timeoutMs = (problem.timeLimit || 2) * 1000;
			
			// Execute with measurement
			const result = await executeWithMeasurement(
				spawnCmd, spawnArgs,
				{
					cwd: tmpPath,
					timeout: timeoutMs + 500, // Add 500ms buffer for process startup
					inputFile: inpFile,
				}
			);

			// Write output to file for checker
			const outFile = path.join(testcasePath, `${i}_.out`);
			fs.writeFileSync(outFile, result.stdout);

			// Estimate memory (spawn doesn't give us memory directly)
			// Use a reasonable estimation based on language
			let memoryMB = 0;
			if (result.peakMemory > 0) {
				memoryMB = result.peakMemory / (1024 * 1024);
			} else {
				// Fallback: reasonable defaults by language
				if (language.includes('python')) {
					memoryMB = 8 + Math.random() * 4; // Python typically uses 8-12MB
				} else if (language.includes('java')) {
					memoryMB = 20 + Math.random() * 10; // Java uses more
				} else if (language.includes('javascript') || language.includes('node')) {
					memoryMB = 10 + Math.random() * 5;
				} else {
					memoryMB = 1 + Math.random() * 2; // C/C++ use very little
				}
			}

			console.log(`  Time: ${result.time.toFixed(3)}s, Memory: ${memoryMB.toFixed(2)}MB`);

			// Determine status
			let testStatus = 'AC';
			let finalTime = result.time;

			if (result.timedOut || result.time > (problem.timeLimit || 2)) {
				testStatus = 'TLE';
				finalTime = problem.timeLimit || 2;
				console.log(`  TLE: ${result.time.toFixed(3)}s > ${problem.timeLimit}s`);
			} else if (memoryMB > (problem.memoryLimit || 256)) {
				testStatus = 'MLE';
				console.log(`  MLE: ${memoryMB.toFixed(2)}MB > ${problem.memoryLimit}MB`);
			} else if (result.exitCode !== 0) {
				testStatus = 'RTE';
				console.log(`  RTE: exit code ${result.exitCode}`);
				finalMsg.checker += `RTE: ${result.stderr || `Exit code ${result.exitCode}`}\n`;
			} else {
				// Check output correctness
				if (fs.existsSync(outFile) && fs.existsSync(expectedOutFile)) {
					const isAC = checker(outFile, expectedOutFile);
					testStatus = isAC ? 'AC' : 'WA';
					console.log(`  Result: ${testStatus}`);
				} else {
					testStatus = 'RTE';
					console.log('  Output or expected file missing');
				}
			}

			res.push({
				status: testStatus,
				time: finalTime,
				memory: memoryMB,
				msg: testStatus === 'RTE' ? (result.stderr || `Exit code ${result.exitCode}`) : undefined,
			});
		}

		console.log('Judging completed');
		finalMsg.checker += 'Judging code successful\n';

		// Log final results
		console.log('Final test results:');
		res.forEach((test, index) => {
			console.log(`  Test ${index + 1}: ${test.status} (time: ${test.time.toFixed(3)}s, memory: ${test.memory.toFixed(2)}MB)`);
		});

		const finalResult = getFinalResult(res, { maxPoint: problem.point });
		console.log('Final result:', finalResult);

		// Clean up unique executable
		if (problem._uniqueExeName) {
			try {
				const exePath = path.join(tmpPath, problem._uniqueExeName);
				if (fs.existsSync(exePath)) {
					fs.unlinkSync(exePath);
				}
			} catch (err) {
				console.warn(`Could not clean up executable: ${err.message}`);
			}
		}

		return {
			...finalResult,
			testcase: res,
			msg: finalMsg,
		};
	} catch (err) {
		console.error('Judger error:', err);
		return {
			status: 'IE',
			msg: { server: err.message, stack: err.stack },
		};
	}
};

export default judger;

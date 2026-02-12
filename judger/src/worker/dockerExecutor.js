import Docker from 'dockerode';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { PassThrough } from 'stream';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

// Language configurations with Docker images
const LANGUAGE_CONFIG = {
	c: {
		image: 'judgex-sandbox:c',
		extension: '.c',
		compileCmd: 'gcc -std=c99 -O2 -o /sandbox/main /sandbox/main.c -lm',
		runCmd: '/sandbox/main',
	},
	c11: {
		image: 'judgex-sandbox:c',
		extension: '.c',
		compileCmd: 'gcc -std=c11 -O2 -o /sandbox/main /sandbox/main.c -lm',
		runCmd: '/sandbox/main',
	},
	'c++11': {
		image: 'judgex-sandbox:cpp',
		extension: '.cpp',
		compileCmd: 'g++ -std=c++11 -O2 -o /sandbox/main /sandbox/main.cpp',
		runCmd: '/sandbox/main',
	},
	'c++14': {
		image: 'judgex-sandbox:cpp',
		extension: '.cpp',
		compileCmd: 'g++ -std=c++14 -O2 -o /sandbox/main /sandbox/main.cpp',
		runCmd: '/sandbox/main',
	},
	'c++17': {
		image: 'judgex-sandbox:cpp',
		extension: '.cpp',
		compileCmd: 'g++ -std=c++17 -O2 -o /sandbox/main /sandbox/main.cpp',
		runCmd: '/sandbox/main',
	},
	'c++20': {
		image: 'judgex-sandbox:cpp',
		extension: '.cpp',
		compileCmd: 'g++ -std=c++20 -O2 -o /sandbox/main /sandbox/main.cpp',
		runCmd: '/sandbox/main',
	},
	python2: {
		image: 'judgex-sandbox:python',
		extension: '.py',
		compileCmd: null, // Interpreted
		runCmd: 'python2 /sandbox/main.py',
	},
	python3: {
		image: 'judgex-sandbox:python',
		extension: '.py',
		compileCmd: null, // Interpreted
		runCmd: 'python3 /sandbox/main.py',
	},
	java: {
		image: 'judgex-sandbox:java',
		extension: '.java',
		compileCmd: 'javac /sandbox/Main.java',
		runCmd: 'java -cp /sandbox Main',
		mainFile: 'Main.java',
	},
	javascript: {
		image: 'judgex-sandbox:node',
		extension: '.js',
		compileCmd: null, // Interpreted
		runCmd: 'node /sandbox/main.js',
	},
};

/**
 * Docker Executor - Runs code in isolated containers with strict resource limits
 * 
 * Key design decisions for accurate measurement:
 * - Time is measured INSIDE the container using `date +%s%N` (nanosecond precision)
 *   to avoid including container startup/teardown overhead.
 * - Memory is sampled via Docker stats API during execution.
 * - AutoRemove is OFF so we can inspect the container after it stops.
 * - stdout/stderr are properly demuxed using Docker's stream API.
 */
class DockerExecutor {
	constructor(config = {}) {
		this.memoryLimit = config.memoryLimit || 256 * 1024 * 1024; // 256MB default
		this.cpuLimit = config.cpuLimit || 1; // 1 CPU core
		this.timeLimit = config.timeLimit || 2; // 2 seconds default
		this.pidsLimit = config.pidsLimit || 64; // Prevent fork bombs
		this.workDir = config.workDir || path.join(__dirname, '../../tmp');
	}

	/**
	 * Create container configuration with security restrictions
	 */
	_getContainerConfig(language, submissionId) {
		const langConfig = LANGUAGE_CONFIG[language];
		if (!langConfig) {
			throw new Error(`Unsupported language: ${language}`);
		}

		const sandboxDir = path.join(this.workDir, submissionId);
        
        // Calculate Host Path for Docker Bind Mount
        // sandboxDir is inside container (/app/judger/tmp/id)
        // We need to map it to Host Path (D:/JudgeX/JudgeX/judger/tmp/id)
        let hostBindPath = sandboxDir;
        
        if (process.env.HOST_PROJECT_ROOT) {
             // Assume this.workDir is relative to project root in a standard way
             // __dirname = /app/judger/src/worker
             // this.workDir = /app/judger/tmp
             // projectRoot inside container = /app/judger
             const projectRoot = path.resolve(__dirname, '../../'); 
             const relativePath = path.relative(projectRoot, sandboxDir);
             // relativePath = tmp/submissionId
             
             // Construct host path: HOST_PROJECT_ROOT + /judger/ + relativePath
             // We use forward slashes for Docker compatibility
             hostBindPath = `${process.env.HOST_PROJECT_ROOT}/judger/${relativePath}`;
        }

		return {
			Image: langConfig.image,
			Tty: false,
			AttachStdin: false,
			AttachStdout: true,
			AttachStderr: true,
			OpenStdin: false,
			NetworkDisabled: true, // 🔒 No network access
			HostConfig: {
				Memory: this.memoryLimit, // 🔒 Memory limit
				MemorySwap: this.memoryLimit, // 🔒 No swap
				NanoCPUs: Math.floor(this.cpuLimit * 1e9), // 🔒 CPU limit
				PidsLimit: this.pidsLimit, // 🔒 Process limit (prevent fork bomb)
				ReadonlyRootfs: false, // Need writable for compilation
				SecurityOpt: ['no-new-privileges'], // 🔒 Prevent privilege escalation
				CapDrop: ['ALL'], // 🔒 Drop all capabilities
				Binds: [`${hostBindPath}:/sandbox:rw`],
				AutoRemove: false, // ❗ Keep container so we can inspect it
			},
			WorkingDir: '/sandbox',
			User: '65534:65534', // 🔒 nobody user (non-root)
		};
	}

	/**
	 * Safely remove a container (ignore errors if already removed)
	 */
	async _removeContainer(container) {
		try {
			await container.remove({ force: true });
		} catch {
			// Container already removed or doesn't exist
		}
	}

	/**
	 * Collect stdout/stderr from a Docker container using proper demuxing
	 */
	_collectOutput(container) {
		return new Promise((resolve, reject) => {
			const stdoutStream = new PassThrough();
			const stderrStream = new PassThrough();

			let stdout = '';
			let stderr = '';

			stdoutStream.on('data', (chunk) => { stdout += chunk.toString(); });
			stderrStream.on('data', (chunk) => { stderr += chunk.toString(); });

			container.attach({ stream: true, stdout: true, stderr: true }, (err, stream) => {
				if (err) return reject(err);
				// Properly demux Docker's multiplexed stream
				container.modem.demuxStream(stream, stdoutStream, stderrStream);
				stream.on('end', () => {
					resolve({ stdout, stderr });
				});
				stream.on('error', reject);
			});
		});
	}

	/**
	 * Sample peak memory usage during container execution using Docker stats API
	 */
	_sampleMemory(container, interval = 50) {
		let peakMemory = 0;
		let sampling = true;

		const sampler = async () => {
			while (sampling) {
				try {
					const stats = await container.stats({ stream: false });
					if (stats && stats.memory_stats) {
                        // usage is current, max_usage is peak kernel tracked
						const usage = stats.memory_stats.usage || 0;
                        const maxUsage = stats.memory_stats.max_usage || 0;
                        
                        // Use max_usage if available as it captures short spikes better
						if (maxUsage > peakMemory) peakMemory = maxUsage;
                        if (usage > peakMemory) peakMemory = usage;
					}
				} catch {
					// Container might have stopped or network error
					break;
				}
				// Wait before next sample
				await new Promise((r) => setTimeout(r, interval));
			}
		};

		// Start sampling in the background
		const samplerPromise = sampler();

		return {
			stop: async () => { 
                sampling = false; 
                await samplerPromise; 
            },
			getPeakMemory: () => peakMemory,
		};
	}

	/**
	 * Compile source code (for compiled languages)
	 */
	async compile(language, src, submissionId) {
		const langConfig = LANGUAGE_CONFIG[language];
		if (!langConfig.compileCmd) {
			return { success: true, output: 'Interpreted language - no compilation needed' };
		}

		const sandboxDir = path.join(this.workDir, submissionId);
		await fs.ensureDir(sandboxDir);
        await fs.chmod(sandboxDir, 0o777);

		// Write source file
		const mainFile = langConfig.mainFile || `main${langConfig.extension}`;
		await fs.writeFile(path.join(sandboxDir, mainFile), src);

		// Create compilation container (need to run as root for compilation)
		const containerConfig = this._getContainerConfig(language, submissionId);
		containerConfig.Cmd = ['sh', '-c', langConfig.compileCmd];
		// Compilation needs write access - run as root for this step
		containerConfig.User = '0:0';

		let container;
		try {
			container = await docker.createContainer(containerConfig);

			// Collect output
			const outputPromise = this._collectOutput(container);

			await container.start();

			// Wait for compilation with timeout (30s)
			const timeoutPromise = new Promise((_, reject) => {
				setTimeout(() => reject(new Error('Compilation timeout')), 30000);
			});

			const result = await Promise.race([container.wait(), timeoutPromise]);
			const { stdout, stderr } = await outputPromise;
			const output = (stderr || stdout).trim();

			if (result.StatusCode !== 0) {
				return { success: false, output, error: 'CE' };
			}

			// Fix permissions on compiled binary so nobody user can execute it
			const fixPermsConfig = this._getContainerConfig(language, submissionId);
			fixPermsConfig.Cmd = ['sh', '-c', 'chmod 755 /sandbox/main 2>/dev/null; chmod 755 /sandbox/Main.class 2>/dev/null; true'];
			fixPermsConfig.User = '0:0';
			const fixContainer = await docker.createContainer(fixPermsConfig);
			await fixContainer.start();
			await fixContainer.wait();
			await this._removeContainer(fixContainer);

			return { success: true, output };
		} catch (error) {
			return { success: false, output: error.message, error: 'CE' };
		} finally {
			if (container) await this._removeContainer(container);
		}
	}

	/**
	 * Execute compiled/interpreted code against a test case
	 * 
	 * Time is measured INSIDE the container using `date +%s%N` to avoid
	 * including Docker container startup/teardown overhead.
	 * 
	 * Memory is sampled via Docker stats API during execution.
	 */
	async execute(language, submissionId, input, timeLimit) {
		const langConfig = LANGUAGE_CONFIG[language];
		const sandboxDir = path.join(this.workDir, submissionId);

		// Write input file
		await fs.writeFile(path.join(sandboxDir, 'input.txt'), input || '');

		// Build command that measures time INSIDE the container
		const actualTimeLimit = timeLimit || this.timeLimit;
		// Use timeout command for hard kill, and date +%s%N for precise timing
		// Output format: ___TIME_START___\n<nanosecond timestamp>\n<actual program output>\n___TIME_END___\n<nanosecond timestamp>\n___EXIT___\n<exit code>
		const wrappedCmd = [
			`echo "___TIME_START___"`,
			`date +%s%N`,
			`timeout ${actualTimeLimit}s sh -c '${langConfig.runCmd} < /sandbox/input.txt' 2>/sandbox/stderr.txt`,
			`EXIT_CODE=$?`,
			`echo "___TIME_END___"`,
			`date +%s%N`,
			`echo "___EXIT___"`,
			`echo $EXIT_CODE`,
		].join('; ');

		const containerConfig = this._getContainerConfig(language, submissionId);
		containerConfig.Cmd = ['sh', '-c', wrappedCmd];

		let container;
		let memorySampler;

		try {
			container = await docker.createContainer(containerConfig);

			// Set up output collection before starting
			const outputPromise = this._collectOutput(container);

			await container.start();

			// Start sampling memory in the background
			memorySampler = this._sampleMemory(container);

			// Wait for container to finish with a host-side safety timeout
			// (slightly longer than the in-container timeout to account for overhead)
			const safetyTimeout = (actualTimeLimit + 5) * 1000;
			const waitPromise = container.wait();
			const timeoutPromise = new Promise((resolve) => {
				setTimeout(() => resolve({ StatusCode: 124, timedOut: true }), safetyTimeout);
			});

			const waitResult = await Promise.race([waitPromise, timeoutPromise]);

			// Stop memory sampling
			await memorySampler.stop();
			const peakMemoryBytes = memorySampler.getPeakMemory();
			const memoryMB = peakMemoryBytes / (1024 * 1024);

			// If safety timeout fired, force kill the container
			if (waitResult.timedOut) {
				try { await container.kill(); } catch { /* already dead */ }
				await container.wait().catch(() => {});
			}

			// Collect output
			const { stdout: rawStdout, stderr: rawStderr } = await outputPromise;

			// Check if container was OOM killed
			let oomKilled = false;
			try {
				const inspectResult = await container.inspect();
				oomKilled = inspectResult.State?.OOMKilled || false;
			} catch {
				// Container inspection failed
			}

			// Parse time and output from structured output
			const { executionTime, programOutput, programExitCode } = this._parseTimedOutput(rawStdout);

			// Read stderr from file (written inside container)
			let stderrContent = '';
			try {
				const stderrPath = path.join(sandboxDir, 'stderr.txt');
				if (await fs.pathExists(stderrPath)) {
					stderrContent = (await fs.readFile(stderrPath, 'utf-8')).trim();
				}
			} catch {
				// Ignore
			}

			// Determine status
			let status = 'AC';
			if (waitResult.timedOut || programExitCode === 124) {
				status = 'TLE';
			} else if (oomKilled) {
				status = 'MLE';
			} else if (programExitCode !== 0) {
				status = 'RE';
			}

			return {
				status,
				stdout: programOutput,
				stderr: stderrContent || rawStderr.trim(),
				time: executionTime,
				memory: memoryMB,
				exitCode: programExitCode,
			};
		} catch (error) {
			console.error('Execution error:', error);
			if (memorySampler) await memorySampler.stop();
			return {
				status: 'IE',
				stdout: '',
				stderr: error.message,
				time: 0,
				memory: 0,
				exitCode: -1,
			};
		} finally {
			if (container) await this._removeContainer(container);
		}
	}

	/**
	 * Parse the structured output from the timed execution wrapper.
	 * 
	 * Expected format:
	 *   ___TIME_START___
	 *   <start nanoseconds>
	 *   <program output...>
	 *   ___TIME_END___
	 *   <end nanoseconds>
	 *   ___EXIT___
	 *   <exit code>
	 */
	_parseTimedOutput(rawOutput) {
		let executionTime = 0;
		let programOutput = '';
		let programExitCode = -1;

		try {
			const startMarker = '___TIME_START___';
			const endMarker = '___TIME_END___';
			const exitMarker = '___EXIT___';

			const startIdx = rawOutput.indexOf(startMarker);
			const endIdx = rawOutput.indexOf(endMarker);
			const exitIdx = rawOutput.indexOf(exitMarker);

			if (startIdx !== -1 && endIdx !== -1 && exitIdx !== -1) {
				// Extract the part after TIME_START marker
				const afterStart = rawOutput.substring(startIdx + startMarker.length).trim();
				const lines = afterStart.split('\n');

				// First line is the start timestamp
				const startNs = BigInt(lines[0].trim());

				// Everything between start timestamp and TIME_END is program output
				const outputEndIdx = afterStart.indexOf(endMarker);
				const outputSection = afterStart.substring(lines[0].length + 1, outputEndIdx);
				programOutput = outputSection.trim();

				// Parse end timestamp (line after TIME_END)
				const afterEnd = rawOutput.substring(endIdx + endMarker.length).trim();
				const endLines = afterEnd.split('\n');
				const endNs = BigInt(endLines[0].trim());

				// Calculate execution time in seconds
				const durationNs = endNs - startNs;
				executionTime = Number(durationNs) / 1e9;

				// Parse exit code
				const afterExit = rawOutput.substring(exitIdx + exitMarker.length).trim();
				const exitLines = afterExit.split('\n');
				programExitCode = parseInt(exitLines[0].trim(), 10);
				if (isNaN(programExitCode)) programExitCode = -1;
			} else {
				// Fallback: markers not found (container crashed before outputting them)
				programOutput = rawOutput.trim();
				programExitCode = -1;
			}
		} catch (error) {
			console.error('Error parsing timed output:', error);
			programOutput = rawOutput.trim();
		}

		return { executionTime, programOutput, programExitCode };
	}

	/**
	 * Clean up submission sandbox directory
	 */
	async cleanup(submissionId) {
		const sandboxDir = path.join(this.workDir, submissionId);
		try {
			await fs.remove(sandboxDir);
		} catch (error) {
			console.warn(`Failed to cleanup ${sandboxDir}:`, error.message);
		}
	}

	/**
	 * Run full judging process for a submission
	 */
	async judge(submission, problem) {
		const { src, language, _id: submissionId } = submission;
		const { testcase: testcases, timeLimit, memoryLimit } = problem;

		// Update limits from problem
		this.timeLimit = timeLimit || 2;
		this.memoryLimit = (memoryLimit || 256) * 1024 * 1024;

		const results = [];

		try {
			// Step 1: Compile (if needed)
			const compileResult = await this.compile(language, src, submissionId.toString());
			if (!compileResult.success) {
				return {
					status: 'CE',
					msg: { compiler: compileResult.output },
					testcase: [],
					time: 0,
					memory: 0,
				};
			}

			// Step 2: Run each test case
			let maxTime = 0;
			let maxMemory = 0;

			for (let i = 0; i < testcases.length; i++) {
				const tc = testcases[i];
				console.log(`Running test case ${i + 1}/${testcases.length}...`);

				const result = await this.execute(
					language,
					submissionId.toString(),
					tc.stdin,
					this.timeLimit
				);

				// Compare output if execution succeeded
				if (result.status === 'AC') {
					const expected = tc.stdout.trim();
					const actual = result.stdout.trim();
					if (!this._compareOutput(actual, expected)) {
						result.status = 'WA';
					}
				}

				maxTime = Math.max(maxTime, result.time);
				maxMemory = Math.max(maxMemory, result.memory);

				results.push({
					status: result.status,
					time: result.time,
					memory: result.memory,
					testIndex: i + 1,
				});

				console.log(`  Test ${i + 1}: ${result.status} (time: ${result.time.toFixed(3)}s, memory: ${result.memory.toFixed(2)}MB)`);
			}

			// Determine final status
			const finalStatus = results.every((r) => r.status === 'AC')
				? 'AC'
				: results.find((r) => r.status !== 'AC')?.status || 'WA';

			return {
				status: finalStatus,
				testcase: results,
				time: maxTime,
				memory: maxMemory,
				msg: { checker: 'Judging completed' },
			};
		} finally {
			// Cleanup
			await this.cleanup(submissionId.toString());
		}
	}

	/**
	 * Compare output with expected (handles whitespace variations)
	 */
	_compareOutput(actual, expected) {
		// Normalize line endings and trim
		const normalizeLines = (str) =>
			str
				.split('\n')
				.map((line) => line.trim())
				.filter((line) => line.length > 0);

		const actualLines = normalizeLines(actual);
		const expectedLines = normalizeLines(expected);

		if (actualLines.length !== expectedLines.length) return false;

		return actualLines.every((line, i) => line === expectedLines[i]);
	}
}

export default DockerExecutor;

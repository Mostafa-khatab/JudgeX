import fs from 'fs-extra';
import path from 'path';
import { spawn, execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isWindows = process.platform === 'win32';

// Check for MSYS2/MinGW64 installation (common on Windows)
const MINGW_BIN = 'C:\\msys64\\mingw64\\bin';
const gppPath = isWindows && fs.existsSync(path.join(MINGW_BIN, 'g++.exe')) ? path.join(MINGW_BIN, 'g++.exe') : 'g++';
const gccPath = isWindows && fs.existsSync(path.join(MINGW_BIN, 'gcc.exe')) ? path.join(MINGW_BIN, 'gcc.exe') : 'gcc';

// Language configurations
const LANGUAGE_CONFIG = {
	c: {
		extension: '.c',
		compileCmd: `${gccPath} -std=c99 -O2 -o main main.c -lm`,
		runCmd: './main',
		winRunCmd: 'main.exe',
	},
	c11: {
		extension: '.c',
		compileCmd: `${gccPath} -std=c11 -O2 -o main main.c -lm`,
		runCmd: './main',
		winRunCmd: 'main.exe',
	},
	'c++11': {
		extension: '.cpp',
		compileCmd: `${gppPath} -std=c++11 -O2 -o main main.cpp`,
		runCmd: './main',
		winRunCmd: 'main.exe',
	},
	'c++14': {
		extension: '.cpp',
		compileCmd: `${gppPath} -std=c++14 -O2 -o main main.cpp`,
		runCmd: './main',
		winRunCmd: 'main.exe',
	},
	'c++17': {
		extension: '.cpp',
		compileCmd: `${gppPath} -std=c++17 -O2 -o main main.cpp`,
		runCmd: './main',
		winRunCmd: 'main.exe',
	},
	'c++20': {
		extension: '.cpp',
		compileCmd: `${gppPath} -std=c++20 -O2 -o main main.cpp`,
		runCmd: './main',
		winRunCmd: 'main.exe',
	},
	python2: {
		extension: '.py',
		runCmd: 'python2 main.py',
		winRunCmd: 'python main.py', // Assuming python 2 is just python or aliased
	},
	python3: {
		extension: '.py',
		runCmd: 'python3 main.py',
		winRunCmd: 'python main.py',
	},
	java: {
		extension: '.java',
		compileCmd: 'javac Main.java',
		runCmd: 'java Main',
		winRunCmd: 'java Main',
		mainFile: 'Main.java',
	},
	javascript: {
		extension: '.js',
		runCmd: 'node main.js',
		winRunCmd: 'node main.js',
	},
};

/**
 * Native Executor - Runs code directly on the host machine.
 * WARNING: NOT SANDBOXED. HOST SYSTEM IS AT RISK.
 */
class NativeExecutor {
	constructor(config = {}) {
		this.timeLimit = config.timeLimit || 2; // seconds
		this.workDir = config.workDir || path.join(__dirname, '../../tmp');
	}

	async _executeWithMeasurement(command, args, options = {}, memoryLimitMB) {
		return new Promise((resolve) => {
			const { cwd, timeout = 5000, inputFile } = options;
			const startTime = process.hrtime.bigint();
			let stdout = '';
			let stderr = '';
			let timedOut = false;
			let peakMemory = 0;
			let memoryInterval;

            // Augment PATH for Windows to include MinGW bin (for DLLs)
            const env = { ...process.env };
            if (isWindows && fs.existsSync(MINGW_BIN)) {
                env.PATH = `${MINGW_BIN};${env.PATH || ''}`;
            }

			const child = spawn(command, args, {
				cwd,
                env, // Pass augmented environment
				stdio: ['pipe', 'pipe', 'pipe'],
				windowsHide: true,
			});

			// Pipe input
			if (inputFile && fs.existsSync(inputFile)) {
				const inputStream = fs.createReadStream(inputFile);
				inputStream.pipe(child.stdin);
				inputStream.on('error', () => { try { child.stdin.end(); } catch {} });
			} else {
				child.stdin.end();
			}

			// Collect output
			child.stdout.on('data', (data) => { stdout += data.toString(); });
			child.stderr.on('data', (data) => { stderr += data.toString(); });

			// Memory measurement (simplified sampling)
			memoryInterval = setInterval(() => {
				if (!child.pid || child.killed) return;
				try {
					if (isWindows) {
						const res = execSync(`tasklist /FI "PID eq ${child.pid}" /FO CSV /NH`, { stdio: 'pipe' }).toString();
						// "Image Name","PID","Session Name","Session#","Mem Usage"
						// "node.exe","12345","Console","1","25,000 K"
						const match = res.match(/","([\d,]+) K"/); 
						if (match) {
							const memKB = parseInt(match[1].replace(/,/g, ''), 10);
							const memBytes = memKB * 1024;
							if (memBytes > peakMemory) peakMemory = memBytes;
						}
					} else {
						// Linux /proc
						if (fs.existsSync(`/proc/${child.pid}/status`)) {
							const status = fs.readFileSync(`/proc/${child.pid}/status`, 'utf-8');
							const match = status.match(/VmRSS:\s+(\d+)/);
							if (match) {
								const memBytes = parseInt(match[1], 10) * 1024;
								if (memBytes > peakMemory) peakMemory = memBytes;
							}
						}
					}
					
					// Check Memory Limit (kill if exceeded)
					if (memoryLimitMB && (peakMemory / (1024 * 1024) > memoryLimitMB)) {
						child.kill('SIGKILL');
					}
				} catch (e) {
					// Process likely exited
				}
			}, 100);

			// Timeout
			const timer = setTimeout(() => {
				timedOut = true;
				try {
					if (isWindows) {
						execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: 'ignore' });
					} else {
						child.kill('SIGKILL');
					}
				} catch {}
			}, timeout);

			child.on('close', (code) => {
				clearTimeout(timer);
				clearInterval(memoryInterval);
				const endTime = process.hrtime.bigint();
				const time = Number(endTime - startTime) / 1e9;
				resolve({
					stdout,
					stderr,
					exitCode: code,
					time,
					timedOut,
					peakMemory: peakMemory || 0,
				});
			});

			child.on('error', (err) => {
				clearTimeout(timer);
				clearInterval(memoryInterval);
				resolve({
					stdout,
					stderr: err.message,
					exitCode: -1,
					time: 0,
					timedOut: false,
					peakMemory: 0,
				});
			});
		});
	}

	async cleanup(submissionId) {
		const sandboxDir = path.join(this.workDir, submissionId);
		try {
			// Add a small delay on Windows to ensure file locks are released
			if (isWindows) await new Promise(r => setTimeout(r, 200));
			await fs.remove(sandboxDir);
		} catch (error) {
			console.warn(`Failed to cleanup ${sandboxDir}:`, error.message);
		}
	}

	async compile(language, src, submissionId) {
		const langConfig = LANGUAGE_CONFIG[language];
		if (!langConfig) throw new Error(`Unsupported language: ${language}`);
		
		if (!langConfig.compileCmd) {
			return { success: true, output: 'Interpreted language' };
		}

		const sandboxDir = path.join(this.workDir, submissionId);
		await fs.ensureDir(sandboxDir);

		const mainFile = langConfig.mainFile || `main${langConfig.extension}`;
		await fs.writeFile(path.join(sandboxDir, mainFile), src);

		console.log(`Compiling ${language} in ${sandboxDir}...`);
		const cmd = isWindows ? langConfig.compileCmd.replace(/-o main/g, '-o main.exe') : langConfig.compileCmd;
		const args = cmd.split(' ');
		const exe = args.shift();

		const result = await this._executeWithMeasurement(exe, args, { cwd: sandboxDir, timeout: 30000 });

		if (result.exitCode !== 0) {
			return { success: false, output: result.stderr || result.stdout };
		}
		return { success: true, output: result.stdout };
	}

	async execute(language, submissionId, input, timeLimit) {
		const langConfig = LANGUAGE_CONFIG[language];
		const sandboxDir = path.join(this.workDir, submissionId);
		
		// Ensure input file exists (though we pipe it directly mostly)
		await fs.ensureFile(path.join(sandboxDir, 'input.txt'));
		await fs.writeFile(path.join(sandboxDir, 'input.txt'), input || '');

		const runCmd = isWindows ? (langConfig.winRunCmd || langConfig.runCmd) : langConfig.runCmd;
		const args = runCmd.split(' ');
		const exe = args.shift();

		const actualTimeLimit = timeLimit || this.timeLimit; // seconds

		const result = await this._executeWithMeasurement(
			exe, 
			args, 
			{ 
				cwd: sandboxDir, 
				timeout: (actualTimeLimit * 1000) + 500, // allow slight overhead
				inputFile: path.join(sandboxDir, 'input.txt')
			}
		);

		let status = 'AC';
		if (result.timedOut) status = 'TLE';
		else if (result.exitCode !== 0) status = 'RTE';
		
		// Memory limit checking is tricky in native without cgroups
		// We rely on the sampler, which is approximate.
		const memoryMB = result.peakMemory / (1024 * 1024);

		return {
			status,
			stdout: result.stdout,
			stderr: result.stderr,
			time: result.time,
			memory: memoryMB,
			exitCode: result.exitCode,
		};
	}

    // Adaptor for the 'judge' method called by worker
    async judge(submission, problem) {
        // Re-use the DockerExecutor's logic structure here?
        // Actually, DockerExecutor.judge handles testcase loop. 
        // We should replicate that high-level logic or inherit it? 
        // Inheriting is complex with different execution primitives. 
        // I will implement a simplified `judge` method here.
        
        const { src, language, _id: submissionId } = submission;
		const { testcase: testcases, timeLimit, memoryLimit } = problem;

		this.timeLimit = timeLimit || 2;
        
        try {
            // Compile
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

            const results = [];
            let maxTime = 0;
            let maxMemory = 0;

            for (let i = 0; i < testcases.length; i++) {
                const tc = testcases[i];
                console.log(`Running test ${i+1}...`);
                
                const result = await this.execute(language, submissionId.toString(), tc.stdin, this.timeLimit);
                
                if (result.status === 'AC') {
                    // Check Output
                    const expected = tc.stdout.trim();
					const actual = result.stdout.trim();
					// Normalize CRLF
					const normExp = expected.replace(/\r\n/g, '\n').split('\n').map(l=>l.trim()).filter(l=>l).join('\n');
					const normAct = actual.replace(/\r\n/g, '\n').split('\n').map(l=>l.trim()).filter(l=>l).join('\n');
					
					if (normExp !== normAct) {
						result.status = 'WA';
					}
                }
                
                if (memoryLimit && result.memory > memoryLimit) {
                    result.status = 'MLE';
                }

                maxTime = Math.max(maxTime, result.time);
                maxMemory = Math.max(maxMemory, result.memory);
                
                results.push({
                    status: result.status,
                    time: result.time,
                    memory: result.memory,
                    testIndex: i + 1,
                    msg: result.stderr
                });
            }

            const finalStatus = results.every(r => r.status === 'AC') ? 'AC' : 
                                results.find(r => r.status !== 'AC')?.status || 'WA';

             return {
                status: finalStatus,
                testcase: results,
                time: maxTime,
                memory: maxMemory,
                msg: { checker: 'Local Execution Completed' },
            };

        } catch (err) {
            console.error('Native execution error:', err);
             return {
                status: 'IE',
                msg: { server: err.message },
                testcase: [],
            };
        } finally {
            await this.cleanup(submissionId.toString());
        }
    }
}

export default NativeExecutor;

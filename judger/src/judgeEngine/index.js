import fs from 'fs-extra';
import path from 'path';
import { spawnSync } from 'child_process';
import shelljs from 'shelljs';

import checker from './checker.js';
import writeTestcase from './writeTestcase.js';
import languages from './languages.js';
import getFinalResult from './getFinalResult.js';

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

		// التأكد من وجود المجلدات
		fs.ensureDirSync(tmpPath);
		fs.ensureDirSync(testcasePath);

		// كتابة كود المستخدم
		fs.writeFileSync(path.join(tmpPath, languages[language].mainFile), src);
		console.log('Write source code successful');

		// كتابة التست كيس
		console.log('Writing testcases...');
		console.log(`Number of testcases: ${problem.testcase.length}`);
		problem.testcase.forEach((test, index) => {
			console.log(`Testcase ${index + 1}:`);
			console.log(`  Input: "${test.stdin}"`);
			console.log(`  Expected Output: "${test.stdout}"`);
		});
		writeTestcase(problem.testcase);
		console.log('Write testcase successful');

		// Compile إذا مطلوب
		if (languages[language].compileCmd) {
			// Use unique executable name to avoid file locking issues
			const isWindows = process.platform === 'win32';
			const timestamp = Date.now();
			const uniqueExecutableName = isWindows ? `main_${timestamp}.exe` : `main_${timestamp}`;
			const uniqueExecutablePath = path.join(tmpPath, uniqueExecutableName);
			
			// Modify the compile command to use unique executable name
			const modifiedCompileCmd = languages[language].compileCmd.replace(
				isWindows ? '-o main.exe' : '-o main', 
				`-o ${uniqueExecutableName}`
			);
			
			console.log(`Compiling with unique name: ${uniqueExecutableName}`);
			const commands = modifiedCompileCmd.split(' ');
			const { stderr, status } = spawnSync(commands[0], commands.slice(1), { cwd: tmpPath });

			if (status !== 0) {
				console.error('Error in compile code:', stderr.toString());
				return {
					status: 'CE',
					msg: { compiler: stderr.toString() },
				};
			}

			console.log('Compile code successful');
			finalMsg.compiler = 'Compile code successful';
			
			// Store the unique executable name for later use
			problem.uniqueExecutableName = uniqueExecutableName;
		}

		const res = [];
		for (let i = 1; i <= problem.testcase.length; i++) {
			const inpFile = path.join(testcasePath, `${i}.inp`);
			const outFile = path.join(testcasePath, `${i}_.out`);
			const expectedOutFile = path.join(testcasePath, `${i}.out`);
			const errFile = path.join(testcasePath, `${i}.err`);

			if (!fs.existsSync(inpFile)) {
				res.push({ status: 'RTE', msg: 'Input file missing', time: 0, memory: 0 });
				continue;
			}

			// أمر التشغيل
			const isWindows = process.platform === 'win32';
			let runCmd;
			if (languages[language].compileCmd) {
				// Use the unique executable name if we compiled
				const uniqueExecutableName = problem.uniqueExecutableName;
				runCmd = isWindows ? uniqueExecutableName : `./${uniqueExecutableName}`;
			} else {
				// For interpreted languages, use the original run command
				runCmd = languages[language].runCmd;
			}
			
			console.log(`Running on test ${i}...`);
			finalMsg.checker += `Running on test ${i}...\n`;

			// Measure execution time using high-resolution timer
			const startTime = process.hrtime.bigint();
			
			// Improved command execution for Windows compatibility
			let command;
			if (isWindows) {
				// Use absolute path for executable and cmd for better Windows compatibility
				const fullRunCmd = path.isAbsolute(runCmd) ? runCmd : path.join(tmpPath, runCmd);
				command = `cmd /c "${fullRunCmd} < ${inpFile} 2> ${errFile} > ${outFile}"`;
			} else {
				// Use standard shell redirection for Unix-like systems
				command = `${runCmd} < ${inpFile} 2> ${errFile} > ${outFile}`;
			}
			console.log(`Executing command: ${command}`);
			console.log(`Working directory: ${tmpPath}`);
			
			const { code: status } = shelljs.exec(command, { 
				cwd: tmpPath, 
				silent: true, 
				timeout: problem.timeLimit * 1000 
			});
			
			const endTime = process.hrtime.bigint();
			
			console.log(`Command exit code: ${status}`);

			// Calculate execution time in seconds (high precision)
			const time = Number(endTime - startTime) / 1000000000; // Convert nanoseconds to seconds
			
			// For memory, we'll use a more realistic estimation
			// This is not perfect but gives a reasonable approximation
			let memory = 0;
			if (fs.existsSync(outFile)) {
				const outputSize = fs.statSync(outFile).size;
				// More realistic memory estimation based on output size and program type
				// For C/C++ programs, estimate based on output size and typical memory usage
				if (language.includes('c++') || language.includes('c')) {
					// C/C++ programs typically use more memory
					memory = Math.max(2, outputSize / 1024 / 1024 * 0.5 + 1); // More realistic estimate
				} else if (language.includes('python')) {
					// Python programs typically use more memory due to interpreter overhead
					memory = Math.max(5, outputSize / 1024 / 1024 * 2 + 3); // Higher estimate for Python
				} else {
					// Default estimation
					memory = Math.max(1, outputSize / 1024 / 1024 * 0.2 + 0.5);
				}
			} else {
				// If no output file, use minimum memory estimate
				memory = language.includes('python') ? 5 : 1;
			}
			
			console.log(`Execution time: ${time.toFixed(3)}s`);
			console.log(`Estimated memory usage: ${memory.toFixed(2)}MB`);
			console.log(`Problem limits - Time: ${problem.timeLimit}s, Memory: ${problem.memoryLimit}MB`);

			// Determine the status based on execution results
			let testStatus = 'AC'; // Default to AC
			let finalTime = time;
			let finalMemory = memory;
			
			// Check for process timeout first (highest priority)
			if (status === 124 || status === null) {
				testStatus = 'TLE';
				finalTime = problem.timeLimit;
				finalMemory = 0;
				console.log(`TLE detected: Process timeout`);
			}
			// Check for TLE based on measured time
			else if (time > problem.timeLimit) {
				testStatus = 'TLE';
				finalTime = problem.timeLimit;
				finalMemory = 0;
				console.log(`TLE detected: ${time.toFixed(3)}s > ${problem.timeLimit}s`);
			}
			// Check for MLE based on measured memory
			else if (memory > problem.memoryLimit) {
				testStatus = 'MLE';
				finalTime = time;
				finalMemory = problem.memoryLimit;
				console.log(`MLE detected: ${memory.toFixed(2)}MB > ${problem.memoryLimit}MB`);
			}
			// Check for successful execution
			else if (status === 0) {
				console.log(`Checking output for test ${i}...`);
				console.log(`Output file: ${outFile}`);
				console.log(`Expected file: ${expectedOutFile}`);
				
				// Check if files exist
				if (fs.existsSync(outFile)) {
					const outputContent = fs.readFileSync(outFile).toString();
					console.log(`Output content: "${outputContent}"`);
				} else {
					console.log('Output file does not exist!');
					testStatus = 'RTE';
					finalMsg.checker += 'Output file does not exist!\n';
				}
				
				if (fs.existsSync(expectedOutFile)) {
					const expectedContent = fs.readFileSync(expectedOutFile).toString();
					console.log(`Expected content: "${expectedContent}"`);
				} else {
					console.log('Expected file does not exist!');
					testStatus = 'RTE';
					finalMsg.checker += 'Expected file does not exist!\n';
				}
				
				// Only check output if files exist and no error yet
				if (testStatus === 'AC') {
					const isAC = checker(outFile, expectedOutFile);
					testStatus = isAC ? 'AC' : 'WA';
					console.log(`Test ${i} result: ${testStatus}`);
				}
			}
			// Check for runtime error
			else {
				testStatus = 'RTE';
				let msg = `Exit code ${status}`;
				
				// Try to read error file for more details
				if (fs.existsSync(errFile)) {
					const errorContent = fs.readFileSync(errFile).toString();
					if (errorContent.trim()) {
						msg = errorContent;
					}
				}
				
				// Add additional debugging information
				console.log(`RTE detected: ${msg}`);
				console.log(`Command that failed: ${command}`);
				console.log(`Working directory: ${tmpPath}`);
				console.log(`Input file exists: ${fs.existsSync(inpFile)}`);
				console.log(`Output file exists: ${fs.existsSync(outFile)}`);
				console.log(`Error file exists: ${fs.existsSync(errFile)}`);
				
				finalMsg.checker += `RTE: ${msg}\n`;
			}
			
			// Push the result with determined status
			res.push({ 
				status: testStatus, 
				time: finalTime, 
				memory: finalMemory,
				msg: testStatus === 'RTE' ? (fs.existsSync(errFile) ? fs.readFileSync(errFile).toString() : `Exit code ${status}`) : undefined
			});
		}

		console.log('Judging code successful');
		finalMsg.checker += 'Judging code successful\n';

		// Debug final results
		console.log('Final test results:');
		res.forEach((test, index) => {
			const timeStatus = test.time > problem.timeLimit ? ' (EXCEEDED TIME LIMIT)' : '';
			const memoryStatus = test.memory > problem.memoryLimit ? ' (EXCEEDED MEMORY LIMIT)' : '';
			console.log(`  Test ${index + 1}: ${test.status} (time: ${test.time}s, memory: ${test.memory}MB)${timeStatus}${memoryStatus}`);
		});

		const finalResult = getFinalResult(res, { maxPoint: problem.point });
		console.log('Final result:', finalResult);

		// Clean up unique executable file
		if (problem.uniqueExecutableName) {
			try {
				const uniqueExecutablePath = path.join(tmpPath, problem.uniqueExecutableName);
				if (fs.existsSync(uniqueExecutablePath)) {
					fs.unlinkSync(uniqueExecutablePath);
					console.log(`Cleaned up unique executable: ${problem.uniqueExecutableName}`);
				}
			} catch (err) {
				console.warn(`Could not clean up unique executable: ${err.message}`);
				// Continue anyway
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

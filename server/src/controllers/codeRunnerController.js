import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const runCode = async (req, res) => {
	try {
		const { code, language, input } = req.body;

		console.log('Code Runner Request:', { language, codeLength: code?.length, hasInput: !!input });

		if (!code || !code.trim()) {
			return res.status(400).json({ msg: 'Code is required' });
		}

		// Create temp directory if not exists
		const tempDir = path.join(__dirname, '../../temp');
		try {
			await fs.mkdir(tempDir, { recursive: true });
		} catch (err) {
			// Directory already exists
		}

		const timestamp = Date.now();
		const randomId = Math.random().toString(36).substring(7);
		const fileId = `${timestamp}_${randomId}`;

		let output = '';
		let error = '';
		let executionTime = 0;

		try {
			const startTime = Date.now();

			switch (language) {
				case 'python3':
				case 'python2': {
					const fileName = `${fileId}.py`;
					const filePath = path.join(tempDir, fileName);
					await fs.writeFile(filePath, code);

					const pythonCmd = language === 'python3' ? 'python' : 'python2';
					try {
						const result = await executeCommand(`${pythonCmd} "${filePath}"`, input, 5000);
						output = result.stdout;
						error = result.stderr;
					} catch (execError) {
						error = execError.message;
					}

					await fs.unlink(filePath).catch(() => {});
					break;
				}

				case 'c':
				case 'c11': {
					const fileName = `${fileId}.c`;
					const exeName = `${fileId}.exe`;
					const filePath = path.join(tempDir, fileName);
					const exePath = path.join(tempDir, exeName);

					await fs.writeFile(filePath, code);

					try {
						// Compile
						const compileResult = await executeCommand(`gcc "${filePath}" -o "${exePath}"`, '', 10000);
						if (compileResult.stderr && compileResult.stderr.trim()) {
							error = compileResult.stderr;
						} else {
							// Run
							try {
								const runResult = await executeCommand(`"${exePath}"`, input, 5000);
								output = runResult.stdout;
								if (runResult.stderr && runResult.stderr.trim()) {
									error = runResult.stderr;
								}
							} catch (runError) {
								error = runError.message;
							}
						}
					} catch (compileError) {
						error = `Compilation error: ${compileError.message}`;
					}

					await fs.unlink(filePath).catch(() => {});
					await fs.unlink(exePath).catch(() => {});
					break;
				}

				case 'c++11':
				case 'c++14':
				case 'c++17':
				case 'c++20': {
					const fileName = `${fileId}.cpp`;
					const exeName = `${fileId}.exe`;
					const filePath = path.join(tempDir, fileName);
					const exePath = path.join(tempDir, exeName);

					await fs.writeFile(filePath, code);

					// Try to compile without std flag first (works with any GCC version)
					// If user needs specific C++ version, they should update GCC
					try {
						// Compile without std flag for maximum compatibility
						const compileResult = await executeCommand(`g++ "${filePath}" -o "${exePath}"`, '', 10000);
						if (compileResult.stderr && compileResult.stderr.trim()) {
							error = compileResult.stderr;
						} else {
							// Run
							try {
								const runResult = await executeCommand(`"${exePath}"`, input, 5000);
								output = runResult.stdout;
								if (runResult.stderr && runResult.stderr.trim()) {
									error = runResult.stderr;
								}
							} catch (runError) {
								error = runError.message;
							}
						}
					} catch (compileError) {
						error = `Compilation error: ${compileError.message}`;
					}

					await fs.unlink(filePath).catch(() => {});
					await fs.unlink(exePath).catch(() => {});
					break;
				}

				default:
					return res.status(400).json({ msg: 'Unsupported language' });
			}

			executionTime = Date.now() - startTime;

			console.log('Code Runner Success:', { executionTime, hasOutput: !!output, hasError: !!error });

			return res.status(200).json({
				success: true,
				output: output || 'No output',
				error: error || null,
				executionTime,
			});
		} catch (err) {
			console.error('Code Runner Execution Error:', err);
			return res.status(500).json({
				success: false,
				msg: 'Execution error',
				error: err.message,
			});
		}
	} catch (error) {
		console.error('Code runner error:', error);
		return res.status(500).json({ 
			success: false,
			msg: 'Failed to run code',
			error: error.message 
		});
	}
};

function executeCommand(command, input, timeout) {
	return new Promise((resolve, reject) => {
		const child = exec(command, { timeout, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
			if (error) {
				if (error.killed) {
					reject(new Error('Time limit exceeded'));
				} else if (error.code === 'ENOENT') {
					reject(new Error('Compiler not found. Please install GCC/G++ or Python.'));
				} else {
					// Return stdout and stderr even if there's an error
					// This allows us to see compilation errors
					resolve({ stdout, stderr: stderr || error.message });
				}
			} else {
				resolve({ stdout, stderr });
			}
		});

		if (input) {
			try {
				child.stdin.write(input);
				child.stdin.end();
			} catch (err) {
				reject(new Error('Failed to write input'));
			}
		}
	});
}

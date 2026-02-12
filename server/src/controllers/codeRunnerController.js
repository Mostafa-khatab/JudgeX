
import { exec, spawn } from 'child_process';
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
            await fs.chmod(tempDir, 0o777);
		} catch (err) {
			// Directory already exists, ensure permissions
            await fs.chmod(tempDir, 0o777);
		}

		const timestamp = Date.now();
		const randomId = Math.random().toString(36).substring(7);
		const fileId = `${timestamp}_${randomId}`;
		
        // Write code and input files
		const inputFileName = `${fileId}.in`;
		const inputFilePath = path.join(tempDir, inputFileName);
		await fs.writeFile(inputFilePath, input || '');
        await fs.chmod(inputFilePath, 0o777);

		let output = '';
		let error = '';
		let executionTime = 0;
        let dockerImage = '';
        let cmd = '';
        let fileName = '';

		try {
			switch (language) {
				case 'python3':
				case 'python2': {
                     // Ensure temp dir exists and has loose permissions for sharing
	if (!fs.existsSync(tempDir)) { // fs.existsSync is sync, but user requested it. fs.mkdir above is async.
		await fs.mkdir(tempDir, { recursive: true });
	}
    // Always chmod to ensure volume mount is writable by sandbox user
    await fs.chmod(tempDir, 0o777);

					dockerImage = 'judgex-sandbox:python';
					fileName = `${fileId}.py`;
					const filePath = path.join(tempDir, fileName);
                    const inputPath = path.join(tempDir, inputFileName);

					try {
						await fs.writeFile(filePath, code);
                        await fs.chmod(filePath, 0o777); // Allow sandbox to read
                        
                        if (input) { // Use 'input' directly as it's already defined
                            await fs.writeFile(inputPath, input);
                            await fs.chmod(inputPath, 0o777);
                        } else {
                             // Create empty input file to avoid errors
                             await fs.writeFile(inputPath, '');
                             await fs.chmod(inputPath, 0o777);
                        }
					} catch (writeErr) {
                        console.error(`Error writing file for ${language}:`, writeErr);
                        throw new Error(`Failed to write code/input file: ${writeErr.message}`);
                    }

					const pythonCmd = language === 'python3' ? 'python3' : 'python2';
                    // Measure time using date +%s%N (nanoseconds) inside container
                    cmd = `${pythonCmd} /sandbox/${fileName} < /sandbox/${inputFileName}`;
					
                    break;
				}

				case 'c':
				case 'c11': {
                    dockerImage = 'judgex-sandbox:cpp'; // Contains gcc
					fileName = `${fileId}.c`;
                    const exeName = `${fileId}`;
					const filePath = path.join(tempDir, fileName);
					await fs.writeFile(filePath, code);
                    await fs.chmod(filePath, 0o777);

                    // Compile then run
                    cmd = `gcc /sandbox/${fileName} -o /sandbox/${exeName} && /sandbox/${exeName} < /sandbox/${inputFileName}`;
					break;
				}

				case 'c++11':
				case 'c++14':
				case 'c++17':
				case 'c++20': {
                    dockerImage = 'judgex-sandbox:cpp';
					fileName = `${fileId}.cpp`;
                    const exeName = `${fileId}`;
					const filePath = path.join(tempDir, fileName);
					await fs.writeFile(filePath, code);

                    // Compile then run (using alpine g++)
                    cmd = `g++ /sandbox/${fileName} -o /sandbox/${exeName} && /sandbox/${exeName} < /sandbox/${inputFileName}`;
					break;
				}
                
                case 'java': {
                    dockerImage = 'judgex-sandbox:java';
                    fileName = `Main.java`; // Java public class assumption
                    const filePath = path.join(tempDir, fileName);
                    // Java requires class name to match file, but for snippets we might need wrapper. 
                    // For now assuming simple class. Or rename file to Main.java
                    await fs.writeFile(filePath, code);
                    
                    cmd = `javac /sandbox/${fileName} && java -cp /sandbox Main < /sandbox/${inputFileName}`;
                    break;
                }
                
                 case 'javascript':
                 case 'node': {
                    dockerImage = 'judgex-sandbox:node';
                    fileName = `${fileId}.js`;
                    const filePath = path.join(tempDir, fileName);
                    await fs.writeFile(filePath, code);
                    
                    cmd = `node /sandbox/${fileName} < /sandbox/${inputFileName}`;
                    break;
                }

				default:
                    // Cleanup input
                    await fs.unlink(inputFilePath).catch(() => {});
					return res.status(400).json({ msg: 'Unsupported language' });
			}

            // Construct Docker command
            // We mount tempDir to /sandbox
            // We wrap command to measure execution time
            // date +%s%N returns nanoseconds. Available in coreutils (installed in sandboxes)
            
            // NOTE: We only measure RUN time, not compile time for the 'executionTime' metric ideally,
            // but combining them in one command makes it tricky.
            // For interpreted (python/node), it's just run.
            // For compiled, we should probably separate compile and run if we want pure execution time.
            // But for a simple runner, measuring total is often acceptable, OR we use a trick.
            
            // Trick: `compile && echo "START_TIME: $(date +%s%N)" && ./prog && echo "END_TIME: $(date +%s%N)"`
            
            // Wait shortly to ensure file system sync (Windows Docker issue)
            await new Promise(r => setTimeout(r, 200));

            let fullCmd = '';
            // Use cd /sandbox to avoid absolute path issues and ensure we are in the right dir
            const debugList = 'ls -la && '; 
            
            if (language.startsWith('c') || language === 'java') {
                 // Compiled
                 const runPrefix = `cd /sandbox && ${debugList}`;
                 
                 if (language === 'java') {
                     fullCmd = `${runPrefix}javac ${fileName} && echo "___START___" && date +%s%N && java Main < ${inputFileName} && echo "___END___" && date +%s%N`;
                 } else if (language.startsWith('c')) {
                     const compiler = language.includes('++') ? 'g++' : 'gcc';
                     const exe = fileName.split('.')[0];
                     // Use ./exe to run
                     fullCmd = `${runPrefix}${compiler} ${fileName} -o ${exe} && echo "___START___" && date +%s%N && ./${exe} < ${inputFileName} && echo "___END___" && date +%s%N`;
                 }
            } else {
                 // Interpreted
                 const runPrefix = `cd /sandbox && ${debugList}`;
                 const runCmd = cmd.split('<')[0].trim(); // Get command part, simplified
                 
                 // Reconstruct command with relative paths
                 let relativeCmd = '';
                 if (language.includes('python')) {
                     const py = language === 'python3' ? 'python3' : 'python2';
                     relativeCmd = `${py} ${fileName}`;
                 } else if (language.includes('node') || language.includes('javascript')) {
                     relativeCmd = `node ${fileName}`;
                 }
                 
                 fullCmd = `${runPrefix}echo "___START___" && date +%s%N && ${relativeCmd} < ${inputFileName} && echo "___END___" && date +%s%N`;
            }

            // Ensure tempDir is absolute and normalized
            const absoluteTempDir = path.resolve(tempDir);
            
            // Determine host path for volume mount (required for sibling containers)
            let hostMountPath = absoluteTempDir;
            if (process.env.TEMP_VOLUME_NAME) {
                // Use named volume for reliable sharing, trim to remove potential \r from Windows .env
                hostMountPath = process.env.TEMP_VOLUME_NAME.trim();
            } else if (process.env.HOST_PROJECT_ROOT) {
                // Map container path /app/server/temp -> HOST_PROJECT_ROOT/server/temp
                // We typically use forward slashes for Docker paths
                hostMountPath = `${process.env.HOST_PROJECT_ROOT}/server/temp`;
            }

            // Docker options:
            const dockerArgs = [
                'run', '--rm',
                '--network', 'none',
                '--memory', '256m',
                '--cpus', '0.5',
                '--cpus', '0.5',
                '-v', `${hostMountPath}:/sandbox`,
                dockerImage,
                'sh', '-c', fullCmd
            ];
            
            console.log('🐳 Docker Args:', dockerArgs);
            console.log('🐳 Host Mount Path:', hostMountPath);
            
            console.log('🐳 Docker Cmd:', fullCmd);

            const { stdout, stderr } = await executeDockerCommand('docker', dockerArgs, 30000); // 30s timeout

            // Parse Output and Time
            // Stdout will contain ___START___ \n timestamp \n actual_output \n ___END___ \n timestamp
            
            const startMarker = '___START___';
            const endMarker = '___END___';
            
            if (stdout.includes(startMarker) && stdout.includes(endMarker)) {
                const parts = stdout.split(startMarker);
                // parts[0] is compile output (if any, usually empty for successful compile to stdout)
                // parts[1] contains: \n <startTime> \n <output> \n ___END___ \n <endTime>
                
                const executionPart = parts[1];
                const endParts = executionPart.split(endMarker);
                
                const timeAndOutput = endParts[0].trim().split('\n');
                const startTimeNs = BigInt(timeAndOutput[0]);
                // Join the rest as output
                output = timeAndOutput.slice(1).join('\n');
                
                const endTimeNs = BigInt(endParts[1].trim());
                
                const durationNs = endTimeNs - startTimeNs;
                executionTime = Number(durationNs) / 1e6; // Convert ns to ms
                
                // If there was compile output (warnings?), append to log? usually stderr captures errors.
            } else {
                // If markers missing, likely compile error or crash before start
                output = stdout; // Fallback
            }
            
            if (stderr) {
                // Check if it's a compile error or run error
                error = stderr;
            }

            // Cleanup files
            const filesToDelete = [inputFileName, fileName];
            if (language.startsWith('c')) filesToDelete.push(fileName.split('.')[0]); // exe
            if (language === 'java') filesToDelete.push('Main.class');
            
            for (const f of filesToDelete) {
               await fs.unlink(path.join(tempDir, f)).catch(() => {}); 
            }

			console.log('Code Runner Success:', { executionTime: executionTime.toFixed(3), hasOutput: !!output, hasError: !!error });

			return res.status(200).json({
				success: true,
				output: output || '',
				error: error || null,
				executionTime: parseFloat(executionTime.toFixed(3)),
			});
		} catch (err) {
			console.error('Code Runner Exec Error:', err);
             // Cleanup inputs
            await fs.unlink(path.join(tempDir, inputFileName)).catch(() => {});
            
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

function executeDockerCommand(command, args, timeout) {
	return new Promise((resolve, reject) => {
        // console.log('Running Docker:', command, args);
		const child = spawn(command, args, { timeout });
        
        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        child.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        child.on('error', (err) => {
             resolve({ stdout, stderr: err.message });
        });

        child.on('close', (code, signal) => {
             if (signal === 'SIGTERM' || signal === 'SIGKILL') {
                 resolve({ stdout, stderr: `Time limit exceeded (${timeout}ms)` });
             } else {
                 // Even if code != 0, we return stdout/stderr for compilation errors
                 resolve({ stdout, stderr });
             }
        });
	});
}

function executeCommand(command, input, timeout) {
	return new Promise((resolve, reject) => {
		const child = exec(command, { timeout, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
			if (error) {
				if (error.killed) {
					reject(new Error(`Time limit exceeded (${timeout}ms)`));
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

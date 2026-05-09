import { exec, spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import os from 'os';

const execPromise = (cmd, options = {}) => {
  return new Promise((resolve, reject) => {
    exec(cmd, options, (error, stdout, stderr) => {
      if (error) {
        // Truncate output to prevent overwhelming the error handler or logs
        const truncatedStdout = stdout ? (stdout.length > 5000 ? stdout.substring(0, 5000) + "... [Truncated]" : stdout) : '';
        const truncatedStderr = stderr ? (stderr.length > 5000 ? stderr.substring(0, 5000) + "... [Truncated]" : stderr) : '';
        
        if (error.killed) {
          reject(new Error('Time Limit Exceeded'));
        } else {
          reject(new Error(truncatedStderr || truncatedStdout || error.message));
        }
      } else {
        const truncatedStdout = stdout ? (stdout.length > 5000 ? stdout.substring(0, 5000) + "... [Truncated]" : stdout) : '';
        const truncatedStderr = stderr ? (stderr.length > 5000 ? stderr.substring(0, 5000) + "... [Truncated]" : stderr) : '';
        resolve(truncatedStdout || truncatedStderr);
      }
    });
  });
};

const spawnPromise = (cmd, args, input, options = {}) => {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { ...options, shell: false });
    let stdout = '';
    let stderr = '';
    let killedByTimeout = false;

    const timeout = setTimeout(() => {
      killedByTimeout = true;
      child.kill('SIGKILL');
    }, options.timeout || 5000);

    if (input) {
      const canWrite = child.stdin.write(input);
      if (!canWrite) {
        child.stdin.once('drain', () => child.stdin.end());
      } else {
        child.stdin.end();
      }
    } else {
      child.stdin.end();
    }

    child.stdout.on('data', (data) => {
      stdout += data.toString();
      if (stdout.length > (options.maxBuffer || 1024 * 500)) {
        child.kill();
      }
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    child.on('close', (code) => {
      clearTimeout(timeout);
      if (killedByTimeout) {
        reject(new Error('Time Limit Exceeded'));
      } else if (code !== 0) {
        const errorMsg = stderr || stdout || `Process exited with code ${code}`;
        reject(new Error(errorMsg));
      } else {
        resolve(stdout);
      }
    });
  });
};

const getExtension = (language) => {
  const langMap = {
    'python3': 'py', 'python2': 'py', 'python': 'py',
    'c': 'c', 'c11': 'c',
    'cpp': 'cpp', 'c++': 'cpp', 'c++11': 'cpp', 'c++14': 'cpp', 'c++17': 'cpp', 'c++20': 'cpp',
    'java': 'java',
    'javascript': 'js', 'node': 'js'
  };
  return langMap[language?.toLowerCase()] || 'txt';
};

export const runCodeLocally = async (code, language, input) => {
  const ext = getExtension(language);
  const id = crypto.randomBytes(8).toString('hex');
  const tempDir = path.join(os.tmpdir(), 'judgex_runs');
  
  await fs.mkdir(tempDir, { recursive: true });

  const codePath = path.join(tempDir, `${id}.${ext}`);
  const inputPath = path.join(tempDir, `${id}.in`);
  const exePath = path.join(tempDir, `${id}.exe`);

  try {
    await fs.writeFile(codePath, code);
    if (input) {
      await fs.writeFile(inputPath, input);
    } else {
      await fs.writeFile(inputPath, '');
    }

    const startTime = Date.now();
    const runOptions = { timeout: 10000, maxBuffer: 1024 * 1024 }; // 1MB output limit, 10s timeout
    const inputRedirect = `< "${inputPath}"`;
    let output = '';

    if (ext === 'cpp' || ext === 'c') {
      const compiler = ext === 'cpp' ? 'g++' : 'gcc';
      const flags = ext === 'cpp' ? ['-O3', '-std=c++17'] : ['-O3'];
      try {
        console.log(`[LocalCodeRunner] Compiling ${language}...`);
        await execPromise(`${compiler} ${flags.join(' ')} "${codePath}" -o "${exePath}"`, { timeout: 30000 });
      } catch (err) {
        console.error(`[LocalCodeRunner] Compilation Error:`, err.message);
        throw new Error(`Compilation Error:\n${err.message}`);
      }
      console.log(`[LocalCodeRunner] Executing ${exePath}...`);
      output = await spawnPromise(exePath, [], input, runOptions);
    } else if (ext === 'py') {
      console.log(`[LocalCodeRunner] Executing Python...`);
      output = await spawnPromise('python', [codePath], input, runOptions);
    } else if (ext === 'js') {
      console.log(`[LocalCodeRunner] Executing Node.js...`);
      output = await spawnPromise('node', [codePath], input, runOptions);
    } else {
      throw new Error(`Unsupported language for local execution: ${language}`);
    }

    const elapsed = Date.now() - startTime;
    return { output, executionTime: elapsed };

  } catch (err) {
    return { 
      error: err.message, 
      executionTime: typeof startTime !== 'undefined' ? (Date.now() - startTime) : 0 
    };
  } finally {
    // Cleanup
    try {
      await fs.unlink(codePath).catch(() => {});
      await fs.unlink(inputPath).catch(() => {});
      if (ext === 'cpp' || ext === 'c') {
        await fs.unlink(exePath).catch(() => {});
      }
    } catch (e) {
      // Ignore cleanup errors
    }
  }
};

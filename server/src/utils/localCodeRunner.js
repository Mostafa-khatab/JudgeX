import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import os from 'os';

const execPromise = (cmd, options = {}) => {
  return new Promise((resolve, reject) => {
    exec(cmd, options, (error, stdout, stderr) => {
      if (error) {
        // Truncate output to prevent overwhelming the error handler or logs
        const truncatedStdout = stdout ? (stdout.length > 100000 ? stdout.substring(0, 100000) + "... [Truncated]" : stdout) : '';
        const truncatedStderr = stderr ? (stderr.length > 100000 ? stderr.substring(0, 100000) + "... [Truncated]" : stderr) : '';
        
        if (error.killed) {
          reject(new Error('Time Limit Exceeded'));
        } else {
          reject(new Error(truncatedStderr || truncatedStdout || error.message));
        }
      } else {
        resolve(stdout || stderr);
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

    const runOptions = { timeout: 10000, maxBuffer: 1024 * 1024 * 5 }; // 5MB output limit, 10s timeout
    const inputRedirect = `< "${inputPath}"`;
    let output = '';
    const startTime = Date.now();

    if (ext === 'cpp' || ext === 'c') {
      const compiler = ext === 'cpp' ? 'g++' : 'gcc';
      try {
        await execPromise(`${compiler} "${codePath}" -o "${exePath}"`, { timeout: 30000 });
      } catch (err) {
        throw new Error(`Compilation Error:\n${err.message}`);
      }
      output = await execPromise(`"${exePath}" ${inputRedirect}`, runOptions);
    } else if (ext === 'py') {
      output = await execPromise(`python "${codePath}" ${inputRedirect}`, runOptions);
    } else if (ext === 'js') {
      output = await execPromise(`node "${codePath}" ${inputRedirect}`, runOptions);
    } else {
      throw new Error(`Unsupported language for local execution: ${language}`);
    }

    const elapsed = Date.now() - startTime;
    return { output, executionTime: elapsed };

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

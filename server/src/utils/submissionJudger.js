import Submission from '../models/submission.js';
import Problem from '../models/problem.js';
import User from '../models/user.js';
import { runCodeLocally } from './localCodeRunner.js';

/**
 * Judges a submission locally.
 * Iterates through all test cases, runs the code, and updates the submission status.
 */
export const judgeSubmission = async (submissionId) => {
	console.log(`[JUDGER] Starting judging for submission: ${submissionId}`);
	
	try {
		const submission = await Submission.findById(submissionId);
		if (!submission) {
			console.error(`[JUDGER] Submission not found: ${submissionId}`);
			return;
		}

		const problem = await Problem.findOne({ id: submission.forProblem });
		if (!problem) {
			console.error(`[JUDGER] Problem not found: ${submission.forProblem}`);
			await Submission.findByIdAndUpdate(submissionId, { status: 'IE', msg: { server: 'Problem not found' } });
			return;
		}

		const testcases = problem.testcase;
		if (!testcases || testcases.length === 0) {
			console.warn(`[JUDGER] No test cases for problem: ${problem.id}`);
			await Submission.findByIdAndUpdate(submissionId, { status: 'AC', point: problem.point, msg: { server: 'No test cases' } });
			return;
		}

		let totalPassed = 0;
		const results = [];
		let finalStatus = 'AC';
		let maxTime = 0;
		let maxMemory = 0;

		for (let i = 0; i < testcases.length; i++) {
			const tc = testcases[i];
			const runResult = await runCodeLocally(submission.src, submission.language, tc.stdin);

			const tcResult = {
				status: 'AC',
				time: runResult.executionTime / 1000, // seconds
				memory: 0, // Memory usage not tracked by current local runner
				msg: '',
			};

			if (runResult.error) {
				if (runResult.error.includes('Compilation Error')) {
					tcResult.status = 'CE';
					finalStatus = 'CE';
				} else if (runResult.error.includes('Time Limit Exceeded')) {
					tcResult.status = 'TLE';
					if (finalStatus === 'AC') finalStatus = 'TLE';
				} else {
					tcResult.status = 'RTE';
					if (finalStatus === 'AC') finalStatus = 'RTE';
				}
				tcResult.msg = runResult.error;
			} else {
				// Normalize and compare output
				const normalize = (str) => 
					str.replace(/\r/g, '') // Remove carriage returns
					   .split('\n')
					   .map(line => line.trimEnd()) // Trim trailing spaces on each line
					   .filter((line, i, arr) => line !== '' || i < arr.findLastIndex(l => l !== '')) // Remove trailing empty lines
					   .join('\n')
					   .trim();

				const expected = normalize(tc.stdout);
				const actual = normalize(runResult.output);

				if (expected !== actual) {
					tcResult.status = 'WA';
					if (finalStatus === 'AC') finalStatus = 'WA';
					// Optional: provide diff in msg
				} else {
					totalPassed++;
				}
			}

			results.push(tcResult);
			maxTime = Math.max(maxTime, tcResult.time);
			
			// If we found a fatal error (like CE), we can stop judging
			if (finalStatus === 'CE') break;
		}

		// Calculate point
		const score = Math.floor((totalPassed / testcases.length) * problem.point);

		// Update submission
		await Submission.findByIdAndUpdate(submissionId, {
			status: finalStatus,
			point: score,
			time: maxTime,
			memory: maxMemory,
			testcase: results,
			completedAt: new Date(),
		});

		// Update problem stats if not CE/IE
		if (finalStatus !== 'CE' && finalStatus !== 'IE') {
			await Problem.findOneAndUpdate(
				{ id: problem.id },
				{ 
					$inc: { 
						noOfSubm: 1, 
						noOfSuccess: finalStatus === 'AC' ? 1 : 0 
					} 
				}
			);
		}

		console.log(`[JUDGER] Finished judging ${submissionId}. Result: ${finalStatus}, Score: ${score}`);

	} catch (err) {
		console.error(`[JUDGER] Error judging submission ${submissionId}:`, err);
		await Submission.findByIdAndUpdate(submissionId, { status: 'IE', msg: { server: err.message } });
	}
};

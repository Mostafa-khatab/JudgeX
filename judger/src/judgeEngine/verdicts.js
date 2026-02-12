/**
 * Verdict definitions and priorities for the Online Judge system
 * Lower priority number = higher precedence when multiple verdicts occur
 */

export const VERDICTS = {
	// Accepted - Solution is correct
	AC: {
		code: 'AC',
		name: 'Accepted',
		priority: 0,
		color: '#22c55e', // green-500
		description: 'Your solution produced the correct output for all test cases.',
	},

	// Wrong Answer - Output doesn't match expected
	WA: {
		code: 'WA',
		name: 'Wrong Answer',
		priority: 1,
		color: '#ef4444', // red-500
		description: 'Your solution produced incorrect output.',
	},

	// Time Limit Exceeded - Took too long
	TLE: {
		code: 'TLE',
		name: 'Time Limit Exceeded',
		priority: 2,
		color: '#f97316', // orange-500
		description: 'Your solution exceeded the time limit.',
	},

	// Memory Limit Exceeded - Used too much memory
	MLE: {
		code: 'MLE',
		name: 'Memory Limit Exceeded',
		priority: 3,
		color: '#a855f7', // purple-500
		description: 'Your solution exceeded the memory limit.',
	},

	// Runtime Error - Crashed during execution
	RE: {
		code: 'RE',
		name: 'Runtime Error',
		priority: 4,
		color: '#ec4899', // pink-500
		description: 'Your solution crashed during execution.',
	},

	// Compilation Error - Failed to compile
	CE: {
		code: 'CE',
		name: 'Compilation Error',
		priority: 5,
		color: '#eab308', // yellow-500
		description: 'Your solution failed to compile.',
	},

	// Internal Error - System error
	IE: {
		code: 'IE',
		name: 'Internal Error',
		priority: 6,
		color: '#6b7280', // gray-500
		description: 'An internal system error occurred. Please try again.',
	},
};

/**
 * Get the final verdict from multiple test case results
 * Returns the verdict with highest priority (lowest number)
 * @param {Array} testResults - Array of test case results with status
 * @returns {string} Final verdict code
 */
export const getFinalVerdict = (testResults) => {
	if (!testResults || testResults.length === 0) {
		return 'IE';
	}

	// Find the verdict with highest priority (lowest number)
	let finalVerdict = 'AC';
	let highestPriority = VERDICTS.AC.priority;

	for (const result of testResults) {
		const verdict = VERDICTS[result.status];
		if (verdict && verdict.priority > highestPriority) {
			highestPriority = verdict.priority;
			finalVerdict = result.status;
		}
	}

	return finalVerdict;
};

/**
 * Calculate points based on test results
 * @param {Array} testResults - Array of test case results
 * @param {number} maxPoints - Maximum points for the problem
 * @returns {number} Points earned
 */
export const calculatePoints = (testResults, maxPoints = 100) => {
	if (!testResults || testResults.length === 0) return 0;

	const passedTests = testResults.filter((r) => r.status === 'AC').length;
	const totalTests = testResults.length;

	// Only award points if ALL tests pass (ICPC style)
	// For partial scoring, use: return Math.round((passedTests / totalTests) * maxPoints);
	return passedTests === totalTests ? maxPoints : 0;
};

export default VERDICTS;

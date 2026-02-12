const getFinalResult = (testResult = [], { maxPoint }) => {
	// Priority order: TLE > MLE > RTE > WA > AC
	let status = 'AC';
	let time = 0;
	let memory = 0;
	
	// Check for TLE (highest priority)
	if (testResult.some((test) => test.status === 'TLE')) {
		status = 'TLE';
		time = Math.max(...testResult.map((t) => t.time));
		memory = Math.max(...testResult.map((t) => t.memory));
	}
	// Check for MLE (second priority)
	else if (testResult.some((test) => test.status === 'MLE')) {
		status = 'MLE';
		time = Math.max(...testResult.map((t) => t.time));
		memory = Math.max(...testResult.map((t) => t.memory));
	}
	// Check for RTE (third priority)
	else if (testResult.some((test) => test.status === 'RTE')) {
		status = 'RTE';
		time = Math.max(...testResult.map((t) => t.time));
		memory = Math.max(...testResult.map((t) => t.memory));
	}
	// Check for WA (fourth priority)
	else if (testResult.some((test) => test.status === 'WA')) {
		status = 'WA';
		time = Math.max(...testResult.map((t) => t.time));
		memory = Math.max(...testResult.map((t) => t.memory));
	}
	// All tests passed (AC)
	else {
		status = 'AC';
		time = Math.max(...testResult.map((t) => t.time));
		memory = Math.max(...testResult.map((t) => t.memory));
	}
	
	const noOfAC = testResult.reduce((acc, test) => acc + (test.status === 'AC'), 0);
	const point = (maxPoint / testResult.length) * noOfAC || 0;

	return { 
		status, 
		time: Number(time.toFixed(3)), 
		memory: Number(memory.toFixed(2)), 
		point: Number(point.toFixed(2)) 
	};
};

export default getFinalResult;

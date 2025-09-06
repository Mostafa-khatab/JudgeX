const getFinalResult = (testResult = [], { maxPoint }) => {
	// Priority order: TLE > MLE > RTE > WA > AC
	let status = 'AC';
	let time = 0;
	let memory = 0;
	
	// Check for TLE (highest priority)
	if (testResult.some((test) => test.status === 'TLE')) {
		status = 'TLE';
		time = -1;
		memory = 0;
	}
	// Check for MLE (second priority)
	else if (testResult.some((test) => test.status === 'MLE')) {
		status = 'MLE';
		time = testResult.reduce((acc, test) => acc + test.time, 0);
		memory = -1;
	}
	// Check for RTE (third priority)
	else if (testResult.some((test) => test.status === 'RTE')) {
		status = 'RTE';
		time = testResult.reduce((acc, test) => acc + test.time, 0);
		memory = testResult.reduce((acc, test) => Math.max(acc, test.memory), 0);
	}
	// Check for WA (fourth priority)
	else if (testResult.some((test) => test.status === 'WA')) {
		status = 'WA';
		time = testResult.reduce((acc, test) => acc + test.time, 0);
		memory = testResult.reduce((acc, test) => Math.max(acc, test.memory), 0);
	}
	// All tests passed (AC)
	else {
		status = 'AC';
		time = testResult.reduce((acc, test) => acc + test.time, 0);
		memory = testResult.reduce((acc, test) => Math.max(acc, test.memory), 0);
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

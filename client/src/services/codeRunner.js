import httpRequest from '~/utils/httpRequest';

export const runCode = async (data) => {
	try {
		const res = await httpRequest.post('/code/run', data);
		return res.data;
	} catch (err) {
		console.error(err);
		throw err;
	}
};

/**
 * Run code for interview candidates (doesn't require full auth)
 */
export const runCodeInterview = async (data) => {
	try {
		const res = await httpRequest.post('/code/interview-run', data, {
			headers: {
				'x-candidate-token': localStorage.getItem('candidateToken') || '',
			},
		});
		return res.data;
	} catch (err) {
		console.error(err);
		throw err;
	}
};


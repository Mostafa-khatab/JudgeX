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

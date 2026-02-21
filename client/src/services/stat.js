import httpRequest from '~/utils/httpRequest';

export const getStat = async (day) => {
	try {
		const res = await httpRequest.get('/stat', { params: { day } });
		return res.data;
	} catch (err) {
		console.error(err);
		throw err;
	}
};

export const getNewestActivity = async () => {
	try {
		const res = await httpRequest.get('/stat/newest-activity');
		return res.data;
	} catch (err) {
		console.error(err);
		throw err;
	}
};

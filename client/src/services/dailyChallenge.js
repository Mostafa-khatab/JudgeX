import httpRequest from '~/utils/httpRequest';

export const getDailyChallenge = async () => {
	try {
		const res = await httpRequest.get('/daily-challenge');
		return res.data;
	} catch (err) {
		console.error(err);
		throw err;
	}
};

export const completeChallenge = async () => {
	try {
		const res = await httpRequest.post('/daily-challenge/complete');
		return res.data;
	} catch (err) {
		console.error(err);
		throw err;
	}
};

export const getStreak = async () => {
	try {
		const res = await httpRequest.get('/daily-challenge/streak');
		return res.data;
	} catch (err) {
		console.error(err);
		throw err;
	}
};

export const getChallengeHistory = async (page = 1, limit = 10) => {
	try {
		const res = await httpRequest.get('/daily-challenge/history', {
			params: { page, limit },
		});
		return res.data;
	} catch (err) {
		console.error(err);
		throw err;
	}
};

export const trainModel = async () => {
	try {
		const res = await httpRequest.post('/daily-challenge/train');
		return res.data;
	} catch (err) {
		console.error(err);
		throw err;
	}
};

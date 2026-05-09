import httpRequest from '~/utils/httpRequest';

export const getTopics = async () => {
	try {
		const res = await httpRequest.get('/topic');
		return res.data;
	} catch (err) {
		console.error(err);
		throw err;
	}
};

export const getTopicById = async (topicId) => {
	try {
		const res = await httpRequest.get(`/topic/${topicId}`);
		return res.data;
	} catch (err) {
		console.error(err);
		throw err;
	}
};

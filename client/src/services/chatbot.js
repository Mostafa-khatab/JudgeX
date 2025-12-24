import httpRequest from '~/utils/httpRequest';

export const sendChatMessage = async (data) => {
	try {
		const res = await httpRequest.post('/chatbot/message', data);
		return res.data;
	} catch (err) {
		console.error(err);
		throw err;
	}
};

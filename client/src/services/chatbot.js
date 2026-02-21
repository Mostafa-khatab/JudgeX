import httpRequest from '~/utils/httpRequest';

export const sendChatMessage = async ({ message, problemId, courseId, code, language, history, allowFullSolution }) => {
	const response = await httpRequest.post('/chatbot/message', {
		message,
		problemId,
		courseId,
		code,
		language,
		history,
		allowFullSolution
	});
	return response.data;
};

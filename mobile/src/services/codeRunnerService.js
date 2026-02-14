import api from './api';

const codeRunnerService = {
  // Run code with optional input
  runCode: async ({ code, language, input = '' }) => {
    try {
      const response = await api.post('/code/run', {
        code,
        language,
        input,
      });
      return response;
    } catch (error) {
      throw error.message ? error : { message: 'Failed to run code' };
    }
  },
};

export default codeRunnerService;

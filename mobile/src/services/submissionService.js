import api from './api';

const submissionService = {
  // Get all submissions
  getSubmissions: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.status) queryParams.append('status', params.status);
      if (params.author) queryParams.append('author', params.author);
      if (params.language) queryParams.append('language', params.language);
      if (params.problem) queryParams.append('problem', params.problem);
      if (params.page) queryParams.append('page', params.page);
      if (params.size) queryParams.append('size', params.size);
      
      const queryString = queryParams.toString();
      const endpoint = queryString ? `/submission?${queryString}` : '/submission';
      
      const response = await api.get(endpoint);
      return response;
    } catch (error) {
      throw error.message ? error : { message: 'Failed to fetch submissions' };
    }
  },

  // Get submission by ID
  getSubmission: async (id) => {
    try {
      const response = await api.get(`/submission/info/${id}`);
      return response;
    } catch (error) {
      throw error.message ? error : { message: 'Failed to fetch submission' };
    }
  },

  // Submit code
  submit: async (problemId, code, language, contestId = null) => {
    try {
      const body = {
        src: code,
        problem: problemId,
        language: language,
      };
      
      if (contestId) {
        body.contest = contestId;
      }
      
      const response = await api.post('/submission/submit', body);
      return response;
    } catch (error) {
      throw error.message ? error : { message: 'Failed to submit code' };
    }
  },
};

export default submissionService;

import api from './api';

const problemService = {
  // Get all problems
  getProblems: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.q) queryParams.append('q', params.q);
      if (params.difficulty) queryParams.append('difficulty', params.difficulty);
      if (params.tags) queryParams.append('tags', params.tags);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.order) queryParams.append('order', params.order);
      if (params.page) queryParams.append('page', params.page);
      if (params.size) queryParams.append('size', params.size);
      
      const queryString = queryParams.toString();
      const endpoint = queryString ? `/problem?${queryString}` : '/problem';
      
      const response = await api.get(endpoint);
      return response;
    } catch (error) {
      throw error.message ? error : { message: 'Failed to fetch problems' };
    }
  },

  // Get problem by ID
  getProblem: async (id) => {
    try {
      const response = await api.get(`/problem/info/${id}`);
      return response;
    } catch (error) {
      throw error.message ? error : { message: 'Failed to fetch problem' };
    }
  },

  // Get all tags
  getTags: async () => {
    try {
      const response = await api.get('/problem/tags');
      return response;
    } catch (error) {
      throw error.message ? error : { message: 'Failed to fetch tags' };
    }
  },

  // Get available languages
  getLanguages: async () => {
    try {
      const response = await api.get('/problem/languages');
      return response;
    } catch (error) {
      throw error.message ? error : { message: 'Failed to fetch languages' };
    }
  },
};

export default problemService;

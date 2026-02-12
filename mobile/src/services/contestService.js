import api from './api';

const contestService = {
  // Get all contests
  getContests: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.q) queryParams.append('q', params.q);
      if (params.status) queryParams.append('status', params.status);
      
      const queryString = queryParams.toString();
      const endpoint = queryString ? `/contest?${queryString}` : '/contest';
      
      const response = await api.get(endpoint);
      return response;
    } catch (error) {
      throw error.message ? error : { message: 'Failed to fetch contests' };
    }
  },

  // Get contest by ID
  getContest: async (id) => {
    try {
      const response = await api.get(`/contest/info/${id}`);
      return response;
    } catch (error) {
      throw error.message ? error : { message: 'Failed to fetch contest' };
    }
  },

  // Get contest problems
  getContestProblems: async (id) => {
    try {
      const response = await api.get(`/contest/problems/${id}`);
      return response;
    } catch (error) {
      throw error.message ? error : { message: 'Failed to fetch contest problems' };
    }
  },

  // Join contest
  joinContest: async (id) => {
    try {
      const response = await api.post(`/contest/join/${id}`, {});
      return response;
    } catch (error) {
      throw error.message ? error : { message: 'Failed to join contest' };
    }
  },

  // Leave contest
  leaveContest: async () => {
    try {
      const response = await api.post('/contest/leave', {});
      return response;
    } catch (error) {
      throw error.message ? error : { message: 'Failed to leave contest' };
    }
  },
};

export default contestService;

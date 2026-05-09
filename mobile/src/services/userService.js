import api from './api';

const userService = {
  // Get user profile by name
  getProfile: async (name) => {
    try {
      const response = await api.get(`/user/info/${name}`);
      return response;
    } catch (error) {
      throw error.message ? error : { message: 'Failed to fetch profile' };
    }
  },

  // Update user profile
  updateProfile: async (data) => {
    try {
      const response = await api.post('/user/edit', data);
      return response;
    } catch (error) {
      throw error.message ? error : { message: 'Failed to update profile' };
    }
  },

  // Get leaderboard
  getLeaderboard: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.order) queryParams.append('order', params.order);
      if (params.limit) queryParams.append('limit', params.limit);
      
      const queryString = queryParams.toString();
      const endpoint = queryString ? `/user?${queryString}` : '/user';
      
      const response = await api.get(endpoint);
      return response;
    } catch (error) {
      throw error.message ? error : { message: 'Failed to fetch leaderboard' };
    }
  },
  
  // Get global statistics
  getGlobalStats: async () => {
    try {
      const response = await api.get('/stat/global-stats');
      return response;
    } catch (error) {
      throw error.message ? error : { message: 'Failed to fetch global stats' };
    }
  },
};

export default userService;

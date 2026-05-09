import api from './api';

const roadmapService = {
  getRoadmaps: () => {
    return api.get('/roadmaps/me');
  },
  getRoadmapById: (id) => {
    return api.get(`/roadmaps/${id}`);
  },
  deleteRoadmap: (id) => {
    return api.delete(`/roadmaps/${id}`);
  },
  generateRoadmap: (goal) => {
    return api.post('/roadmaps/generate', { goal });
  },
  completeNode: (roadmapId, nodeId, data) => {
    return api.post(`/roadmaps/${roadmapId}/node/${nodeId}/complete`, data);
  }
};

export default roadmapService;

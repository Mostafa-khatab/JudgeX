import httpRequest from '~/utils/httpRequest';

export const generateRoadmap = async (goal) => {
    const response = await httpRequest.post('/roadmaps/generate', { goal });
    return response.data;
};

export const getMyRoadmaps = async () => {
    const response = await httpRequest.get('/roadmaps/me');
    return response.data;
};

export const getRoadmapById = async (id) => {
    const response = await httpRequest.get(`/roadmaps/${id}`);
    return response.data;
};

export const updateNodeProgress = async (roadmapId, nodeId, data) => {
    const response = await httpRequest.patch(`/roadmaps/${roadmapId}/node/${nodeId}`, data);
    return response.data;
};

export const deleteRoadmap = async (id) => {
    const response = await httpRequest.delete(`/roadmaps/${id}`);
    return response.data;
};
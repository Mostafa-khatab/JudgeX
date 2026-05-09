import api from './api';

const blogService = {
  getBlogs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/blogs${query ? `?${query}` : ''}`);
  },
  getBlogById: (id) => {
    return api.get(`/blogs/${id}`);
  },
  createBlog: (data) => {
    return api.post('/blogs', data);
  },
  likeBlog: (id) => {
    return api.post(`/blogs/${id}/like`);
  },
  getComments: (id) => {
    return api.get(`/blogs/${id}/comments`);
  },
  addComment: (id, text) => {
    return api.post(`/blogs/${id}/comment`, { text });
  },
};

export default blogService;

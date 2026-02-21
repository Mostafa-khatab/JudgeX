import httpRequest from '~/utils/httpRequest';

export const getBlogs = async (params) => {
    try {
        const res = await httpRequest.get('blogs', {
            params,
        });
        return res.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
};

export const getBlog = async (id) => {
    try {
        const res = await httpRequest.get(`blogs/${id}`);
        return res.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
};

export const syncBlogs = async () => {
    try {
        const res = await httpRequest.post('blogs/sync');
        return res.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
};

export const likeBlog = async (id) => {
    try {
        const res = await httpRequest.post(`blogs/${id}/like`);
        return res.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const addComment = async (id, data) => {
    try {
        const res = await httpRequest.post(`blogs/${id}/comment`, data);
        return res.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const getBlogComments = async (id) => {
    try {
        const res = await httpRequest.get(`blogs/${id}/comments`);
        return res.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const likeComment = async (id) => {
    try {
        const res = await httpRequest.post(`comments/${id}/like`);
        return res.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

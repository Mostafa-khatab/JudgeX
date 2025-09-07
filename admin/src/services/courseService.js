import httpRequest from '~/utils/httpRequest';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const courseService = {
	// Get all courses with filtering
	getCourses: async (params = {}) => {
		try {
			const response = await httpRequest.get(`/course`, { params });
			return response.data;
		} catch (error) {
			throw new Error(error.response?.data?.msg || 'Failed to fetch courses');
		}
	},

	// Get single course by ID
	getCourse: async (id) => {
		try {
			const response = await httpRequest.get(`/course/${id}`);
			return response.data;
		} catch (error) {
			throw new Error(error.response?.data?.msg || 'Failed to fetch course');
		}
	},

	// Create new course (Admin only)
	createCourse: async (courseData) => {
		try {
			const response = await httpRequest.post(`/course`, courseData);
			return response.data;
		} catch (error) {
			throw new Error(error.response?.data?.msg || 'Failed to create course');
		}
	},

	// Update course (Admin only)
	updateCourse: async (id, courseData) => {
		try {
			const response = await httpRequest.put(`/course/${id}`, courseData);
			return response.data;
		} catch (error) {
			throw new Error(error.response?.data?.msg || 'Failed to update course');
		}
	},

	// Delete course (Admin only)
	deleteCourse: async (id) => {
		try {
			const response = await httpRequest.delete(`/course/${id}`);
			return response.data;
		} catch (error) {
			throw new Error(error.response?.data?.msg || 'Failed to delete course');
		}
	},

	// Enroll in course
	enrollInCourse: async (id, userId) => {
		try {
			const response = await httpRequest.post(`/course/${id}/enroll`, { userId });
			return response.data;
		} catch (error) {
			throw new Error(error.response?.data?.msg || 'Failed to enroll in course');
		}
	},

	// Rate course
	rateCourse: async (id, rating) => {
		try {
			const response = await httpRequest.post(`/course/${id}/rate`, { rating });
			return response.data;
		} catch (error) {
			throw new Error(error.response?.data?.msg || 'Failed to rate course');
		}
	},

	// Upload video file
	uploadVideo: async (id, formData, token) => {
		try {
			const response = await axios.post(
				`${API_BASE_URL}/course/${id}/video`,
				formData,
				{
					headers: {
						Authorization: `Bearer ${token}`,
						'Content-Type': 'multipart/form-data',
					},
				}
			);
			return response.data;
		} catch (error) {
			throw new Error(error.response?.data?.msg || 'Failed to upload video');
		}
	},

	// Upload thumbnail
	uploadThumbnail: async (id, formData, token) => {
		try {
			const response = await axios.post(
				`${API_BASE_URL}/course/${id}/thumbnail`,
				formData,
				{
					headers: {
						Authorization: `Bearer ${token}`,
						'Content-Type': 'multipart/form-data',
					},
				}
			);
			return response.data;
		} catch (error) {
			throw new Error(error.response?.data?.msg || 'Failed to upload thumbnail');
		}
	},
};

export default courseService;

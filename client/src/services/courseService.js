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
	createCourse: async (courseData, token) => {
		try {
			const response = await httpRequest.post(`/course`, courseData, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
			return response.data;
		} catch (error) {
			throw new Error(error.response?.data?.msg || 'Failed to create course');
		}
	},

	// Update course (Admin only)
	updateCourse: async (id, courseData, token) => {
		try {
			const response = await httpRequest.put(`/course/${id}`, courseData, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
			return response.data;
		} catch (error) {
			throw new Error(error.response?.data?.msg || 'Failed to update course');
		}
	},

	// Delete course (Admin only)
	deleteCourse: async (id, token) => {
		try {
			const response = await httpRequest.delete(`/course/${id}`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
			return response.data;
		} catch (error) {
			throw new Error(error.response?.data?.msg || 'Failed to delete course');
		}
	},

	// Enroll in course
	enrollInCourse: async (id, userId) => {
		try {
			const response = await httpRequest.post(
				`/course/${id}/enroll`,
				{ userId },
			);
			return response.data;
		} catch (error) {
			throw new Error(error.response?.data?.msg || 'Failed to enroll in course');
		}
	},

	// Rate course
	rateCourse: async (id, rating) => {
		try {
			const response = await httpRequest.post(
				`/course/${id}/rate`,
				{ rating },
			);
			return response.data;
		} catch (error) {
			throw new Error(error.response?.data?.msg || 'Failed to rate course');
		}
	},
};

export default courseService;

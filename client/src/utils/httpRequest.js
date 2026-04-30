import axios from 'axios';

const httpRequest = axios.create({
	withCredentials: true,
	baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
});

httpRequest.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem('token');
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => {
		return Promise.reject(error);
	}
);

export default httpRequest;

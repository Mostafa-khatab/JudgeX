import { create } from 'zustand';

import httpRequest from '~/utils/httpRequest';

const getErrorMessage = (err) => {
	if (err.response?.status === 401) return 'Invalid email or password';
	if (err.response?.status === 403) return 'Please verify your email first';
	if (err.response?.status === 429) return 'Too many login attempts. Try again later.';
	if (!err.response) return 'Network error. Check your connection.';
	return err.response?.data?.msg || 'Something went wrong';
};

const useAuthStore = create((set) => ({
	user: null,
	isAuth: false,
	error: null,
	msg: null,
	isLoading: false,
	setUser: (user) => set({ user }),
	setIsAuth: (isAuth) => set({ isAuth }),

	async getInfo() {
		set({ error: null, msg: null, isLoading: true });

		try {
			const res = await httpRequest.get('/auth');
			set({ user: res.data.data, isAuth: true, isLoading: false });
		} catch (err) {
			set({ user: null, isAuth: false, isLoading: false });
		}
	},

	async reload() {
		try {
			const res = await httpRequest.get('/auth');
			set({ user: res.data.data, isAuth: true });
		} catch (err) {
			set({ isAuth: false });
		}
	},

	async login(email, password) {
		set({ user: null, error: null, msg: null, isLoading: true });

		try {
			const res = await httpRequest.post('/auth/login', { email, password });
			const { data: payload, msg } = res.data;
			if (payload.token) {
				localStorage.setItem('token', payload.token);
			}
			set({ user: payload, isAuth: true, msg: msg, isLoading: false });
		} catch (err) {
			set({ error: getErrorMessage(err), isAuth: false, isLoading: false });
		}
	},

	async signup(email, password, name) {
		set({ error: null, msg: null, isLoading: true });

		try {
			const res = await httpRequest.post('/auth/signup', { email, password, name });
			set({ msg: res.data.msg, isLoading: false });
		} catch (err) {
			set({ error: getErrorMessage(err), isLoading: false });
		}
	},

	async logout() {
		set({ error: null, msg: null, isLoading: true });

		try {
			await httpRequest.post('/auth/logout');
			localStorage.removeItem('token');
			set({ isAuth: false, user: null, isLoading: false });
		} catch (err) {
			localStorage.removeItem('token');
			set({ isAuth: false, user: null, isLoading: false });
		}
	},

	async verifyEmail(code) {
		set({ error: null, msg: null, isLoading: true });

		try {
			const res = await httpRequest.post(`/auth/verify-email/${code}`);
			set({ isLoading: false, msg: res.data.msg });
		} catch (err) {
			set({ error: getErrorMessage(err), isLoading: false });
		}
	},

	async sendVerifyCode(email) {
		set({ error: null, msg: null, isLoading: true });

		try {
			const res = await httpRequest.post(`/auth/re-send-verify`, { email });
			set({ isLoading: false, msg: res.data.msg });
		} catch (err) {
			set({ error: getErrorMessage(err), isLoading: false });
		}
	},

	async forgotPassword(email) {
		set({ error: null, msg: null, isLoading: true });

		try {
			const res = await httpRequest.post('/auth/forgot-password', { email });
			set({ isLoading: false, msg: res.data.msg });
		} catch (err) {
			set({ error: getErrorMessage(err), isLoading: false });
		}
	},

	async resetPassword(token, password) {
		set({ error: null, msg: null, isLoading: true });

		try {
			const res = await httpRequest.post(`/auth/reset-password/${token}`, { password });
			set({ isLoading: false, msg: res.data.msg });
		} catch (err) {
			set({ error: getErrorMessage(err), isLoading: false });
		}
	},

	clearLog() {
		set({ error: null, msg: null });
	},
}));

export default useAuthStore;


import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const authService = {
  // Sign up with email
  signup: async (name, email, password) => {
    try {
      const response = await api.post('/auth/signup', {
        name,
        email,
        password,
      });
      
      if (response.token) {
        await AsyncStorage.setItem('authToken', response.token);
      }
      if (response.user) {
        await AsyncStorage.setItem('user', JSON.stringify(response.user));
      }
      
      return response;
    } catch (error) {
      throw error.message ? error : { message: 'Signup failed' };
    }
  },

  // Login with email
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });
      
      if (response.token) {
        await AsyncStorage.setItem('authToken', response.token);
      }
      if (response.user) {
        await AsyncStorage.setItem('user', JSON.stringify(response.user));
      }
      
      return response;
    } catch (error) {
      throw error.message ? error : { message: 'Login failed' };
    }
  },

  // Google login
  googleLogin: async (googleToken) => {
    try {
      const response = await api.post('/auth/google/login', {
        token: googleToken,
      });
      
      if (response.token) {
        await AsyncStorage.setItem('authToken', response.token);
      }
      if (response.user) {
        await AsyncStorage.setItem('user', JSON.stringify(response.user));
      }
      
      return response;
    } catch (error) {
      throw error.message ? error : { message: 'Google login failed' };
    }
  },

  // Logout
  logout: async () => {
    try {
      await api.post('/auth/logout', {});
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
    }
  },

  // Forgot password
  forgotPassword: async (email) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response;
    } catch (error) {
      throw error.message ? error : { message: 'Failed to send reset email' };
    }
  },

  // Verify email
  verifyEmail: async (code) => {
    try {
      const response = await api.post(`/auth/verify-email/${code}`, {});
      return response;
    } catch (error) {
      throw error.message ? error : { message: 'Verification failed' };
    }
  },

  // Resend verification code
  resendVerification: async (email) => {
    try {
      const response = await api.post('/auth/re-send-verify', { email });
      return response;
    } catch (error) {
      throw error.message ? error : { message: 'Failed to resend verification' };
    }
  },

  // Get current user info
  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth');
      return response;
    } catch (error) {
      throw error.message ? error : { message: 'Failed to get user info' };
    }
  },

  // Check if user is authenticated
  isAuthenticated: async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      return !!token;
    } catch (error) {
      return false;
    }
  },

  // Get stored user
  getStoredUser: async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      return null;
    }
  },
};

export default authService;

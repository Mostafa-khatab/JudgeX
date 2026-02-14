import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// API Base URL - auto-detect for web (Docker) or use local IP for native
const getApiBaseUrl = () => {
  if (Platform.OS === 'web') {
    // In Docker/web, use the same hostname but server port
    const hostname = window.location.hostname || 'localhost';
    return `http://${hostname}:8080`;
  }
  // For native mobile, use your computer's IP on WiFi
  return 'http://192.168.1.5:8080';
};

const API_BASE_URL = getApiBaseUrl();

// Get auth token from storage
const getAuthToken = async () => {
  try {
    return await AsyncStorage.getItem('authToken');
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// API request helper
const apiRequest = async (endpoint, options = {}) => {
  const token = await getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const config = {
    ...options,
    headers,
  };
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();
    
    if (!response.ok) {
      // Handle 401 - token expired
      if (response.status === 401) {
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('user');
      }
      throw { message: data.message || 'Request failed', status: response.status, data };
    }
    
    return data;
  } catch (error) {
    if (error.message === 'Network request failed') {
      throw { message: 'Network error. Please check your connection.' };
    }
    throw error;
  }
};

// API methods
const api = {
  get: (endpoint, options = {}) => apiRequest(endpoint, { ...options, method: 'GET' }),
  
  post: (endpoint, body, options = {}) => apiRequest(endpoint, {
    ...options,
    method: 'POST',
    body: JSON.stringify(body),
  }),
  
  put: (endpoint, body, options = {}) => apiRequest(endpoint, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(body),
  }),
  
  delete: (endpoint, options = {}) => apiRequest(endpoint, { ...options, method: 'DELETE' }),
};

export default api;

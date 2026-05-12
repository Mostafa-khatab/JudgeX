import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// IMPORTANT: Change this to your computer's ACTUAL IP address (e.g., 192.168.1.5)
// Find it by running 'ipconfig' (Windows) or 'ifconfig' (Mac/Linux)
const LOCAL_IP = '192.168.1.3'; 

export const API_BASE_URL = Platform.OS === 'web' 
  ? 'http://localhost:8080' 
  : `http://${LOCAL_IP}:8080`;


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
    credentials: Platform.OS === 'web' ? 'include' : 'same-origin',
    ...options,
    headers,
  };
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();
    
    if (!response.ok) {
      if (response.status === 401) {
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('user');
      }
      const errorMsg = data.message || data.msg || 'Request failed';
      throw { message: errorMsg, status: response.status, data };
    }
    
    return data;
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error);
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
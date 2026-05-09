import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const storedUser = await authService.getStoredUser();
      const token = await AsyncStorage.getItem('authToken');
      if (storedUser && token) {
        // Handle potential wrapped data from older versions
        const actualUser = storedUser.data || storedUser;
        setUser(actualUser);
        setIsAuthenticated(true);
      } else {
        // Clear any partial data
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('user');
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password, token = null, userData = null) => {
    // If token and userData are provided (from Google login), use them directly
    if (token && userData) {
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);
      return { token, user: userData };
    }
    
    // Otherwise do normal email/password login
    const loggedInUser = await authService.login(email, password);
    setUser(loggedInUser);
    setIsAuthenticated(true);
    return loggedInUser;
  };

  const signup = async (name, email, password) => {
    const userData = await authService.signup(name, email, password);
    setUser(userData);
    setIsAuthenticated(true);
    return userData;
  };

  const googleLogin = async (token) => {
    const userData = await authService.googleLogin(token);
    setUser(userData);
    setIsAuthenticated(true);
    return userData;
  };

  const logout = async () => {
    try {
      // Clear local storage first
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
      
      // Update state immediately
      setUser(null);
      setIsAuthenticated(false);
      
      // Try to call server logout (but don't wait for it)
      authService.logout().catch(err => console.log('Server logout:', err));
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear state even if there's an error
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    signup,
    googleLogin,
    logout,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

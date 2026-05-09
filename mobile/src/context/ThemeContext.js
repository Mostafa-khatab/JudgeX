import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState('dark'); // 'light', 'dark', 'system'

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('user-theme');
      if (savedTheme) {
        setThemeMode(savedTheme);
      }
    } catch (e) {
      console.log('Failed to load theme', e);
    }
  };

  const updateTheme = async (mode) => {
    try {
      setThemeMode(mode);
      await AsyncStorage.getItem('user-theme', mode);
    } catch (e) {
      console.log('Failed to save theme', e);
    }
  };

  const isDark = themeMode === 'system' ? systemColorScheme === 'dark' : themeMode === 'dark';

  const theme = {
    mode: themeMode,
    isDark,
    colors: isDark ? darkColors : lightColors,
    updateTheme,
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

const darkColors = {
  background: '#0a0a0a',
  card: '#1a1a1a',
  text: '#ffffff',
  textSecondary: '#71717a',
  border: '#222',
  primary: '#0ea5e9',
  accent: '#a855f7',
};

const lightColors = {
  background: '#ffffff',
  card: '#f4f4f5',
  text: '#09090b',
  textSecondary: '#71717a',
  border: '#e4e4e7',
  primary: '#3b82f6',
  accent: '#8b5cf6',
};

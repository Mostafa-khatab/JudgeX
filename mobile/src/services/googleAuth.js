import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Platform } from 'react-native';
import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Required for web browser to close properly
WebBrowser.maybeCompleteAuthSession();

// Google OAuth credentials
const GOOGLE_CLIENT_ID_WEB = '364985378425-opme09q7immjbibva92731f3rspetqqa.apps.googleusercontent.com';
const GOOGLE_CLIENT_ID_ANDROID = '364985378425-joj2q8fjoumh3r222oig5c62vcnlv0d2.apps.googleusercontent.com';
const GOOGLE_CLIENT_ID_IOS = null; // Add iOS client ID if needed

export const useGoogleAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_CLIENT_ID_WEB,
    androidClientId: GOOGLE_CLIENT_ID_ANDROID,
    iosClientId: GOOGLE_CLIENT_ID_IOS || undefined,
  });

  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await promptAsync();
      
      if (result?.type === 'success') {
        const { authentication } = result;
        
        // Send the access token to our backend
        const apiResponse = await api.post('/auth/google/login', {
          credential: authentication.accessToken,
        });
        
        if (apiResponse.token) {
          await AsyncStorage.setItem('authToken', apiResponse.token);
        }
        if (apiResponse.user) {
          await AsyncStorage.setItem('user', JSON.stringify(apiResponse.user));
        }
        
        return apiResponse;
      } else if (result?.type === 'cancel') {
        throw new Error('Google sign-in was cancelled');
      } else {
        throw new Error('Google sign-in failed');
      }
    } catch (err) {
      setError(err.message || 'Google sign-in failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    signInWithGoogle,
    loading,
    error,
    isReady: !!request,
  };
};

export default useGoogleAuth;

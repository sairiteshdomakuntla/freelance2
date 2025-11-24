import * as WebBrowser from 'expo-web-browser';
import { API_BASE_URL } from './authClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { makeRedirectUri } from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

export async function googleLogin() {
  try {
    // Use Expo's redirect URI helper - this creates a proxy URL for mobile
    const redirectUrl = makeRedirectUri({
      scheme: 'client',
      path: 'auth-callback',
    });
    
    console.log('🔑 Platform:', Platform.OS);
    console.log('🔙 Generated Redirect URL:', redirectUrl);
    
    // Better Auth uses /sign-in/google endpoint (with hyphen)
    const authUrl = `${API_BASE_URL}/api/auth/sign-in/google`;
    const params = new URLSearchParams({
      currentURL: redirectUrl,
    });
    
    const fullAuthUrl = `${authUrl}?${params.toString()}`;
    
    console.log('🔑 Opening Google OAuth:', fullAuthUrl);
    
    const result = await WebBrowser.openAuthSessionAsync(
      fullAuthUrl,
      redirectUrl
    );
    
    console.log('📱 Google OAuth result type:', result.type);
    console.log('📱 Google OAuth result:', JSON.stringify(result, null, 2));
    
    if (result.type === 'success' && result.url) {
      // Parse the callback URL to get session data
      const url = new URL(result.url);
      const sessionToken = url.searchParams.get('session_token');
      const userDataStr = url.searchParams.get('user');
      const error = url.searchParams.get('error');
      
      if (error) {
        throw new Error('Google authentication failed');
      }
      
      if (sessionToken && userDataStr) {
        // Store session
        await AsyncStorage.setItem('session_token', sessionToken);
        await AsyncStorage.setItem('user', userDataStr);
        
        console.log('✅ Google session stored');
        
        return { sessionToken, user: JSON.parse(userDataStr) };
      }
      
      // If no query params, the session might be in cookies
      // Try to fetch user session from backend
      const response = await fetch(`${API_BASE_URL}/api/auth/session`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          // Store in AsyncStorage
          await AsyncStorage.setItem('user', JSON.stringify(data.user));
          if (data.session?.token) {
            await AsyncStorage.setItem('session_token', data.session.token);
          }
          return data;
        }
      }
    }
    
    return null;
  } catch (e) {
    console.log('Google Login Error:', e);
    throw e;
  }
}

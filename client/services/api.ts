import { API_BASE_URL as BASE_URL } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User, UpdateProfileData, AdminUserListResponse, UserStats } from '../types/user';

const API_BASE_URL = `${BASE_URL}/api`;

// Using fetch API for React Native compatibility
const request = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Get session token from AsyncStorage
  const sessionToken = await AsyncStorage.getItem('session_token');
  
  console.log('🔐 API Request:', endpoint);
  console.log('🔐 Has session token:', !!sessionToken);
  
  const config: RequestInit = {
    ...options,
    credentials: 'include', // Important: include cookies for auth
    headers: {
      'Content-Type': 'application/json',
      // Send session token as Cookie header for React Native
      ...(sessionToken && { 'Cookie': `better-auth.session_token=${sessionToken}` }),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    
    console.log('📡 Response status:', response.status);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      console.error('❌ API Error:', error);
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ API Success:', endpoint);
    return data;
  } catch (error: any) {
    console.error('❌ API Request failed:', error.message);
    throw error;
  }
};

// User Profile API
export const userAPI = {
  // Get current user profile
  getProfile: (): Promise<User> => request('/users/me'),
  
  // Update current user profile
  updateProfile: (data: UpdateProfileData): Promise<User> => 
    request('/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  // Set user role (one-time during registration)
  setRole: (role: 'Customer' | 'Vendor'): Promise<User> => 
    request('/users/me/role', {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }),
};

// Admin API
export const adminAPI = {
  // Get all users with filters
  getUsers: (params?: {
    page?: number;
    limit?: number;
    role?: string;
    isActive?: boolean;
    search?: string;
  }): Promise<AdminUserListResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.role) queryParams.append('role', params.role);
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    return request(`/admin/users?${queryParams.toString()}`);
  },
  
  // Get user by ID
  getUserById: (id: string): Promise<User> => request(`/admin/users/${id}`),
  
  // Enable/disable user account
  updateUserStatus: (id: string, isActive: boolean): Promise<User> => 
    request(`/admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    }),
  
  // Get user statistics
  getStats: (): Promise<UserStats> => request('/admin/stats'),
};



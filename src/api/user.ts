import axios from 'axios';
import type { User, RegisterRequest, LoginRequest, LoginResponse, UpdateProfileRequest, ChangePasswordRequest } from '../types/user';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3006/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
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

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

export const register = async (data: RegisterRequest): Promise<LoginResponse> => {
  return api.post('/auth/register', data);
};

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  return api.post('/auth/login', data);
};

export const logout = async (): Promise<void> => {
  return api.post('/auth/logout');
};

export const getCurrentUser = async (): Promise<User> => {
  return api.get('/user/me');
};

export const updateProfile = async (data: UpdateProfileRequest): Promise<User> => {
  return api.put('/user/profile', data);
};

export const changePassword = async (data: ChangePasswordRequest): Promise<void> => {
  return api.put('/user/password', data);
};

export const uploadAvatar = async (file: File): Promise<{ avatarUrl: string }> => {
  const formData = new FormData();
  formData.append('avatar', file);
  return api.post('/user/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

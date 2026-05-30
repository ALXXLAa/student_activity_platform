import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User, LoginResponse } from '../types/user';
import * as userApi from '../api/user';

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const isLoggedIn = computed(() => !!user.value && !!token.value);

  const setUser = (userData: User, authToken: string) => {
    user.value = userData;
    token.value = authToken;
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const clearUser = () => {
    user.value = null;
    token.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const initializeFromStorage = () => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      try {
        token.value = storedToken;
        user.value = JSON.parse(storedUser);
      } catch (e) {
        clearUser();
      }
    }
  };

  const register = async (username: string, email: string, password: string, additionalData?: Record<string, any>) => {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await userApi.register({ username, email, password, ...additionalData });
      setUser(response.user, response.token);
      return response;
    } catch (err: any) {
      error.value = err.message || '注册失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const login = async (email: string, password: string) => {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await userApi.login({ email, password });
      setUser(response.user, response.token);
      return response;
    } catch (err: any) {
      error.value = err.message || '登录失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const logout = async () => {
    try {
      await userApi.logout();
    } catch (err) {
      console.error('登出请求失败:', err);
    } finally {
      clearUser();
    }
  };

  const updateProfile = async (profileData: Record<string, any>) => {
    isLoading.value = true;
    error.value = null;
    try {
      const updatedUser = await userApi.updateProfile(profileData);
      user.value = updatedUser;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return updatedUser;
    } catch (err: any) {
      error.value = err.message || '更新个人信息失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    isLoading.value = true;
    error.value = null;
    try {
      await userApi.changePassword({ oldPassword, newPassword });
    } catch (err: any) {
      error.value = err.message || '修改密码失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const fetchCurrentUser = async () => {
    isLoading.value = true;
    error.value = null;
    try {
      const currentUser = await userApi.getCurrentUser();
      user.value = currentUser;
      localStorage.setItem('user', JSON.stringify(currentUser));
      return currentUser;
    } catch (err: any) {
      error.value = err.message || '获取用户信息失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    user,
    token,
    isLoading,
    error,
    isLoggedIn,
    setUser,
    clearUser,
    initializeFromStorage,
    register,
    login,
    logout,
    updateProfile,
    changePassword,
    fetchCurrentUser
  };
});

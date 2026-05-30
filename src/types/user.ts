export interface User {
  id: string;
  username: string;
  email: string;
  password?: string;
  avatar?: string;
  phone?: string;
  studentId?: string;
  major?: string;
  grade?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  phone?: string;
  studentId?: string;
  major?: string;
  grade?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface UpdateProfileRequest {
  username?: string;
  avatar?: string;
  phone?: string;
  major?: string;
  grade?: string;
  bio?: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

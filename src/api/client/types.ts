import type { UserRole } from '../../types';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: Record<string, unknown>;
}

export interface ApiError {
  message: string;
  status?: number;
  error?: string;
}

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'inactive' | 'suspended';
  coeScopeIds?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthSessionDto {
  user: ApiUser;
  token: string;
  refreshToken: string;
}

export interface RefreshTokenDto {
  token: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface GoogleAuthPayload {
  credential: string;
}

export interface RefreshTokenPayload {
  refreshToken: string;
}

declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    _retry?: boolean;
    _skipAuth?: boolean;
  }
}

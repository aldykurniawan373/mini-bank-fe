import api from './api';
import type { LoginRequest, LoginResponse, RefreshTokenResponse, User } from '@/types/auth';

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/login', credentials);
    return response.data;
  },

  async refresh(): Promise<RefreshTokenResponse> {
    const response = await api.post<RefreshTokenResponse>('/token/refresh');
    return response.data;
  },

  async logout(): Promise<void> {
    await api.post('/logout');
  },

  async me(): Promise<User> {
    const response = await api.get<User>('/me');
    return response.data;
  },
};


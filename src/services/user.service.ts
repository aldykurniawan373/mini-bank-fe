import api from './api';
import type { User, UserFormData, UserListResponse, UserResponse } from '@/types/user';

export interface UserListParams {
  page?: number;
  per_page?: number;
  search?: string;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  role?: 'admin' | 'pimpinan';
}

export const userService = {
  async list(params: UserListParams = {}): Promise<UserListResponse> {
    const response = await api.get<UserListResponse>('/users', { params });
    return response.data;
  },

  async create(data: UserFormData): Promise<UserResponse> {
    const response = await api.post<UserResponse>('/users', data);
    return response.data;
  },

  async update(id: number, data: UserFormData): Promise<UserResponse> {
    const response = await api.put<UserResponse>(`/users/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/users/${id}`);
  },
};


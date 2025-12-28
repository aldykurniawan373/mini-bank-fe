import api from './api';
import type { Account, AccountResponse, AccountListResponse } from '@/types/account';

export const accountService = {
  async list(params?: { page?: number; per_page?: number; search?: string; sort_by?: string; sort_dir?: 'asc' | 'desc' }): Promise<AccountListResponse> {
    const response = await api.get<AccountListResponse>('/accounts', { params });
    return response.data;
  },

  async show(id: number): Promise<AccountResponse> {
    const response = await api.get<AccountResponse>(`/accounts/${id}`);
    return response.data;
  },

  async create(customerId: number): Promise<AccountResponse> {
    const response = await api.post<AccountResponse>(`/customers/${customerId}/account`);
    return response.data;
  },

  async search(search: string = '', excludeId?: number, limit: number = 20): Promise<AccountListResponse> {
    const params: Record<string, string | number> = {
      limit,
    };
    if (search) {
      params.search = search;
    }
    if (excludeId) {
      params.exclude_id = excludeId;
    }
    const response = await api.get<AccountListResponse>('/accounts/search', { params });
    return response.data;
  },
};


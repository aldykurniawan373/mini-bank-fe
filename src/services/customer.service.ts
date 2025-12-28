import api from './api';
import type { Customer, CustomerFormData, CustomerListResponse, CustomerResponse } from '@/types/customer';

export interface CustomerListParams {
  page?: number;
  per_page?: number;
  search?: string;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
}

export const customerService = {
  async list(params: CustomerListParams = {}): Promise<CustomerListResponse> {
    const response = await api.get<CustomerListResponse>('/customers', { params });
    return response.data;
  },

  async show(id: number): Promise<CustomerResponse> {
    const response = await api.get<CustomerResponse>(`/customers/${id}`);
    return response.data;
  },

  async create(data: CustomerFormData): Promise<CustomerResponse> {
    const payload = {
      full_name: data.name,
      nik: data.nik,
      phone: data.phone,
      address: data.address,
    };
    const response = await api.post<CustomerResponse>('/customers', payload);
    return response.data;
  },

  async update(id: number, data: Partial<CustomerFormData>): Promise<CustomerResponse> {
    const response = await api.put<CustomerResponse>(`/customers/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/customers/${id}`);
  },
};


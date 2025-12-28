import type { PaginatedResponse } from './api';
import type { Account } from './account';

export interface Customer {
  id: number;
  full_name: string;
  nik: string | null;
  phone: string | null;
  address: string | null;
  accounts?: Account[];
  created_at: string;
  updated_at: string;
}

export interface CustomerFormData {
  full_name: string;
  nik: string;
  phone?: string;
  address?: string;
}

export interface CustomerListResponse extends PaginatedResponse<Customer> {}

export interface CustomerResponse {
  message: string;
  data: Customer;
}


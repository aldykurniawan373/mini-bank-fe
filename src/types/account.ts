import type { Customer } from './customer';

export interface Account {
  id: number;
  account_number: string;
  balance: number;
  customer?: Customer;
  created_at: string;
  updated_at: string;
}

export interface AccountResponse {
  message: string;
  data: Account;
}

export interface AccountListResponse {
  message: string;
  data: Account[];
}


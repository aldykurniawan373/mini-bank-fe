import api from './api';
import type {
  Transaction,
  TransactionListResponse,
  DepositRequest,
  WithdrawRequest,
  TransferRequest,
  ExportTransactionRequest,
  TransactionResponse,
  BalanceResponse,
} from '@/types/transaction';

export interface TransactionListParams {
  page?: number;
  per_page?: number;
  search?: string;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  type?: 'deposit' | 'withdrawal' | 'transfer';
  direction?: 'in' | 'out';
  account_id?: number;
  start_date?: string;
  end_date?: string;
}

export const transactionService = {
  async index(params: TransactionListParams = {}): Promise<TransactionListResponse> {
    const response = await api.get<TransactionListResponse>('/transactions', { params });
    return response.data;
  },

  async balance(accountId: number): Promise<BalanceResponse> {
    const response = await api.get<BalanceResponse>(`/transactions/${accountId}/balance`);
    return response.data;
  },

  async history(accountId: number, params: TransactionListParams = {}): Promise<TransactionListResponse> {
    const response = await api.get<TransactionListResponse>(`/transactions/${accountId}/history`, { params });
    return response.data;
  },

  async deposit(accountId: number, data: DepositRequest): Promise<TransactionResponse> {
    const response = await api.post<TransactionResponse>(`/transactions/${accountId}/deposit`, data);
    return response.data;
  },

  async withdraw(accountId: number, data: WithdrawRequest): Promise<TransactionResponse> {
    const response = await api.post<TransactionResponse>(`/transactions/${accountId}/withdraw`, data);
    return response.data;
  },

  async transfer(accountId: number, data: TransferRequest): Promise<TransactionResponse> {
    const response = await api.post<TransactionResponse>(`/transactions/${accountId}/transfer`, data);
    return response.data;
  },

  async export(accountId: number, data: ExportTransactionRequest = {}): Promise<{ message: string; data?: any }> {
    const response = await api.post(`/transactions/${accountId}/export`, data);
    return response.data;
  },

  async downloadExport(filename: string): Promise<Blob> {
    const response = await api.get(`/transactions/export/${filename}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  async checkExportStatus(filename: string): Promise<{ message: string; data: { filename: string; exists: boolean; filepath: string } }> {
    const response = await api.get(`/transactions/export/${filename}/status`);
    return response.data;
  },

  async listExports(accountId?: number): Promise<{ message: string; data: Array<{ filename: string; filepath: string; size: number; created_at: string; download_url: string; account_number?: string }> }> {
    const url = accountId ? `/transactions/${accountId}/exports` : '/transactions/exports';
    const response = await api.get(url);
    return response.data;
  },
};


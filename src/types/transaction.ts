import type { PaginatedResponse } from './api';
import type { Account } from './account';

export interface Transaction {
  id: number;
  transaction_code: string;
  type: 'deposit' | 'withdrawal' | 'transfer';
  type_label: string;
  direction: 'in' | 'out';
  direction_label: string;
  amount: number;
  account?: Account;
  related_account?: Account | null;
  created_at: string;
}

export interface TransactionListResponse extends PaginatedResponse<Transaction> {}

export interface DepositRequest {
  amount: number;
}

export interface WithdrawRequest {
  amount: number;
}

export interface TransferRequest {
  to_account_id: number;
  amount: number;
  description?: string;
}

export interface ExportTransactionRequest {
  start_date?: string;
  end_date?: string;
}

export interface TransactionResponse {
  message: string;
  data: Transaction | {
    from_transaction: Transaction;
    to_transaction: Transaction;
  };
}

export interface BalanceResponse {
  message: string;
  data: Account;
}


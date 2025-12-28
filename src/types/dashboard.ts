export interface DashboardStatistics {
  summary: {
    total_balance: number;
    total_customers: number;
    total_accounts: number;
    transactions_today: number;
    transactions_this_month: number;
  };
  today: {
    transactions: number;
    deposits: number;
    withdrawals: number;
    transfers: number;
  };
  yesterday: {
    transactions: number;
    deposits: number;
    withdrawals: number;
    transfers: number;
  };
  changes: {
    transactions: number;
    customers: number;
    accounts: number;
  };
  recent_transactions: RecentTransaction[];
  daily_stats: DailyStat[];
}

export interface RecentTransaction {
  id: number;
  transaction_code: string;
  type: 'deposit' | 'withdrawal' | 'transfer';
  type_label: string;
  direction: 'in' | 'out';
  amount: number;
  account_number: string | null;
  customer_name: string | null;
  created_at: string;
}

export interface DailyStat {
  date: string;
  total: number;
  deposits: number;
  withdrawals: number;
  transfers: number;
}

export interface DashboardResponse {
  message: string;
  data: DashboardStatistics;
}


import { apiClient } from '../lib/apiClient';
import {
  CreateTransactionInput,
  PaginationMeta,
  SimulationResult,
  Transaction,
  TransactionFilters,
} from '../lib/types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: PaginationMeta;
}

export async function simulateTransaction(
  input: CreateTransactionInput
): Promise<SimulationResult> {
  const res = await apiClient<ApiResponse<SimulationResult>>('/api/v1/transactions/simulate', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function createTransaction(
  input: CreateTransactionInput
): Promise<SimulationResult> {
  const res = await apiClient<ApiResponse<SimulationResult>>('/api/v1/transactions', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function listTransactions(
  filters: TransactionFilters
): Promise<{ data: Transaction[]; pagination: PaginationMeta }> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value));
  });
  const res = await apiClient<ApiResponse<Transaction[]>>(
    `/api/v1/transactions?${params.toString()}`
  );
  return {
    data: res.data,
    pagination: res.pagination ?? {
      total: res.data.length,
      page: 1,
      pageSize: res.data.length,
      totalPages: 1,
    },
  };
}

export async function settleTransaction(transactionId: string): Promise<Transaction> {
  const res = await apiClient<ApiResponse<Transaction>>(
    `/api/v1/transactions/${transactionId}/settle`,
    { method: 'POST' }
  );
  return res.data;
}

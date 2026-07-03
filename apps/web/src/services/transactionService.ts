import { apiClient } from '../lib/apiClient';
import {
  CreateTransactionInput,
  PaginationMeta,
  SettlementExtractRow,
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
  const mapped = { ...filters };
  if (mapped.cedente) {
    params.set('createdBy', mapped.cedente);
    delete mapped.cedente;
  }
  Object.entries(mapped).forEach(([key, value]) => {
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

export async function fetchSettlementExtract(
  filters: TransactionFilters
): Promise<{ data: SettlementExtractRow[]; pagination: PaginationMeta }> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value));
  });
  const res = await apiClient<ApiResponse<SettlementExtractRow[]>>(
    `/api/v1/reports/settlement-extract?${params.toString()}`
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

function mapExtractToTransaction(row: SettlementExtractRow): Transaction {
  return {
    id: row.id,
    externalReference: row.external_reference,
    assetTypeId: '',
    currencyId: '',
    faceValue: Number(row.face_value),
    daysToMaturity: 0,
    discountRate: 0,
    discountAmount: Number(row.discount_amount),
    netAmount: Number(row.net_amount),
    convertedAmount: row.converted_amount,
    status: 'SETTLED',
    settledAt: row.settled_at,
    createdBy: row.created_by,
    createdAt: row.settled_at ?? row.created_at,
    assetType: { id: '', code: row.asset_code, name: row.asset_name, active: true },
    currency: { id: '', code: row.currency_code, name: row.currency_code, symbol: row.currency_symbol, active: true },
  };
}

export async function loadSettlementGrid(
  filters: TransactionFilters
): Promise<{ data: Transaction[]; pagination: PaginationMeta }> {
  const { data, pagination } = await fetchSettlementExtract(filters);
  return { data: data.map(mapExtractToTransaction), pagination };
}

export async function settleTransaction(transactionId: string): Promise<Transaction> {
  const res = await apiClient<ApiResponse<Transaction>>(
    `/api/v1/transactions/${transactionId}/settle`,
    { method: 'POST' }
  );
  return res.data;
}

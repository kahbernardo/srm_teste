'use client';

import { create } from 'zustand';
import {
  AssetType,
  CreateTransactionInput,
  Currency,
  PaginationMeta,
  SimulationResult,
  Transaction,
  TransactionFilters,
} from '../lib/types';
import { fetchAssetTypes, fetchCurrencies } from '../services/referenceDataService';
import {
  createTransaction,
  listTransactions,
  loadSettlementGrid,
  settleTransaction,
  simulateTransaction,
} from '../services/transactionService';

interface OperatorState {
  currencies: Currency[];
  assetTypes: AssetType[];
  transactions: Transaction[];
  pagination: PaginationMeta;
  filters: TransactionFilters;
  simulation: SimulationResult | null;
  loading: boolean;
  simulating: boolean;
  error: string | null;
  loadReferenceData: () => Promise<void>;
  loadTransactions: () => Promise<void>;
  setFilters: (filters: Partial<TransactionFilters>) => void;
  runSimulation: (input: CreateTransactionInput) => Promise<void>;
  submitTransaction: (input: CreateTransactionInput) => Promise<void>;
  settle: (transactionId: string) => Promise<void>;
}

export const useOperatorStore = create<OperatorState>((set, get) => ({
  currencies: [],
  assetTypes: [],
  transactions: [],
  pagination: { total: 0, page: 1, pageSize: 20, totalPages: 1 },
  filters: { page: 1, pageSize: 20 },
  simulation: null,
  loading: false,
  simulating: false,
  error: null,

  loadReferenceData: async () => {
    try {
      const [currencies, assetTypes] = await Promise.all([
        fetchCurrencies(),
        fetchAssetTypes(),
      ]);
      set({ currencies, assetTypes, error: null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load reference data' });
    }
  },

  loadTransactions: async () => {
    set({ loading: true, error: null });
    try {
      const filters = get().filters;
      const useExtract = filters.status === 'SETTLED';
      const { data, pagination } = useExtract
        ? await loadSettlementGrid(filters)
        : await listTransactions(filters);
      set({ transactions: data, pagination, loading: false });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load transactions',
      });
    }
  },

  setFilters: (filters) => {
    set({ filters: { ...get().filters, ...filters, page: filters.page ?? 1 } });
    get().loadTransactions();
  },

  runSimulation: async (input) => {
    set({ simulating: true, error: null });
    try {
      const simulation = await simulateTransaction(input);
      set({ simulation, simulating: false });
    } catch (err) {
      set({
        simulating: false,
        error: err instanceof Error ? err.message : 'Simulation failed',
      });
    }
  },

  submitTransaction: async (input) => {
    set({ loading: true, error: null });
    try {
      await createTransaction(input);
      set({ simulation: null, loading: false });
      await get().loadTransactions();
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to create transaction',
      });
    }
  },

  settle: async (transactionId) => {
    set({ loading: true, error: null });
    try {
      await settleTransaction(transactionId);
      set({ loading: false });
      await get().loadTransactions();
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to settle transaction',
      });
    }
  },
}));

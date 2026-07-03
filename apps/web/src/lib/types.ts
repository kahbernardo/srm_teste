export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  active: boolean;
}

export interface AssetType {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  active: boolean;
}

export interface Transaction {
  id: string;
  externalReference?: string | null;
  assetTypeId: string;
  currencyId: string;
  faceValue: number;
  daysToMaturity: number;
  discountRate: number;
  discountAmount: number;
  netAmount: number;
  exchangeRateApplied?: number | null;
  convertedAmount?: number | null;
  targetCurrencyId?: string | null;
  status: string;
  settledAt?: string | null;
  createdBy: string;
  createdAt: string;
  assetType?: AssetType;
  currency?: Currency;
}

export interface SimulationResult {
  id: string;
  faceValue: number | string;
  discountRate: number | string;
  discountAmount: number | string;
  netAmount: number | string;
  convertedAmount?: number | string;
  exchangeRateApplied?: number | string;
  status: string;
  assetTypeCode?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface TransactionFilters {
  status?: string;
  currencyId?: string;
  assetTypeId?: string;
  cedente?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface SettlementExtractRow {
  id: string;
  external_reference: string | null;
  face_value: number;
  discount_amount: number;
  net_amount: number;
  converted_amount: number | null;
  settled_at: string | null;
  created_by: string;
  created_at: string;
  asset_code: string;
  asset_name: string;
  currency_code: string;
  currency_symbol: string;
}

export interface CreateTransactionInput {
  externalReference?: string;
  assetTypeId: string;
  currencyId: string;
  faceValue: number;
  daysToMaturity: number;
  targetCurrencyId?: string;
  createdBy: string;
}

import { apiClient } from '../lib/apiClient';
import { AssetType, Currency } from '../lib/types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export async function fetchCurrencies(): Promise<Currency[]> {
  const res = await apiClient<ApiResponse<Currency[]>>('/api/v1/currencies?active=true');
  return res.data;
}

export async function fetchAssetTypes(): Promise<AssetType[]> {
  const res = await apiClient<ApiResponse<AssetType[]>>('/api/v1/asset-types?active=true');
  return res.data;
}

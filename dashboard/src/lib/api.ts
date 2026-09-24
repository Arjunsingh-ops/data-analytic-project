/**
 * Sales Analytics API Client & Data Models
 * Configurable via NEXT_PUBLIC_API_URL environment variable.
 */

export interface DatasetInfo {
  source_name: string;
  total_rows: number;
  filtered_rows: number;
  date_range: {
    min: string;
    max: string;
  };
  available_regions: string[];
  available_products: string[];
}

export interface Metrics {
  total_sales: number;
  total_quantity: number;
  total_transactions: number;
  average_sale_per_transaction: number;
  average_quantity_per_transaction: number;
  highest_sale: number;
  lowest_sale: number;
  unique_products: number;
  unique_regions: number;
}

export interface SalesTrendItem {
  period: string;
  sales: number;
  quantity: number;
  transactions: number;
}

export interface SalesTrend {
  labels: string[];
  values: number[];
  quantities: number[];
  transactions: number[];
  series: SalesTrendItem[];
}

export interface TopProductItem {
  product: string;
  sales: number;
  quantity: number;
  transaction_count: number;
  share_percentage: number;
}

export interface TopProducts {
  labels: string[];
  values: number[];
  quantities: number[];
  revenue_shares: number[];
  items: TopProductItem[];
}

export interface RegionDetail {
  region: string;
  total_sales: number;
  total_quantity: number;
  transaction_count: number;
  average_sale: number;
  revenue_percentage: number;
}

export interface RegionAnalysis {
  chart_data: {
    labels: string[];
    sales_values: number[];
    quantity_values: number[];
  };
  details: Record<string, RegionDetail>;
  items: RegionDetail[];
}

export interface Transaction {
  id: number;
  date: string;
  product: string;
  region: string;
  quantity: number;
  sales: number;
}

export interface AnalyticsResponse {
  success: boolean;
  dataset_info: DatasetInfo;
  metrics: Metrics;
  sales_trend: SalesTrend;
  top_products: TopProducts;
  region_analysis: RegionAnalysis;
  recent_transactions: Transaction[];
  error?: {
    code: number;
    message: string;
  };
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'offline';
  timestamp: string;
  uptime_seconds: number;
  dataset: {
    name: string;
    status: string;
    record_count: number;
  };
}

export interface FilterParams {
  startDate?: string;
  endDate?: string;
  region?: string;
  product?: string;
  topN?: number;
}

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

export async function checkBackendHealth(): Promise<HealthResponse> {
  const url = `${API_BASE_URL}/health`;
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) {
      throw new Error(`Health check returned status ${res.status}`);
    }
    return await res.json();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Connection refused';
    return {
      status: 'offline',
      timestamp: new Date().toISOString(),
      uptime_seconds: 0,
      dataset: {
        name: 'Unknown',
        status: `Unreachable: ${message}`,
        record_count: 0,
      },
    };
  }
}

export async function fetchAnalytics(filters: FilterParams = {}): Promise<AnalyticsResponse> {
  const params = new URLSearchParams();
  if (filters.startDate) params.append('start_date', filters.startDate);
  if (filters.endDate) params.append('end_date', filters.endDate);
  if (filters.region && filters.region !== 'All') params.append('region', filters.region);
  if (filters.product && filters.product !== 'All') params.append('product', filters.product);
  if (filters.topN) params.append('top_n', String(filters.topN));

  const queryString = params.toString();
  const url = `${API_BASE_URL}/api/analytics${queryString ? `?${queryString}` : ''}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    const data = await res.json();

    if (!res.ok || data.success === false) {
      throw new Error(data.error?.message || `Analytics API returned HTTP ${res.status}`);
    }

    return data;
  } catch (err: unknown) {
    if (err instanceof TypeError && err.message.includes('fetch')) {
      throw new Error(
        `Unable to reach backend API at ${API_BASE_URL}. Ensure the Flask server is running on port 5000 and CORS is enabled.`
      );
    }
    if (err instanceof Error) {
      throw err;
    }
    throw new Error('An unknown error occurred while fetching analytics');
  }
}

export async function uploadDataset(file: File): Promise<{ success: boolean; message: string; data: AnalyticsResponse }> {
  const formData = new FormData();
  formData.append('file', file);

  const url = `${API_BASE_URL}/api/upload`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();

    if (!res.ok || data.success === false) {
      throw new Error(data.error?.message || `Upload failed with HTTP ${res.status}`);
    }

    return data;
  } catch (err: unknown) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error('Error uploading dataset to backend');
  }
}

export async function resetDataset(): Promise<{ success: boolean; message: string; data: AnalyticsResponse }> {
  const url = `${API_BASE_URL}/api/reset`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Accept: 'application/json' },
    });

    const data = await res.json();

    if (!res.ok || data.success === false) {
      throw new Error(data.error?.message || `Reset failed with HTTP ${res.status}`);
    }

    return data;
  } catch (err: unknown) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error('Error resetting dataset to default');
  }
}

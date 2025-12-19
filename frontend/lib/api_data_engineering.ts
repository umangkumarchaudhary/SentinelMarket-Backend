// Data Engineering API Functions
// Add these to api.ts or import from here

// Define API base URL (same as in api.ts)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export interface Pipeline {
  name: string;
  description: string;
  source: string;
  frequency: string;
}

export interface PipelineResult {
  pipeline: string;
  success: boolean;
  records_processed?: number;
  records_extracted?: number;
  records_transformed?: number;
  records_loaded?: number;
  duration_seconds?: number;
  timestamp: string;
  errors?: string[];
}

export interface PipelineHealth {
  pipeline: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  success_rate: number;
  total_runs: number;
  success_count: number;
  failure_count: number;
  total_records_processed: number;
  average_duration_seconds: number;
  runs_last_24h: number;
  failures_last_24h: number;
  last_error?: string;
  timestamp: string;
}

export interface WarehouseStats {
  stock_records: number;
  social_mentions: number;
  storage_type: string;
  timestamp?: string;
}

export async function listPipelines(): Promise<{ pipelines: Pipeline[] }> {
  const response = await fetch(`${API_BASE_URL}/api/data/pipelines`);
  if (!response.ok) {
    throw new Error(`Failed to fetch pipelines: ${response.statusText}`);
  }
  return response.json();
}

export async function runPipeline(pipelineName: string): Promise<PipelineResult> {
  const response = await fetch(`${API_BASE_URL}/api/data/pipelines/${pipelineName}/run`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error(`Failed to run pipeline: ${response.statusText}`);
  }
  return response.json();
}

export async function getPipelineStatus(pipelineName: string): Promise<PipelineHealth> {
  const response = await fetch(`${API_BASE_URL}/api/data/pipelines/${pipelineName}/status`);
  if (!response.ok) {
    throw new Error(`Failed to fetch pipeline status: ${response.statusText}`);
  }
  return response.json();
}

export async function getAllPipelineHealth(): Promise<{ pipelines: Record<string, PipelineHealth>; total_pipelines: number; timestamp: string }> {
  const response = await fetch(`${API_BASE_URL}/api/data/pipelines/health`);
  if (!response.ok) {
    throw new Error(`Failed to fetch pipeline health: ${response.statusText}`);
  }
  return response.json();
}

export async function getSchedulerStatus(): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/data/pipelines/scheduler/status`);
  if (!response.ok) {
    throw new Error(`Failed to fetch scheduler status: ${response.statusText}`);
  }
  return response.json();
}

export async function getWarehouseStats(): Promise<WarehouseStats> {
  const response = await fetch(`${API_BASE_URL}/api/data/warehouse/stats`);
  if (!response.ok) {
    throw new Error(`Failed to fetch warehouse stats: ${response.statusText}`);
  }
  return response.json();
}

// Data Lake Interfaces and Functions
export interface DataLakeStats {
  base_path: string;
  sources: string[];
  total_files: number;
  total_size_bytes: number;
  total_size_mb: number;
}

export interface DataLakeSource {
  source: string;
  dates: string[];
}

export interface DataLakeData {
  source: string;
  date: string;
  records: number;
  data: any[];
}

// Data Quality Interfaces
export interface StockQualityReport {
  type: string;
  ticker: string;
  days: number;
  completeness: number;
  valid_ratio: number;
  total_records: number;
  timestamp: string;
}

export interface SocialQualityReport {
  type: string;
  ticker?: string;
  hours: number;
  completeness: number;
  valid_ratio: number;
  total_records: number;
  timestamp: string;
}

export interface OverallQualityReport {
  window_hours: number;
  stock: StockQualityReport;
  social: SocialQualityReport;
}

export async function getDataLakeStats(): Promise<DataLakeStats> {
  const response = await fetch(`${API_BASE_URL}/api/data/lake/stats`);
  if (!response.ok) {
    throw new Error(`Failed to fetch data lake stats: ${response.statusText}`);
  }
  return response.json();
}

export async function listDataLakeSources(): Promise<{ sources: string[] }> {
  const response = await fetch(`${API_BASE_URL}/api/data/lake/sources`);
  if (!response.ok) {
    throw new Error(`Failed to list data lake sources: ${response.statusText}`);
  }
  return response.json();
}

export async function listDataLakeDates(source: string): Promise<DataLakeSource> {
  const response = await fetch(`${API_BASE_URL}/api/data/lake/sources/${source}/dates`);
  if (!response.ok) {
    throw new Error(`Failed to list dates for source: ${response.statusText}`);
  }
  return response.json();
}

export async function getDataLakeData(source: string, date: string): Promise<DataLakeData> {
  const response = await fetch(`${API_BASE_URL}/api/data/lake/sources/${source}/data?date=${date}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch data lake data: ${response.statusText}`);
  }
  return response.json();
}

export async function getStockQuality(ticker: string, days = 7): Promise<StockQualityReport> {
  const response = await fetch(
    `${API_BASE_URL}/api/data/quality/stocks?ticker=${encodeURIComponent(ticker)}&days=${days}`,
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch stock data quality: ${response.statusText}`);
  }
  return response.json();
}

export async function getSocialQuality(ticker: string, hours = 24): Promise<SocialQualityReport> {
  const response = await fetch(
    `${API_BASE_URL}/api/data/quality/social?ticker=${encodeURIComponent(ticker)}&hours=${hours}`,
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch social data quality: ${response.statusText}`);
  }
  return response.json();
}

export async function getOverallQuality(hours = 24): Promise<OverallQualityReport> {
  const response = await fetch(
    `${API_BASE_URL}/api/data/quality?hours=${encodeURIComponent(String(hours))}`,
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch overall data quality: ${response.statusText}`);
  }
  return response.json();
}

// Streaming / real-time APIs
export interface PipelineStreamEvent {
  topic: string;
  payload: {
    pipeline: string;
    success: boolean;
    records_loaded: number;
    duration_seconds: number;
    timestamp: string;
  };
  timestamp: string;
}

export async function getPipelineStreamEvents(
  limit = 50,
): Promise<{ topic: string; events: PipelineStreamEvent[] }> {
  const response = await fetch(
    `${API_BASE_URL}/api/data/streams/pipelines?limit=${encodeURIComponent(String(limit))}`,
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch pipeline stream events: ${response.statusText}`);
  }
  return response.json();
}


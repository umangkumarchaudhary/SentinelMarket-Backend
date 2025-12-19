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


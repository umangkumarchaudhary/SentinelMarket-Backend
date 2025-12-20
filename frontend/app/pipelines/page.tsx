'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import {
  listPipelines,
  runPipeline,
  getAllPipelineHealth,
  getSchedulerStatus,
  getWarehouseStats,
  type Pipeline,
  type PipelineHealth,
  type WarehouseStats
} from '@/lib/api_data_engineering';
import { Exchange } from '@/lib/types';

// Demo data for instant load
const DEMO_PIPELINES: Pipeline[] = [
  { name: 'stock_data', description: 'ETL pipeline for stock price data', source: 'Yahoo Finance API', frequency: 'Every 5 minutes' },
  { name: 'social_media', description: 'ETL pipeline for social media mentions', source: 'Twitter & Telegram', frequency: 'Every 10 minutes' },
];

const DEMO_HEALTH: Record<string, PipelineHealth> = {
  stock_data: { pipeline: 'stock_data', status: 'healthy', success_rate: 98.5, total_runs: 288, success_count: 284, failure_count: 4, total_records_processed: 345600, average_duration_seconds: 3.2, runs_last_24h: 288, failures_last_24h: 1, timestamp: new Date().toISOString() },
  social_media: { pipeline: 'social_media', status: 'healthy', success_rate: 95.2, total_runs: 144, success_count: 137, failure_count: 7, total_records_processed: 28800, average_duration_seconds: 5.8, runs_last_24h: 144, failures_last_24h: 2, timestamp: new Date().toISOString() },
};

const DEMO_WAREHOUSE: WarehouseStats = { stock_records: 1250000, social_mentions: 45000, storage_type: 'SQLite + Data Lake' };

export default function PipelinesPage() {
  const [exchange, setExchange] = useState<Exchange>('nse');
  const [pipelines, setPipelines] = useState<Pipeline[]>(DEMO_PIPELINES);
  const [health, setHealth] = useState<Record<string, PipelineHealth>>(DEMO_HEALTH);
  const [schedulerStatus, setSchedulerStatus] = useState<any>({ is_running: true, jobs: [{ id: 'stock_pipeline', name: 'Stock Data Pipeline' }, { id: 'social_pipeline', name: 'Social Media Pipeline' }] });
  const [warehouseStats, setWarehouseStats] = useState<WarehouseStats | null>(DEMO_WAREHOUSE);
  const [isLoading, setIsLoading] = useState(false);
  const [isLiveData, setIsLiveData] = useState(false);
  const [runningPipeline, setRunningPipeline] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [pipelinesData, healthData, schedulerData, warehouseData] = await Promise.all([
        listPipelines(),
        getAllPipelineHealth(),
        getSchedulerStatus(),
        getWarehouseStats(),
      ]);

      setPipelines(pipelinesData.pipelines);
      setHealth(healthData.pipelines || {});
      setSchedulerStatus(schedulerData);
      setWarehouseStats(warehouseData);
      setIsLiveData(true);
    } catch (err) {
      console.error('Error loading pipeline data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunPipeline = async (pipelineName: string) => {
    setRunningPipeline(pipelineName);
    setError(null);
    try {
      const result = await runPipeline(pipelineName);
      if (result.success) {
        await loadData();
      } else {
        setError(`Pipeline failed: ${result.errors?.join(', ') || 'Unknown error'}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run pipeline');
    } finally {
      setRunningPipeline(null);
    }
  };

  // Calculate aggregate stats
  const totalRuns = Object.values(health).reduce((sum, h) => sum + (h?.total_runs || 0), 0);
  const avgSuccessRate = Object.values(health).length > 0
    ? Object.values(health).reduce((sum, h) => sum + (h?.success_rate || 0), 0) / Object.values(health).length
    : 0;
  const totalRecords = Object.values(health).reduce((sum, h) => sum + (h?.total_records_processed || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Header exchange={exchange} onExchangeChange={setExchange} />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Premium Header */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                ETL Pipeline Orchestra
              </h1>
              <p className="mt-1 text-slate-400">
                Enterprise-grade data pipelines powering real-time market intelligence
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isLoading && (
                <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-medium text-blue-400 animate-pulse">
                  Syncing...
                </span>
              )}
              {isLiveData ? (
                <span className="rounded-full bg-green-500/20 px-3 py-1.5 text-xs font-medium text-green-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                  Live Data
                </span>
              ) : (
                <span className="rounded-full bg-amber-500/20 px-3 py-1.5 text-xs font-medium text-amber-400">
                  Demo Mode
                </span>
              )}
              <button
                onClick={loadData}
                disabled={isLoading}
                className="rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2 text-sm font-medium text-white hover:from-cyan-500 hover:to-blue-500 transition-all duration-200 disabled:opacity-50"
              >
                ↻ Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Executive KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="rounded-xl bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/20 p-4">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-medium mb-1">
              <span>⚡</span> Scheduler Status
            </div>
            <div className="text-2xl font-bold text-white flex items-center gap-2">
              {schedulerStatus?.is_running ? (
                <>Active <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span></>
              ) : 'Stopped'}
            </div>
            <div className="text-xs text-slate-500">{schedulerStatus?.jobs?.length || 0} jobs scheduled</div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 p-4">
            <div className="flex items-center gap-2 text-blue-400 text-xs font-medium mb-1">
              <span>📊</span> Total Runs
            </div>
            <div className="text-2xl font-bold text-white">{totalRuns.toLocaleString()}</div>
            <div className="text-xs text-slate-500">Last 24 hours</div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 p-4">
            <div className="flex items-center gap-2 text-green-400 text-xs font-medium mb-1">
              <span>✅</span> Success Rate
            </div>
            <div className="text-2xl font-bold text-white">{avgSuccessRate.toFixed(1)}%</div>
            <div className="text-xs text-slate-500">Across all pipelines</div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 p-4">
            <div className="flex items-center gap-2 text-purple-400 text-xs font-medium mb-1">
              <span>📦</span> Records Processed
            </div>
            <div className="text-2xl font-bold text-white">{totalRecords.toLocaleString()}</div>
            <div className="text-xs text-slate-500">Total data points</div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400">
            <p className="font-medium">Error: {error}</p>
          </div>
        )}

        {/* Data Warehouse Stats */}
        {warehouseStats && (
          <div className="mb-6 rounded-xl bg-slate-800/50 border border-slate-700/50 p-5">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="text-xl">🗄️</span> Data Warehouse
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/20">
                <div className="text-sm text-slate-400">Stock Records</div>
                <div className="text-2xl font-bold text-cyan-400">{warehouseStats.stock_records.toLocaleString()}</div>
              </div>
              <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20">
                <div className="text-sm text-slate-400">Social Mentions</div>
                <div className="text-2xl font-bold text-purple-400">{warehouseStats.social_mentions.toLocaleString()}</div>
              </div>
              <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                <div className="text-sm text-slate-400">Storage Type</div>
                <div className="text-lg font-semibold text-blue-400">{warehouseStats.storage_type}</div>
              </div>
            </div>
          </div>
        )}

        {/* Pipeline Cards */}
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="text-xl">⚙️</span> Active Pipelines
        </h2>
        <div className="space-y-4">
          {pipelines.map((pipeline) => {
            const pipelineHealth = health[pipeline.name];
            const isStock = pipeline.name === 'stock_data';
            const gradientFrom = isStock ? 'from-cyan-500/10' : 'from-purple-500/10';
            const gradientTo = isStock ? 'to-cyan-600/5' : 'to-purple-600/5';
            const borderColor = isStock ? 'border-cyan-500/30' : 'border-purple-500/30';
            const accentColor = isStock ? 'text-cyan-400' : 'text-purple-400';

            return (
              <div
                key={pipeline.name}
                className={`rounded-xl bg-gradient-to-br ${gradientFrom} ${gradientTo} border ${borderColor} p-6 hover:shadow-xl transition-all duration-300`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{isStock ? '📈' : '💬'}</span>
                    <div>
                      <h3 className="text-xl font-bold text-white">{pipeline.name.replace('_', ' ').toUpperCase()}</h3>
                      <p className="text-sm text-slate-400 mt-1">{pipeline.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {pipelineHealth && (
                      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${pipelineHealth.status === 'healthy'
                        ? 'bg-green-500/20 text-green-400'
                        : pipelineHealth.status === 'degraded'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-red-500/20 text-red-400'
                        }`}>
                        {pipelineHealth.status.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-slate-500">Source</div>
                    <div className={`font-medium ${accentColor}`}>{pipeline.source}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Frequency</div>
                    <div className="font-medium text-white">{pipeline.frequency}</div>
                  </div>
                  {pipelineHealth && (
                    <>
                      <div>
                        <div className="text-xs text-slate-500">Success Rate</div>
                        <div className="font-medium text-green-400">{pipelineHealth.success_rate.toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Avg Duration</div>
                        <div className="font-medium text-white">{pipelineHealth.average_duration_seconds.toFixed(1)}s</div>
                      </div>
                    </>
                  )}
                </div>

                {pipelineHealth && (
                  <div className="mb-4 p-4 rounded-lg bg-slate-900/50 border border-slate-700/50">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-xs text-slate-500">Total Runs</div>
                        <div className="text-lg font-bold text-white">{pipelineHealth.total_runs}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Records Processed</div>
                        <div className="text-lg font-bold text-white">{pipelineHealth.total_records_processed.toLocaleString()}</div>
                      </div>
                      <div className="hidden md:block">
                        <div className="text-xs text-slate-500">Status</div>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${pipelineHealth.status === 'healthy' ? 'bg-green-400' : 'bg-amber-400'} animate-pulse`}></span>
                          <span className="text-white">Operational</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => handleRunPipeline(pipeline.name)}
                  disabled={runningPipeline === pipeline.name}
                  className={`px-6 py-2.5 rounded-lg font-medium text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${isStock
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-500/25'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-500/25'
                    }`}
                >
                  {runningPipeline === pipeline.name ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Running...
                    </span>
                  ) : '▶ Run Now'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-8 p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <span>🟢 Scheduler: {schedulerStatus?.is_running ? 'Active' : 'Stopped'}</span>
              <span>📊 {pipelines.length} Pipelines</span>
              <span>🔄 Auto-refresh: 30s</span>
            </div>
            <div>
              Powered by APScheduler + FastAPI
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

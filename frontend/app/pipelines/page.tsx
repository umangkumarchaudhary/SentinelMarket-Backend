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
  type PipelineResult,
  type WarehouseStats
} from '@/lib/api_data_engineering';
import { Exchange } from '@/lib/types';

export default function PipelinesPage() {
  const [exchange, setExchange] = useState<Exchange>('nse');
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [health, setHealth] = useState<Record<string, PipelineHealth>>({});
  const [schedulerStatus, setSchedulerStatus] = useState<any>(null);
  const [warehouseStats, setWarehouseStats] = useState<WarehouseStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [runningPipeline, setRunningPipeline] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    // Refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pipeline data');
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
        // Reload data after successful run
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800';
      case 'unhealthy':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header exchange={exchange} onExchangeChange={setExchange} />
      
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black">Data Engineering Pipelines</h1>
          <p className="mt-2 text-gray-600">
            Monitor and manage ETL pipelines for stock and social media data
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2 text-gray-600">Loading pipeline data...</p>
          </div>
        ) : (
          <>
            {/* Scheduler Status */}
            {schedulerStatus && (
              <div className="mb-6 rounded-lg bg-white shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Scheduler Status</h2>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    schedulerStatus.is_running ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {schedulerStatus.is_running ? 'Running' : 'Stopped'}
                  </span>
                  <span className="text-sm text-gray-600">
                    {schedulerStatus.jobs?.length || 0} jobs scheduled
                  </span>
                </div>
              </div>
            )}

            {/* Warehouse Stats */}
            {warehouseStats && (
              <div className="mb-6 rounded-lg bg-white shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Data Warehouse</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Stock Records</p>
                    <p className="text-2xl font-bold text-blue-600">{warehouseStats.stock_records.toLocaleString()}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Social Mentions</p>
                    <p className="text-2xl font-bold text-purple-600">{warehouseStats.social_mentions.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Storage Type</p>
                    <p className="text-lg font-semibold text-gray-800">{warehouseStats.storage_type}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Pipelines */}
            <div className="space-y-6">
              {pipelines.map((pipeline) => {
                const pipelineHealth = health[pipeline.name];
                return (
                  <div key={pipeline.name} className="rounded-lg bg-white shadow p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-black">{pipeline.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{pipeline.description}</p>
                      </div>
                      {pipelineHealth && (
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(pipelineHealth.status)}`}>
                          {pipelineHealth.status.toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Source</p>
                        <p className="font-medium">{pipeline.source}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Frequency</p>
                        <p className="font-medium">{pipeline.frequency}</p>
                      </div>
                    </div>

                    {pipelineHealth && (
                      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Success Rate</p>
                            <p className="font-semibold text-lg">{pipelineHealth.success_rate.toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Total Runs</p>
                            <p className="font-semibold text-lg">{pipelineHealth.total_runs}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Records Processed</p>
                            <p className="font-semibold text-lg">{pipelineHealth.total_records_processed.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Avg Duration</p>
                            <p className="font-semibold text-lg">{pipelineHealth.average_duration_seconds.toFixed(1)}s</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => handleRunPipeline(pipeline.name)}
                      disabled={runningPipeline === pipeline.name}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {runningPipeline === pipeline.name ? 'Running...' : 'Run Now'}
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}


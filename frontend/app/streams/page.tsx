'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { getPipelineStreamEvents, type PipelineStreamEvent } from '@/lib/api_data_engineering';
import { Exchange } from '@/lib/types';

// Demo events for instant load
const DEMO_EVENTS: PipelineStreamEvent[] = [
  { topic: 'pipeline_runs', timestamp: new Date(Date.now() - 60000).toISOString(), payload: { pipeline: 'stock_data', success: true, records_loaded: 1250, duration_seconds: 3.2, timestamp: new Date(Date.now() - 60000).toISOString() } },
  { topic: 'pipeline_runs', timestamp: new Date(Date.now() - 180000).toISOString(), payload: { pipeline: 'social_media', success: true, records_loaded: 342, duration_seconds: 5.8, timestamp: new Date(Date.now() - 180000).toISOString() } },
  { topic: 'pipeline_runs', timestamp: new Date(Date.now() - 300000).toISOString(), payload: { pipeline: 'stock_data', success: true, records_loaded: 1180, duration_seconds: 2.9, timestamp: new Date(Date.now() - 300000).toISOString() } },
  { topic: 'pipeline_runs', timestamp: new Date(Date.now() - 420000).toISOString(), payload: { pipeline: 'stock_data', success: false, records_loaded: 0, duration_seconds: 1.2, timestamp: new Date(Date.now() - 420000).toISOString() } },
  { topic: 'pipeline_runs', timestamp: new Date(Date.now() - 540000).toISOString(), payload: { pipeline: 'social_media', success: true, records_loaded: 289, duration_seconds: 4.5, timestamp: new Date(Date.now() - 540000).toISOString() } },
  { topic: 'pipeline_runs', timestamp: new Date(Date.now() - 660000).toISOString(), payload: { pipeline: 'stock_data', success: true, records_loaded: 1320, duration_seconds: 3.5, timestamp: new Date(Date.now() - 660000).toISOString() } },
];

export default function StreamsPage() {
  const [exchange, setExchange] = useState<Exchange>('nse');
  const [events, setEvents] = useState<PipelineStreamEvent[]>(DEMO_EVENTS);
  const [isLoading, setIsLoading] = useState(false);
  const [isLiveData, setIsLiveData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getPipelineStreamEvents(50);
      if (data.events && data.events.length > 0) {
        setEvents(data.events);
        setIsLiveData(true);
      }
    } catch (err) {
      console.error('Error loading stream events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
    const interval = setInterval(loadEvents, 5000);
    return () => clearInterval(interval);
  }, []);

  // Calculate stats
  const successCount = events.filter(e => e.payload.success).length;
  const failCount = events.filter(e => !e.payload.success).length;
  const successRate = events.length > 0 ? (successCount / events.length) * 100 : 0;
  const totalRecords = events.reduce((sum, e) => sum + (e.payload.records_loaded || 0), 0);
  const avgDuration = events.length > 0 ? events.reduce((sum, e) => sum + (e.payload.duration_seconds || 0), 0) / events.length : 0;

  // Format time ago
  const timeAgo = (timestamp: string) => {
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Header exchange={exchange} onExchangeChange={setExchange} />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Premium Header */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                Real-Time Event Stream
              </h1>
              <p className="mt-1 text-slate-400">
                Live pipeline execution monitoring and event log
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isLoading && (
                <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-medium text-amber-400 animate-pulse">
                  Polling...
                </span>
              )}
              <span className="rounded-full bg-green-500/20 px-3 py-1.5 text-xs font-medium text-green-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                Live Stream
              </span>
              <span className="text-xs text-slate-500">Auto-refresh: 5s</span>
            </div>
          </div>
        </div>

        {/* Executive KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          <div className="rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 p-4">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-medium mb-1">
              <span>📡</span> Events Captured
            </div>
            <div className="text-2xl font-bold text-white">{events.length}</div>
            <div className="text-xs text-slate-500">In stream buffer</div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 p-4">
            <div className="flex items-center gap-2 text-green-400 text-xs font-medium mb-1">
              <span>✅</span> Success Rate
            </div>
            <div className="text-2xl font-bold text-white">{successRate.toFixed(1)}%</div>
            <div className="text-xs text-slate-500">{successCount} succeeded</div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 p-4">
            <div className="flex items-center gap-2 text-red-400 text-xs font-medium mb-1">
              <span>❌</span> Failures
            </div>
            <div className="text-2xl font-bold text-white">{failCount}</div>
            <div className="text-xs text-slate-500">Need attention</div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 p-4">
            <div className="flex items-center gap-2 text-blue-400 text-xs font-medium mb-1">
              <span>📦</span> Records Loaded
            </div>
            <div className="text-2xl font-bold text-white">{totalRecords.toLocaleString()}</div>
            <div className="text-xs text-slate-500">Total in window</div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 p-4">
            <div className="flex items-center gap-2 text-purple-400 text-xs font-medium mb-1">
              <span>⏱️</span> Avg Duration
            </div>
            <div className="text-2xl font-bold text-white">{avgDuration.toFixed(2)}s</div>
            <div className="text-xs text-slate-500">Per pipeline run</div>
          </div>
        </div>

        {/* Event Stream Table */}
        <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="text-xl">📜</span> Event Log
            </h2>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              <span className="text-xs text-slate-400">Live</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-700/50">
              <thead className="bg-slate-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Pipeline</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Records</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {events.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <span className="text-4xl block mb-4">📡</span>
                      <p className="text-slate-400">No pipeline events yet</p>
                      <p className="text-sm text-slate-500 mt-1">
                        Run a pipeline from the <a href="/pipelines" className="text-amber-400 underline">Pipelines page</a>
                      </p>
                    </td>
                  </tr>
                ) : (
                  events.map((event, idx) => (
                    <tr
                      key={`${event.timestamp}-${idx}`}
                      className={`hover:bg-slate-700/30 transition-colors ${idx === 0 ? 'bg-amber-500/5' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">{timeAgo(event.timestamp)}</div>
                        <div className="text-xs text-slate-500">{new Date(event.timestamp).toLocaleTimeString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{event.payload.pipeline === 'stock_data' ? '📈' : '💬'}</span>
                          <span className={`font-medium ${event.payload.pipeline === 'stock_data' ? 'text-cyan-400' : 'text-purple-400'}`}>
                            {event.payload.pipeline.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${event.payload.success
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                          }`}>
                          {event.payload.success ? '✓ SUCCESS' : '✗ FAILED'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-white font-medium">{event.payload.records_loaded.toLocaleString()}</span>
                        <span className="text-slate-500 text-sm"> records</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-white">{event.payload.duration_seconds.toFixed(2)}s</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <span>📡 StreamProcessor: Active</span>
              <span>🔄 Buffer: {events.length}/1000</span>
              <span>⏱️ Polling: 5s intervals</span>
            </div>
            <div>
              Powered by FastAPI + In-Memory Streaming
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

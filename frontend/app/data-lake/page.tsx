'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import {
  getDataLakeStats,
  listDataLakeSources,
  listDataLakeDates,
  getDataLakeData,
  type DataLakeStats,
  type DataLakeData
} from '@/lib/api_data_engineering';
import { Exchange } from '@/lib/types';

// Demo data for instant load
const DEMO_STATS: DataLakeStats = {
  base_path: 'backend/data_lake',
  sources: ['yahoo_finance', 'telegram', 'twitter'],
  total_files: 42,
  total_size_bytes: 8912896,
  total_size_mb: 8.5
};

const DEMO_SOURCES = ['yahoo_finance', 'telegram', 'twitter'];
const DEMO_DATES = ['2024/12/19', '2024/12/20', '2024/12/21'];

export default function DataLakePage() {
  const [exchange, setExchange] = useState<Exchange>('nse');
  const [stats, setStats] = useState<DataLakeStats | null>(DEMO_STATS);
  const [sources, setSources] = useState<string[]>(DEMO_SOURCES);
  const [selectedSource, setSelectedSource] = useState<string>('yahoo_finance');
  const [dates, setDates] = useState<string[]>(DEMO_DATES);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [data, setData] = useState<DataLakeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLiveData, setIsLiveData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
    loadSources();
  }, []);

  useEffect(() => {
    if (selectedSource) {
      loadDates(selectedSource);
    }
  }, [selectedSource]);

  useEffect(() => {
    if (selectedSource && selectedDate) {
      loadData(selectedSource, selectedDate);
    }
  }, [selectedSource, selectedDate]);

  const loadStats = async () => {
    try {
      const statsData = await getDataLakeStats();
      setStats(statsData);
      setIsLiveData(true);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const loadSources = async () => {
    try {
      const response = await listDataLakeSources();
      if (response.sources && response.sources.length > 0) {
        setSources(response.sources);
        setSelectedSource(response.sources[0]);
      }
    } catch (err) {
      console.error('Error loading sources:', err);
    }
  };

  const loadDates = async (source: string) => {
    try {
      const response = await listDataLakeDates(source);
      setDates(response.dates || []);
      if (response.dates && response.dates.length > 0) {
        setSelectedDate(response.dates[response.dates.length - 1]);
      }
    } catch (err) {
      console.error('Error loading dates:', err);
    }
  };

  const loadData = async (source: string, date: string) => {
    setIsLoading(true);
    try {
      const dataResponse = await getDataLakeData(source, date);
      setData(dataResponse);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Source icon mapping
  const getSourceIcon = (source: string) => {
    if (source.includes('yahoo') || source.includes('stock')) return '📈';
    if (source.includes('telegram')) return '💬';
    if (source.includes('twitter')) return '🐦';
    return '📁';
  };

  const getSourceColor = (source: string) => {
    if (source.includes('yahoo') || source.includes('stock')) return 'cyan';
    if (source.includes('telegram')) return 'blue';
    if (source.includes('twitter')) return 'sky';
    return 'slate';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Header exchange={exchange} onExchangeChange={setExchange} />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Premium Header */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">
                Data Lake Explorer
              </h1>
              <p className="mt-1 text-slate-400">
                Immutable raw data storage for compliance and audit trails
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isLoading && (
                <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-medium text-blue-400 animate-pulse">
                  Loading...
                </span>
              )}
              {isLiveData ? (
                <span className="rounded-full bg-green-500/20 px-3 py-1.5 text-xs font-medium text-green-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                  Connected
                </span>
              ) : (
                <span className="rounded-full bg-amber-500/20 px-3 py-1.5 text-xs font-medium text-amber-400">
                  Demo Mode
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Executive KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 p-4">
            <div className="flex items-center gap-2 text-blue-400 text-xs font-medium mb-1">
              <span>📁</span> Total Files
            </div>
            <div className="text-2xl font-bold text-white">{stats?.total_files.toLocaleString() || 0}</div>
            <div className="text-xs text-slate-500">Raw data files</div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 border border-indigo-500/20 p-4">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-medium mb-1">
              <span>💾</span> Storage Used
            </div>
            <div className="text-2xl font-bold text-white">{stats?.total_size_mb || 0} MB</div>
            <div className="text-xs text-slate-500">Compressed (gzip)</div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-violet-500/10 to-violet-600/5 border border-violet-500/20 p-4">
            <div className="flex items-center gap-2 text-violet-400 text-xs font-medium mb-1">
              <span>📡</span> Data Sources
            </div>
            <div className="text-2xl font-bold text-white">{stats?.sources.length || 0}</div>
            <div className="text-xs text-slate-500">Active integrations</div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 p-4">
            <div className="flex items-center gap-2 text-purple-400 text-xs font-medium mb-1">
              <span>📂</span> Partitions
            </div>
            <div className="text-2xl font-bold text-white">{dates.length}</div>
            <div className="text-xs text-slate-500">Date partitions</div>
          </div>
        </div>

        {/* Empty State */}
        {stats && stats.total_files === 0 && (
          <div className="mb-6 rounded-xl bg-blue-500/10 border border-blue-500/30 p-6">
            <div className="flex items-start gap-4">
              <span className="text-3xl">📁</span>
              <div>
                <h3 className="font-semibold text-white">Data Lake is Empty</h3>
                <p className="text-sm text-slate-400 mt-1">
                  The data lake stores raw, unprocessed data from pipeline runs. To populate it:
                </p>
                <ol className="list-decimal list-inside mt-2 text-sm text-slate-400 space-y-1">
                  <li>Go to the <a href="/pipelines" className="text-blue-400 underline">Pipelines page</a></li>
                  <li>Click "Run Now" on any pipeline</li>
                  <li>Raw data will appear here after the run completes</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* Source Selector */}
        <div className="mb-6 rounded-xl bg-slate-800/50 border border-slate-700/50 p-5">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-xl">🔍</span> Browse Raw Data
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Data Source</label>
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none"
              >
                {sources.map((source) => (
                  <option key={source} value={source}>
                    {getSourceIcon(source)} {source.replace('_', ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Date Partition</label>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                disabled={!selectedSource || dates.length === 0}
                className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none disabled:opacity-50"
              >
                {dates.length === 0 ? (
                  <option>No dates available</option>
                ) : (
                  dates.map((date) => (
                    <option key={date} value={date}>
                      📅 {date}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
        </div>

        {/* Source Cards */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">Available Sources</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sources.map((source) => {
              const icon = getSourceIcon(source);
              const isSelected = source === selectedSource;
              return (
                <button
                  key={source}
                  onClick={() => setSelectedSource(source)}
                  className={`p-4 rounded-xl border text-left transition-all duration-200 ${isSelected
                    ? 'bg-blue-500/20 border-blue-500/50 shadow-lg shadow-blue-500/10'
                    : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{icon}</span>
                    <div>
                      <div className={`font-medium ${isSelected ? 'text-blue-400' : 'text-white'}`}>
                        {source.replace('_', ' ').toUpperCase()}
                      </div>
                      <div className="text-xs text-slate-500">
                        {source.includes('yahoo') ? 'Stock price data' :
                          source.includes('telegram') ? 'Channel messages' :
                            source.includes('twitter') ? 'Tweets & mentions' : 'Raw data'}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Data Display */}
        {data && (
          <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <span className="text-xl">{getSourceIcon(data.source)}</span>
                  Raw Data: {data.source.toUpperCase()}
                </h2>
                <p className="text-sm text-slate-400">Date: {data.date}</p>
              </div>
              <div className="text-sm text-slate-400">
                {data.records} record(s)
              </div>
            </div>
            <div className="p-6">
              <pre className="bg-slate-900/70 p-4 rounded-lg text-xs text-slate-300 overflow-auto max-h-96 font-mono">
                {JSON.stringify(data.data, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {!data && selectedSource && selectedDate && !isLoading && (
          <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-12 text-center">
            <span className="text-4xl block mb-4">📭</span>
            <p className="text-slate-400">No data available for {selectedSource} on {selectedDate}</p>
            <p className="text-sm text-slate-500 mt-1">
              Run a pipeline to generate raw data files
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <span>🗄️ DataLake class: Active</span>
              <span>📁 {stats?.total_files || 0} files</span>
              <span>💾 {stats?.total_size_mb || 0} MB stored</span>
            </div>
            <div>
              Immutable storage for audit compliance
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

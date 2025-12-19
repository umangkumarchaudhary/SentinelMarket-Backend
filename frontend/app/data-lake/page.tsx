"use client";

import { useState, useEffect } from "react";
import { getDataLakeStats, listDataLakeSources, listDataLakeDates, getDataLakeData, DataLakeStats, DataLakeSource, DataLakeData } from "@/lib/api_data_engineering";

export default function DataLakePage() {
  const [stats, setStats] = useState<DataLakeStats | null>(null);
  const [sources, setSources] = useState<string[]>([]);
  const [selectedSource, setSelectedSource] = useState<string>("");
  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [data, setData] = useState<DataLakeData | null>(null);
  const [loading, setLoading] = useState(true);
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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSources = async () => {
    try {
      const response = await listDataLakeSources();
      setSources(response.sources);
      if (response.sources.length > 0) {
        setSelectedSource(response.sources[0]);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const loadDates = async (source: string) => {
    try {
      const response = await listDataLakeDates(source);
      setDates(response.dates);
      if (response.dates.length > 0) {
        setSelectedDate(response.dates[response.dates.length - 1]); // Latest date
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const loadData = async (source: string, date: string) => {
    try {
      setLoading(true);
      const dataResponse = await getDataLakeData(source, date);
      setData(dataResponse);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">Loading data lake...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Data Lake Browser</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Empty State Message */}
        {stats && stats.total_files === 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-blue-900">Data Lake is Empty</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>The data lake stores raw, unprocessed data from pipeline runs. To populate it:</p>
                  <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li>Go to the <a href="/pipelines" className="underline font-semibold">Pipelines page</a></li>
                    <li>Click "Run Pipeline" on the <strong>stock_data</strong> or <strong>social_media</strong> pipeline</li>
                    <li>After the pipeline completes, raw data will appear here</li>
                  </ol>
                  <p className="mt-3 font-semibold">The data lake automatically stores raw API responses during the Extract phase of ETL pipelines.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Statistics */}
        {stats && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Data Lake Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-500">Total Files</div>
                <div className="text-2xl font-bold">{stats.total_files.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Total Size</div>
                <div className="text-2xl font-bold">{stats.total_size_mb} MB</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Sources</div>
                <div className="text-2xl font-bold">{stats.sources.length}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Base Path</div>
                <div className="text-sm font-mono text-gray-600 truncate">{stats.base_path}</div>
              </div>
            </div>
          </div>
        )}

        {/* Source and Date Selection */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Browse Raw Data</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Source
              </label>
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                {sources.map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                disabled={!selectedSource || dates.length === 0}
              >
                {dates.length === 0 ? (
                  <option>No dates available</option>
                ) : (
                  dates.map((date) => (
                    <option key={date} value={date}>
                      {date}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
        </div>

        {/* Data Display */}
        {data && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              Raw Data: {data.source} - {data.date}
            </h2>
            <div className="mb-4 text-sm text-gray-600">
              {data.records} record(s) found
            </div>
            <div className="overflow-x-auto">
              <pre className="bg-gray-50 p-4 rounded text-xs overflow-auto max-h-96">
                {JSON.stringify(data.data, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {!data && selectedSource && selectedDate && (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
            No data available for {selectedSource} on {selectedDate}
          </div>
        )}
      </div>
    </div>
  );
}


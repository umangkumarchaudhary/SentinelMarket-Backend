'use client';

import { useEffect, useState, useCallback } from 'react';
import { Header } from '@/components/Header';
import { StatsCards } from '@/components/StatsCards';
import { StockTable } from '@/components/StockTable';
import { RefreshIndicator } from '@/components/RefreshIndicator';
import { Toast } from '@/components/Toast';
import { useAutoRefresh } from '@/lib/hooks/useAutoRefresh';
import { getStocks, getAnalytics, type Stock, type Analytics } from '@/lib/api';
import { Exchange } from '@/lib/types';

export default function Home() {
  const [exchange, setExchange] = useState<Exchange>('nse');
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [stocksData, analyticsData] = await Promise.all([
        getStocks(exchange, undefined, 100, 0),
        getAnalytics(exchange),
      ]);
      setStocks(stocksData.stocks);
      setAnalytics(analyticsData);
      if (toast === null) {
        // Only show success toast on manual refresh, not auto-refresh
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);
      setToast({ message: errorMessage, type: 'error' });
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [exchange, toast]);

  const { lastRefresh, isRefreshing, refresh } = useAutoRefresh({
    interval: 30000, // 30 seconds
    enabled: autoRefreshEnabled && !isLoading,
    onRefresh: loadData,
  });

  useEffect(() => {
    loadData();
  }, [exchange]);

  const handleManualRefresh = async () => {
    await refresh();
    setToast({ message: 'Data refreshed successfully', type: 'success' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header exchange={exchange} onExchangeChange={setExchange} />
      
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black">Dashboard</h1>
              <p className="mt-2 text-gray-600">
                Real-time stock anomaly detection for {exchange.toUpperCase()}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <RefreshIndicator lastRefresh={lastRefresh} isRefreshing={isRefreshing} />
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={autoRefreshEnabled}
                  onChange={(e) => setAutoRefreshEnabled(e.target.checked)}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-600"
                />
                Auto-refresh
              </label>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-4 text-red-800">
            <p className="font-medium">Error: {error}</p>
            <button
              onClick={handleManualRefresh}
              className="mt-2 text-sm text-red-600 underline hover:text-red-800"
            >
              Retry
            </button>
          </div>
        )}

        {/* Toast Notification */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        {/* Stats Cards */}
        <div className="mb-8">
          <StatsCards analytics={analytics} isLoading={isLoading} />
        </div>

        {/* Stock Table */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-black">Stocks</h2>
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRefreshing ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Refreshing...
                </>
              ) : (
                <>
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Refresh
                </>
              )}
            </button>
          </div>
          <StockTable stocks={stocks} isLoading={isLoading} />
        </div>
      </main>
    </div>
  );
}

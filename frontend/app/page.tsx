'use client';

import { useEffect, useState, useCallback } from 'react';
import { Header } from '@/components/Header';
import { TechShowcase } from '@/components/TechShowcase';
import { HowItWorks } from '@/components/HowItWorks';
import { LiveAnomalyFeed } from '@/components/LiveAnomalyFeed';
import { LiveStats } from '@/components/LiveStats';
import { StatsCards } from '@/components/StatsCards';
import { StockTable } from '@/components/StockTable';
import { RefreshIndicator } from '@/components/RefreshIndicator';
import { Footer } from '@/components/Footer';
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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);
      setToast({ message: errorMessage, type: 'error' });
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [exchange]);

  const { lastRefresh, isRefreshing, refresh } = useAutoRefresh({
    interval: 30000,
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
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Header exchange={exchange} onExchangeChange={setExchange} />

      {/* Main Content */}
      <main className="relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30 pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Tech Showcase - Hero Section for Recruiters */}
          <TechShowcase />

          {/* How It Works - Pipeline Explanation */}
          <HowItWorks />

          {/* Live Anomaly Feed - Shows real-time detection */}
          <LiveAnomalyFeed />

          {/* Live System Stats */}
          <LiveStats />

          {/* Page Header */}
          <div className="mb-8 animate-slide-up">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1
                  className="text-2xl sm:text-3xl font-bold tracking-tight"
                  style={{ color: 'var(--foreground)' }}
                >
                  Dashboard
                </h1>
                <p
                  className="mt-1 text-sm sm:text-base"
                  style={{ color: 'var(--foreground-muted)' }}
                >
                  Real-time stock anomaly detection for {exchange.toUpperCase()}
                </p>
              </div>

              <div className="flex items-center gap-3 sm:gap-4">
                <RefreshIndicator lastRefresh={lastRefresh} isRefreshing={isRefreshing} />

                {/* Auto-refresh toggle */}
                <label
                  className="flex items-center gap-2 text-sm cursor-pointer select-none"
                  style={{ color: 'var(--foreground-secondary)' }}
                >
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={autoRefreshEnabled}
                      onChange={(e) => setAutoRefreshEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 rounded-full transition-colors peer-checked:bg-red-600 bg-zinc-700" />
                    <div className="absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white transition-transform peer-checked:translate-x-4" />
                  </div>
                  <span className="hidden sm:inline">Auto-refresh</span>
                </label>
              </div>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div
              className="mb-6 rounded-xl p-4 animate-slide-up"
              style={{
                background: 'rgba(220, 38, 38, 0.1)',
                border: '1px solid rgba(220, 38, 38, 0.3)',
                color: 'var(--danger)'
              }}
            >
              <p className="font-medium">Error: {error}</p>
              <button
                onClick={handleManualRefresh}
                className="mt-2 text-sm underline hover:no-underline opacity-80 hover:opacity-100"
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
          <div className="mb-8 stagger-children">
            <StatsCards analytics={analytics} isLoading={isLoading} />
          </div>

          {/* Stock Table Section */}
          <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2
                className="text-lg sm:text-xl font-semibold"
                style={{ color: 'var(--foreground)' }}
              >
                Stocks Overview
              </h2>
              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                style={{ background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)' }}
              >
                {isRefreshing ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Refreshing...</span>
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Refresh</span>
                  </>
                )}
              </button>
            </div>
            <StockTable stocks={stocks} isLoading={isLoading} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}


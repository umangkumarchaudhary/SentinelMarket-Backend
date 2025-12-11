'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { getAnalytics, getHeatmapData, getCorrelationMatrix, type Analytics } from '@/lib/api';
import { Exchange } from '@/lib/types';
import RiskHeatmap from '@/components/RiskHeatmap';
import CorrelationHeatmap from '@/components/CorrelationHeatmap';

export default function AnalyticsPage() {
  const router = useRouter();
  const [exchange, setExchange] = useState<Exchange>('nse');
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [heatmapData, setHeatmapData] = useState<any>(null);
  const [correlationData, setCorrelationData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [exchange]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [analyticsData, heatmap, correlation] = await Promise.allSettled([
        getAnalytics(exchange),
        getHeatmapData(exchange, 50),
        getCorrelationMatrix(exchange, undefined, 20),
      ]);
      
      if (analyticsData.status === 'fulfilled') setAnalytics(analyticsData.value);
      if (heatmap.status === 'fulfilled') setHeatmapData(heatmap.value);
      if (correlation.status === 'fulfilled') setCorrelationData(correlation.value);
      
      if (analyticsData.status === 'rejected') {
        setError(analyticsData.reason instanceof Error ? analyticsData.reason.message : 'Failed to load analytics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
      console.error('Error loading analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header exchange={exchange} onExchangeChange={setExchange} />
      
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black">Analytics & Insights</h1>
          <p className="mt-2 text-gray-600">
            Overall system statistics for {exchange.toUpperCase()}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-4 text-red-800">
            <p className="font-medium">Error: {error}</p>
            <button
              onClick={loadAnalytics}
              className="mt-2 text-sm text-red-600 underline hover:text-red-800"
            >
              Retry
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="h-64 animate-pulse rounded-lg bg-gray-200"></div>
        ) : analytics ? (
          <div className="space-y-6">
            {/* Risk Distribution */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-xl font-semibold text-black">Risk Distribution</h2>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-lg bg-green-50 p-4">
                  <p className="text-sm text-gray-600">Low Risk</p>
                  <p className="text-2xl font-bold text-green-600">
                    {analytics.risk_distribution.low}
                  </p>
                </div>
                <div className="rounded-lg bg-yellow-50 p-4">
                  <p className="text-sm text-gray-600">Medium Risk</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {analytics.risk_distribution.medium}
                  </p>
                </div>
                <div className="rounded-lg bg-orange-50 p-4">
                  <p className="text-sm text-gray-600">High Risk</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {analytics.risk_distribution.high}
                  </p>
                </div>
                <div className="rounded-lg bg-red-50 p-4">
                  <p className="text-sm text-gray-600">Extreme Risk</p>
                  <p className="text-2xl font-bold text-red-600">
                    {analytics.risk_distribution.extreme}
                  </p>
                </div>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-lg border border-gray-200 bg-white p-6">
                <p className="text-sm font-medium text-gray-600">Total Stocks</p>
                <p className="mt-2 text-3xl font-bold text-black">
                  {analytics.total_stocks}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-6">
                <p className="text-sm font-medium text-gray-600">High Risk Count</p>
                <p className="mt-2 text-3xl font-bold text-red-600">
                  {analytics.high_risk_count}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-6">
                <p className="text-sm font-medium text-gray-600">Average Risk Score</p>
                <p className="mt-2 text-3xl font-bold text-black">
                  {analytics.average_risk_score.toFixed(1)}
                </p>
                <p className="mt-1 text-xs text-gray-500">Out of 100</p>
              </div>
            </div>

            {/* Phase 5B: Advanced Visualizations */}
            {heatmapData && heatmapData.heatmap && (
              <div className="mt-6">
                <RiskHeatmap data={heatmapData.heatmap} />
              </div>
            )}

            {correlationData && correlationData.correlation && (
              <div className="mt-6">
                <CorrelationHeatmap correlation={correlationData.correlation} tickers={correlationData.tickers} />
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
            <p className="text-gray-500">No analytics data available</p>
          </div>
        )}

        <div className="mt-8">
          <button
            onClick={loadAnalytics}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Refresh Analytics
          </button>
        </div>
      </main>
    </div>
  );
}

